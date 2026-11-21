import QueueToken from '../models/QueueToken.js';
import Barber from '../models/Barber.js';
import SalonConfig from '../models/SalonConfig.js';

/**
 * Valid transitions map - strictly one-way state machine
 */
const VALID_TRANSITIONS = {
  Waiting: ['Called', 'Cancelled'],
  Called: ['In chair', 'No-show'],
  'In chair': ['Done'],
  Done: [],
  Cancelled: [],
  'No-show': []
};

/**
 * Validate if a status transition is permitted
 */
export const canTransition = (currentStatus, newStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};

/**
 * Check if online joining is currently allowed
 * - Checks master queue switch in salon config
 * - Checks current time against closing time - 30 minutes (8:30 PM default)
 */
export const isOnlineJoiningAllowed = async () => {
  const config = await SalonConfig.findOne();
  if (!config) return { allowed: true, reason: '' };

  if (!config.isMasterQueueOpen) {
    return {
      allowed: false,
      reason: 'Online queue joining is currently closed by salon management.'
    };
  }

  // Check closing cutoff time
  const now = new Date();
  const [closingHours, closingMinutes] = config.closingTime.split(':').map(Number);
  
  // Cutoff is closing time minus cutoff minutes (e.g. 21:00 - 30m = 20:30)
  const cutoffTotalMinutes = closingHours * 60 + closingMinutes - (config.onlineJoiningCutoffMinutes || 30);
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentTotalMinutes >= cutoffTotalMinutes) {
    const cutoffH = Math.floor(cutoffTotalMinutes / 60);
    const cutoffM = cutoffTotalMinutes % 60;
    const formattedCutoff = `${cutoffH % 12 || 12}:${cutoffM.toString().padStart(2, '0')} ${cutoffH >= 12 ? 'PM' : 'AM'}`;
    return {
      allowed: false,
      reason: `Online joining closed at ${formattedCutoff} (30 mins before closing). Walk-ins are still accepted at reception.`
    };
  }

  return { allowed: true, reason: '' };
};

/**
 * Find active token for a given phone number
 * Active statuses: 'Waiting', 'Called', 'In chair'
 */
export const findActiveTokenByPhone = async (phone) => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  return await QueueToken.findOne({
    phone: cleanPhone,
    status: { $in: ['Waiting', 'Called', 'In chair'] }
  });
};

/**
 * Generate next daily token number (e.g. S-1, S-2, ...)
 */
export const generateNextTokenNumber = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const countToday = await QueueToken.countDocuments({
    joinedAt: { $gte: todayStart }
  });

  const nextSeq = countToday + 1;
  return {
    tokenNumber: `S-${nextSeq}`,
    tokenSequence: nextSeq
  };
};

/**
 * Calculate estimated wait time
 * Formula: Total minutes of services ahead / Number of active (on-duty & not on break) barbers
 * If active barbers = 0, returns { waitMinutes: 0, isPaused: true, message: "Paused — all barbers on break" }
 */
export const calculateWaitStats = async (forTokenId = null) => {
  // 1. Get active barbers (isOnDuty=true and status!='On break')
  const activeBarbers = await Barber.find({
    isOnDuty: true,
    status: { $ne: 'On break' }
  });

  const activeCount = activeBarbers.length;

  // 2. Calculate service minutes of all waiting customers ahead
  const query = { status: 'Waiting' };
  
  // If calculating for a specific token, only count tokens ahead in line
  if (forTokenId) {
    const targetToken = await QueueToken.findById(forTokenId);
    if (targetToken) {
      query.tokenSequence = { $lt: targetToken.tokenSequence };
    }
  }

  const waitingTokens = await QueueToken.find(query);
  const totalMinutesAhead = waitingTokens.reduce((sum, token) => sum + (token.totalDuration || 0), 0);

  if (activeCount === 0) {
    return {
      activeBarbersCount: 0,
      totalMinutesAhead,
      waitMinutes: 0,
      isPaused: true,
      message: 'Paused — all barbers on break',
      waitingCount: waitingTokens.length
    };
  }

  const estimatedMinutes = Math.round(totalMinutesAhead / activeCount);

  return {
    activeBarbersCount: activeCount,
    totalMinutesAhead,
    waitMinutes: estimatedMinutes,
    isPaused: false,
    message: `About ${estimatedMinutes} min`,
    waitingCount: waitingTokens.length
  };
};

/**
 * First-Come, First-Served & Barber Matching
 * Tapping [Call next] for Barber X selects earliest Waiting customer
 * who requested Barber X or 'Any'.
 * A customer who chose a specific barber is NEVER assigned to another barber.
 * Each barber serves at most 1 customer in the chair at a time.
 */
export const matchNextCustomerForBarber = async (barberId) => {
  const barber = await Barber.findById(barberId);
  if (!barber) throw new Error('Barber not found');

  // Verify barber is not on break
  if (barber.status === 'On break') {
    throw new Error(`${barber.name} is currently on break.`);
  }

  // Check if barber already has a customer in chair or called
  if (barber.currentCustomer && barber.currentCustomer.tokenId) {
    const currentToken = await QueueToken.findById(barber.currentCustomer.tokenId);
    if (currentToken && ['Called', 'In chair'].includes(currentToken.status)) {
      throw new Error(`${barber.name} already has an active customer (${barber.currentCustomer.tokenNumber}). Complete or conclude current session first.`);
    }
  }

  // FCFS: Find earliest 'Waiting' customer where preferredBarber is this barberId OR null ('Any')
  const nextToken = await QueueToken.findOne({
    status: 'Waiting',
    $or: [
      { preferredBarber: barberId },
      { preferredBarber: null },
      { preferredBarber: { $exists: false } }
    ]
  }).sort({ tokenSequence: 1 });

  return nextToken;
};
