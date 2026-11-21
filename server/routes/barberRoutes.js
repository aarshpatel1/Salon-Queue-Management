import express from 'express';
import {
  getAllBarbers,
  getBarberByName,
  toggleBarberBreak,
  toggleBarberDuty
} from '../controllers/barberController.js';
import { requireStaffAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllBarbers);
router.get('/:name', getBarberByName);

// Staff protected routes
router.post('/toggle-break', requireStaffAuth, toggleBarberBreak);
router.post('/toggle-duty', requireStaffAuth, toggleBarberDuty);

export default router;
