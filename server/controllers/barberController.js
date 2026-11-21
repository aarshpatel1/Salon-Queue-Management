import Barber from '../models/Barber.js';
import QueueToken from '../models/QueueToken.js';

export const getAllBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find().sort({ isOnDuty: -1, name: 1 });
    return res.json({ success: true, barbers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBarberByName = async (req, res) => {
  try {
    const { name } = req.params;
    // Decode URI name e.g. "Dudu%20Tassa" -> "Dudu Tassa"
    const decodedName = decodeURIComponent(name).trim();

    const barber = await Barber.findOne({
      name: { $regex: new RegExp(`^${decodedName}$`, 'i') }
    });

    if (!barber) {
      return res.status(404).json({ success: false, message: `Barber '${decodedName}' not found` });
    }

    // Get current customer token details if in chair or called
    let currentToken = null;
    if (barber.currentCustomer && barber.currentCustomer.tokenId) {
      currentToken = await QueueToken.findById(barber.currentCustomer.tokenId);
    }

    // Find "Next for you" preview card:
    // Earliest waiting customer who requested this barber or 'Any'
    const nextForYou = await QueueToken.findOne({
      status: 'Waiting',
      $or: [
        { preferredBarber: barber._id },
        { preferredBarber: null },
        { preferredBarber: { $exists: false } }
      ]
    }).sort({ tokenSequence: 1 });

    // Also get all waiting tokens so barber view can show the overall waiting queue
    const allWaiting = await QueueToken.find({
      status: { $in: ['Waiting', 'Called'] }
    }).sort({ tokenSequence: 1 });

    return res.json({
      success: true,
      barber,
      currentToken,
      nextForYou,
      allWaiting
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBarberBreak = async (req, res) => {
  try {
    const { barberId } = req.body;
    const barber = await Barber.findById(barberId);

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    if (barber.status === 'Busy') {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle break while currently serving a customer in chair.'
      });
    }

    barber.status = barber.status === 'On break' ? 'Available' : 'On break';
    await barber.save();

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({
      success: true,
      message: `${barber.name} is now ${barber.status}`,
      barber
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBarberDuty = async (req, res) => {
  try {
    const { barberId } = req.body;
    const barber = await Barber.findById(barberId);

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    barber.isOnDuty = !barber.isOnDuty;
    if (!barber.isOnDuty && barber.status !== 'Busy') {
      barber.status = 'On break';
    } else if (barber.isOnDuty && barber.status === 'On break') {
      barber.status = 'Available';
    }
    await barber.save();

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({
      success: true,
      message: `${barber.name} duty status toggled to ${barber.isOnDuty ? 'On Duty' : 'Off Duty'}`,
      barber
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
