import SalonConfig from '../models/SalonConfig.js';
import QueueToken from '../models/QueueToken.js';
import Barber from '../models/Barber.js';
import { uploadToCloudinary } from '../configs/cloudinary.js';

export const getAdminData = async (req, res) => {
  try {
    const config = await SalonConfig.findOne();
    const barbers = await Barber.find().sort({ name: 1 });

    // Today's range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayTokens = await QueueToken.find({
      joinedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const servedTokens = todayTokens.filter(t => t.status === 'Done');
    const noShowTokens = todayTokens.filter(t => t.status === 'No-show');
    const cancelledTokens = todayTokens.filter(t => t.status === 'Cancelled');
    const waitingTokens = todayTokens.filter(t => t.status === 'Waiting');

    // Calculate Average Wait Time for served customers (minutes from joinedAt to startedAt/calledAt)
    let totalWaitMinutes = 0;
    let waitCalculatedCount = 0;

    servedTokens.forEach(t => {
      const waitEnd = t.startedAt || t.calledAt || t.completedAt;
      if (waitEnd && t.joinedAt) {
        const diffMs = new Date(waitEnd) - new Date(t.joinedAt);
        const mins = Math.max(1, Math.round(diffMs / 60000));
        totalWaitMinutes += mins;
        waitCalculatedCount++;
      }
    });

    const averageWait = waitCalculatedCount > 0 ? Math.round(totalWaitMinutes / waitCalculatedCount) : 18;
    const todayRevenue = servedTokens.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
    const activeEmployees = barbers.filter(b => b.isOnDuty).length;

    return res.json({
      success: true,
      config,
      barbers,
      kpis: {
        customersServed: servedTokens.length,
        averageWaitMinutes: averageWait,
        noShows: noShowTokens.length,
        cancelled: cancelledTokens.length,
        waitingNow: waitingTokens.length,
        totalTodayTokens: todayTokens.length,
        todayRevenue,
        activeEmployees
      }
    });
  } catch (error) {
    console.error('Error in getAdminData:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { salonName, tagline, closingTime, onlineJoiningCutoffMinutes, isMasterQueueOpen, staffPin, bannerImage } = req.body;

    let config = await SalonConfig.findOne();
    if (!config) {
      config = new SalonConfig();
    }

    if (salonName !== undefined) config.salonName = salonName;
    if (tagline !== undefined) config.tagline = tagline;
    if (closingTime !== undefined) config.closingTime = closingTime;
    if (onlineJoiningCutoffMinutes !== undefined) config.onlineJoiningCutoffMinutes = Number(onlineJoiningCutoffMinutes);
    if (isMasterQueueOpen !== undefined) config.isMasterQueueOpen = Boolean(isMasterQueueOpen);
    if (staffPin !== undefined && String(staffPin).length === 4) config.staffPin = String(staffPin);
    if (bannerImage !== undefined) config.bannerImage = bannerImage;

    await config.save();

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({ success: true, message: 'Salon settings updated successfully', config });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleMasterQueue = async (req, res) => {
  try {
    let config = await SalonConfig.findOne();
    if (!config) config = await SalonConfig.create({});

    config.isMasterQueueOpen = !config.isMasterQueueOpen;
    await config.save();

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({
      success: true,
      message: `Master Queue is now ${config.isMasterQueueOpen ? 'Open' : 'Closed'}`,
      isMasterQueueOpen: config.isMasterQueueOpen
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadSalonImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'salon_assets');
    return res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error in uploadSalonImage:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
