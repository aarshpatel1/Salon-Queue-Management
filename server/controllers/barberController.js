import Barber from '../models/Barber.js';
import QueueToken from '../models/QueueToken.js';
import { uploadToCloudinary } from '../configs/cloudinary.js';

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

/**
 * Staff: Create a new barber
 */
export const createBarber = async (req, res) => {
  try {
    const { name, specialty, avatar = '', isOnDuty = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Barber name is required' });
    }

    const trimmedName = name.trim();
    const existing = await Barber.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Barber with name '${trimmedName}' already exists` });
    }

    const newBarber = await Barber.create({
      name: trimmedName,
      specialty: (specialty || 'Senior Stylist').trim(),
      avatar: avatar.trim(),
      isOnDuty: Boolean(isOnDuty),
      status: 'Available'
    });

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.status(201).json({
      success: true,
      message: `Barber '${newBarber.name}' added successfully`,
      barber: newBarber
    });
  } catch (error) {
    console.error('Error creating barber:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Update an existing barber
 */
export const updateBarber = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, avatar, isOnDuty, status } = req.body;

    const barber = await Barber.findById(id);
    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    if (name && name.trim() && name.trim().toLowerCase() !== barber.name.toLowerCase()) {
      const conflict = await Barber.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      if (conflict) {
        return res.status(400).json({ success: false, message: `A barber named '${name.trim()}' already exists` });
      }
      barber.name = name.trim();
    }

    if (specialty !== undefined) barber.specialty = specialty.trim();
    if (avatar !== undefined) barber.avatar = avatar.trim();
    if (isOnDuty !== undefined) barber.isOnDuty = Boolean(isOnDuty);
    if (status !== undefined && ['Available', 'Busy', 'On break'].includes(status)) {
      barber.status = status;
    }

    await barber.save();

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({
      success: true,
      message: `Barber '${barber.name}' updated successfully`,
      barber
    });
  } catch (error) {
    console.error('Error updating barber:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Delete a barber
 */
export const deleteBarber = async (req, res) => {
  try {
    const { id } = req.params;
    const barber = await Barber.findById(id);

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    if (barber.status === 'Busy' || barber.currentCustomer?.tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete barber while they are currently serving a client in chair.'
      });
    }

    // If waiting tokens had preferred this barber, reset their preference to Any
    await QueueToken.updateMany(
      { preferredBarber: id, status: { $in: ['Waiting', 'Called'] } },
      { $set: { preferredBarber: null, preferredBarberName: 'Any barber (fastest)' } }
    );

    await Barber.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({
      success: true,
      message: `Barber '${barber.name}' removed successfully`
    });
  } catch (error) {
    console.error('Error deleting barber:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff: Upload barber avatar
 */
export const uploadBarberAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'barber_avatars');
    return res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Error in uploadBarberAvatar:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
