import Service from '../models/Service.js';
import QueueToken from '../models/QueueToken.js';

export const getServices = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const services = await Service.find(filter).sort({ price: 1 });
    return res.json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, duration, price, category, icon } = req.body;
    if (!name || !duration || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, duration and price are required' });
    }

    const newService = await Service.create({
      name: name.trim(),
      duration: Number(duration),
      price: Number(price),
      category: category || 'General',
      icon: icon || 'scissors',
      isActive: true
    });

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.status(201).json({ success: true, service: newService });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, price, category, icon, isActive } = req.body;

    const updated = await Service.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.trim() }),
        ...(duration && { duration: Number(duration) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(category && { category }),
        ...(icon && { icon }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({ success: true, service: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleServiceActive = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.isActive = !service.isActive;
    await service.save();

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({ success: true, service });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check if active queue tokens (Waiting, Called, In chair) are using this service
    const activeTokenWithService = await QueueToken.findOne({
      status: { $in: ['Waiting', 'Called', 'In chair'] },
      'services.serviceId': id
    });

    if (activeTokenWithService) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete service because it is currently requested by active customer (Token ${activeTokenWithService.tokenNumber}). You can disable it instead.`
      });
    }

    await Service.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) io.emit('queue:updated');

    return res.json({
      success: true,
      message: `Service '${service.name}' removed successfully`
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
