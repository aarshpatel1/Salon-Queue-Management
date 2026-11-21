import passport from 'passport';
import SalonConfig from '../models/SalonConfig.js';

/**
 * Middleware using Passport JWT to authenticate staff
 */
export const requireStaffAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err) return next(err);

    // If valid JWT token
    if (user) {
      req.user = user;
      return next();
    }

    // Also support fallback PIN header for flexibility
    const pinHeader = req.headers['x-staff-pin'];
    if (pinHeader) {
      const config = await SalonConfig.findOne();
      const validPin = config?.staffPin || process.env.STAFF_PIN || '1234';
      if (pinHeader === validPin) {
        req.user = { role: 'staff', verifiedVia: 'pin' };
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Staff authentication required (valid JWT or PIN).'
    });
  })(req, res, next);
};
