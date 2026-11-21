import QueueToken from '../models/QueueToken.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';
import SalonConfig from '../models/SalonConfig.js';
import {
  canTransition,
  isOnlineJoiningAllowed,
  findActiveTokenByPhone,
  generateNextTokenNumber,
  calculateWaitStats,
  matchNextCustomerForBarber
} from '../utils/queueEngine.js';

// Helper to broadcast changes via Socket.io
const emitQueueChange = (req, eventName = 'queue:updated', payload = null) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(eventName, payload);
    // Also always emit general sync update
    if (eventName !== 'queue:updated') {
      io.emit('queue:updated', { timestamp: Date.now() });
    }
  }
};

/**
 * Public: Join the queue (mobile-first)
 */
export const joinQueue = async (req, res) => {
  try {
    const { customerName, phone, serviceIds, preferredBarberId, isWalkIn = false } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    // 10-digit phone validation
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit phone number is required' });
    }

    // Validate services (min 1, max 3)
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length < 1 || serviceIds.length > 3) {
      return res.status(400).json({ success: false, message: 'Please select between 1 and 3 active services' });
    }

    // Check if online joining is allowed (Walk-ins bypass online cutoff)
    if (!isWalkIn) {
      const joiningCheck = await isOnlineJoiningAllowed();
      if (!joiningCheck.allowed) {
        return res.status(403).json({ success: false, message: joiningCheck.reason });
      }
    }

    // Duplicate Phone Check: Enforce one active token per 10-digit phone
    const existingActive = await findActiveTokenByPhone(cleanPhone);
    if (existingActive) {
      return res.status(200).json({
        success: true,
        alreadyActive: true,
        message: 'You already have an active queue spot! Redirecting to your status.',
        token: existingActive
      });
    }

    // Fetch and validate services
    const dbServices = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    if (dbServices.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected services are not currently available' });
    }

    const servicesPayload = dbServices.map(s => ({
      serviceId: s._id,
      name: s.name,
      duration: s.duration,
      price: s.price
    }));

    const totalDuration = servicesPayload.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = servicesPayload.reduce((sum, s) => sum + s.price, 0);

    // Preferred Barber Check
    let preferredBarber = null;
    let preferredBarberName = 'Any barber (fastest)';

    if (preferredBarberId) {
      const barber = await Barber.findById(preferredBarberId);
      if (barber) {
        preferredBarber = barber._id;
        preferredBarberName = barber.name;
      }
    }

    // Generate Token
    const { tokenNumber, tokenSequence } = await generateNextTokenNumber();

    const newToken = await QueueToken.create({
      tokenNumber,
      tokenSequence,
      customerName: customerName.trim(),
      phone: cleanPhone,
      services: servicesPayload,
      totalDuration,
      totalPrice,
      preferredBarber,
      preferredBarberName,
      status: 'Waiting',
      isWalkIn: !!isWalkIn,
      joinedAt: new Date()
    });

    emitQueueChange(req, 'queue:updated', { token: newToken });

    return res.status(201).json({
      success: true,
      message: 'Successfully joined the queue',
      token: newToken
    });
  } catch (error) {
    console.error('Error in joinQueue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Get status of a token
 */
export const getTokenStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await QueueToken.findById(id).populate('preferredBarber assignedBarber');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Queue token not found' });
    }

    // If waiting, calculate position and estimated wait
    let queuePosition = 0;
    let waitStats = { waitMinutes: 0, isPaused: false, message: '' };

    if (token.status === 'Waiting') {
      const tokensAhead = await QueueToken.countDocuments({
        status: 'Waiting',
        tokenSequence: { $lt: token.tokenSequence }
      });
      queuePosition = tokensAhead + 1; // 1 means 1st in line
      waitStats = await calculateWaitStats(token._id);
    }

    return res.json({
      success: true,
      token,
      queuePosition,
      isNextOrSecond: queuePosition <= 2 && token.status === 'Waiting',
      isCalled: token.status === 'Called',
      waitStats
    });
  } catch (error) {
    console.error('Error in getTokenStatus:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Cancel spot in queue
 */
export const cancelSpot = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await QueueToken.findById(id);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (!canTransition(token.status, 'Cancelled')) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel spot when status is '${token.status}'.`
      });
    }

    token.status = 'Cancelled';
    token.cancelledAt = new Date();
    await token.save();

    emitQueueChange(req, 'queue:updated', { tokenId: token._id, status: 'Cancelled' });

    return res.json({
      success: true,
      message: 'Your spot in the queue has been cancelled.',
      token
    });
  } catch (error) {
    console.error('Error in cancelSpot:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Call next customer for a barber
 */
export const callNextCustomer = async (req, res) => {
  try {
    const { barberId } = req.body;
    if (!barberId) {
      return res.status(400).json({ success: false, message: 'Barber ID is required' });
    }

    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    const nextToken = await matchNextCustomerForBarber(barberId);
    if (!nextToken) {
      return res.status(404).json({
        success: false,
        message: `No waiting customers in queue matching ${barber.name} or 'Any barber'.`
      });
    }

    if (!canTransition(nextToken.status, 'Called')) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from ${nextToken.status} to Called.`
      });
    }

    // Update token
    nextToken.status = 'Called';
    nextToken.calledAt = new Date();
    nextToken.assignedBarber = barber._id;
    nextToken.assignedBarberName = barber.name;
    await nextToken.save();

    // Update barber
    barber.status = 'Busy';
    barber.currentCustomer = {
      tokenId: nextToken._id,
      tokenNumber: nextToken.tokenNumber,
      customerName: nextToken.customerName,
      services: nextToken.services.map(s => s.name),
      startedAt: null,
      estimatedDuration: nextToken.totalDuration
    };
    await barber.save();

    // Broadcast chime and highlight to TV & phones!
    emitQueueChange(req, 'queue:called', {
      tokenId: nextToken._id,
      tokenNumber: nextToken.tokenNumber,
      customerName: nextToken.customerName,
      barberName: barber.name,
      barberId: barber._id
    });

    return res.json({
      success: true,
      message: `Called ${nextToken.tokenNumber} (${nextToken.customerName}) for ${barber.name}`,
      token: nextToken,
      barber
    });
  } catch (error) {
    console.error('Error in callNextCustomer:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Start service (customer seated in chair)
 */
export const startService = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await QueueToken.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (!canTransition(token.status, 'In chair')) {
      return res.status(400).json({
        success: false,
        message: `Cannot start service from status '${token.status}'. Must be 'Called'.`
      });
    }

    token.status = 'In chair';
    token.startedAt = new Date();
    await token.save();

    // Update assigned barber
    if (token.assignedBarber) {
      await Barber.findByIdAndUpdate(token.assignedBarber, {
        status: 'Busy',
        'currentCustomer.startedAt': token.startedAt
      });
    }

    emitQueueChange(req, 'queue:updated', { token });

    return res.json({
      success: true,
      message: 'Service started. Customer is in chair.',
      token
    });
  } catch (error) {
    console.error('Error in startService:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Complete service (Done)
 */
export const completeService = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await QueueToken.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (!canTransition(token.status, 'Done')) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete service from status '${token.status}'. Must be 'In chair'.`
      });
    }

    token.status = 'Done';
    token.completedAt = new Date();
    await token.save();

    // Free up barber
    if (token.assignedBarber) {
      await Barber.findByIdAndUpdate(token.assignedBarber, {
        status: 'Available',
        currentCustomer: {
          tokenId: null,
          tokenNumber: null,
          customerName: null,
          services: [],
          startedAt: null,
          estimatedDuration: 0
        }
      });
    }

    emitQueueChange(req, 'queue:updated', { token });

    return res.json({
      success: true,
      message: 'Service completed successfully.',
      token
    });
  } catch (error) {
    console.error('Error in completeService:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Mark No-show
 */
export const markNoShow = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await QueueToken.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (!canTransition(token.status, 'No-show')) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark no-show from status '${token.status}'. Must be 'Called'.`
      });
    }

    token.status = 'No-show';
    token.noShowAt = new Date();
    await token.save();

    // Free up barber
    if (token.assignedBarber) {
      await Barber.findByIdAndUpdate(token.assignedBarber, {
        status: 'Available',
        currentCustomer: {
          tokenId: null,
          tokenNumber: null,
          customerName: null,
          services: [],
          startedAt: null,
          estimatedDuration: 0
        }
      });
    }

    emitQueueChange(req, 'queue:updated', { token });

    return res.json({
      success: true,
      message: `Token ${token.tokenNumber} marked as No-show. Barber is now Available.`,
      token
    });
  } catch (error) {
    console.error('Error in markNoShow:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public: Get Live Queue Summary (for Home page & TV header)
 */
export const getQueueSummary = async (req, res) => {
  try {
    const config = await SalonConfig.findOne();
    const waitStats = await calculateWaitStats();
    const barbers = await Barber.find().sort({ isOnDuty: -1, name: 1 });

    const joiningAllowed = await isOnlineJoiningAllowed();

    // Up next top 5 waiting tokens for TV / overview
    const upNext = await QueueToken.find({ status: 'Waiting' })
      .sort({ tokenSequence: 1 })
      .limit(5);

    // Currently called or in chair tokens
    const activeTokens = await QueueToken.find({
      status: { $in: ['Called', 'In chair'] }
    }).sort({ updatedAt: -1 });

    // Full waiting queue list so home, tv, and reception can show all waiting customers
    const waitingTokens = await QueueToken.find({
      status: { $in: ['Waiting', 'Called'] }
    }).sort({ tokenSequence: 1 });

    return res.json({
      success: true,
      salonConfig: config,
      isOnlineJoiningAllowed: joiningAllowed.allowed,
      joiningNotice: joiningAllowed.reason,
      waitStats,
      barbers,
      upNext,
      activeTokens,
      waitingTokens
    });
  } catch (error) {
    console.error('Error in getQueueSummary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Get complete waiting list for Reception dashboard
 */
export const getReceptionQueue = async (req, res) => {
  try {
    const waitingList = await QueueToken.find({
      status: { $in: ['Waiting', 'Called'] }
    }).sort({ tokenSequence: 1 });

    const barbers = await Barber.find().sort({ name: 1 });

    return res.json({
      success: true,
      waitingList,
      barbers
    });
  } catch (error) {
    console.error('Error in getReceptionQueue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
