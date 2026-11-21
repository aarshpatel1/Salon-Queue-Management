import jwt from 'jsonwebtoken';
import SalonConfig from '../models/SalonConfig.js';

export const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: 'PIN is required' });
    }

    const config = await SalonConfig.findOne();
    const correctPin = config?.staffPin || process.env.STAFF_PIN || '1234';

    if (String(pin).trim() !== String(correctPin).trim()) {
      return res.status(401).json({ success: false, message: 'Invalid 4-digit PIN' });
    }

    // Issue JWT token signed with secret
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_branja_salon_2026_x7k9';
    const token = jwt.sign(
      { role: 'staff', authorizedAt: new Date().toISOString() },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Staff authenticated successfully',
      token
    });
  } catch (error) {
    console.error('Error in verifyPin:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};
