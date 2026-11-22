import QueueToken from '../models/QueueToken.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';
import SalonConfig from '../models/SalonConfig.js';
import { uploadToCloudinary } from '../configs/cloudinary.js';
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
    const { customerName, phone, serviceIds, preferredBarberId, avatar = '', isWalkIn = false } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    // Strict 10-digit phone validation
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required' });
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
      return res.status(400).json({
        success: false,
        alreadyActive: true,
        message: `You already have an active turn (Token ${existingActive.tokenNumber}) in the queue. You cannot join again until you cancel your current turn.`,
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
      avatar: (avatar || '').trim(),
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

/**
 * Staff: Rearrange queue order (Drag and Drop)
 */
export const reorderQueue = async (req, res) => {
  try {
    const { orderedTokenIds } = req.body;
    if (!Array.isArray(orderedTokenIds) || orderedTokenIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid ordered token list' });
    }

    const waitingTokens = await QueueToken.find({
      _id: { $in: orderedTokenIds },
      status: { $in: ['Waiting', 'Called'] }
    });

    const tokenMap = new Map(waitingTokens.map(t => [t._id.toString(), t]));

    const bulkOps = [];
    orderedTokenIds.forEach((id, idx) => {
      if (tokenMap.has(id.toString())) {
        bulkOps.push({
          updateOne: {
            filter: { _id: id },
            update: { $set: { tokenSequence: idx + 1 } }
          }
        });
      }
    });

    if (bulkOps.length > 0) {
      await QueueToken.bulkWrite(bulkOps);
    }

    emitQueueChange(req, 'queue:updated');

    const updatedList = await QueueToken.find({
      status: { $in: ['Waiting', 'Called'] }
    }).sort({ tokenSequence: 1 });

    return res.json({
      success: true,
      message: 'Queue order rearranged successfully',
      waitingList: updatedList
    });
  } catch (error) {
    console.error('Error in reorderQueue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Update customer queue token (CRUD - Update)
 */
export const updateQueueToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, phone, preferredBarberId, serviceIds, avatar, status } = req.body;

    const token = await QueueToken.findById(id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Queue spot not found' });
    }

    if (customerName && customerName.trim()) {
      token.customerName = customerName.trim();
    }

    if (phone !== undefined) {
      const cleanPhone = (phone || '').replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
      }
      token.phone = cleanPhone;
    }

    if (avatar !== undefined) {
      token.avatar = avatar.trim();
    }

    if (preferredBarberId !== undefined) {
      if (!preferredBarberId) {
        token.preferredBarber = null;
        token.preferredBarberName = 'Any barber (fastest)';
      } else {
        const barber = await Barber.findById(preferredBarberId);
        if (barber) {
          token.preferredBarber = barber._id;
          token.preferredBarberName = barber.name;
        }
      }
    }

    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      const dbServices = await Service.find({ _id: { $in: serviceIds } });
      if (dbServices.length > 0) {
        token.services = dbServices.map(s => ({
          serviceId: s._id,
          name: s.name,
          duration: s.duration,
          price: s.price
        }));
        token.totalDuration = token.services.reduce((sum, s) => sum + s.duration, 0);
        token.totalPrice = token.services.reduce((sum, s) => sum + s.price, 0);
      }
    }

    if (status && ['Waiting', 'Called', 'In chair', 'Done', 'Cancelled', 'No-show'].includes(status)) {
      token.status = status;
      if (status === 'Cancelled') token.cancelledAt = new Date();
      if (status === 'Done') token.completedAt = new Date();
      if (status === 'No-show') token.noShowAt = new Date();
    }

    await token.save();
    emitQueueChange(req, 'queue:updated', { token });

    return res.json({
      success: true,
      message: 'Queue guest updated successfully',
      token
    });
  } catch (error) {
    console.error('Error in updateQueueToken:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Delete customer queue token (CRUD - Delete)
 */
export const deleteQueueToken = async (req, res) => {
  try {
    const { id } = req.params;
    const token = await QueueToken.findById(id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Queue spot not found' });
    }

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

    await QueueToken.findByIdAndDelete(id);

    emitQueueChange(req, 'queue:updated');

    return res.json({
      success: true,
      message: `Token ${token.tokenNumber} (${token.customerName}) removed from queue.`
    });
  } catch (error) {
    console.error('Error in deleteQueueToken:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload customer avatar
 */
export const uploadCustomerAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'customer_avatars');
    return res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error in uploadCustomerAvatar:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
