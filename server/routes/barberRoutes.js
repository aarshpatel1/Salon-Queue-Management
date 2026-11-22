import express from 'express';
import {
  getAllBarbers,
  getBarberByName,
  toggleBarberBreak,
  toggleBarberDuty,
  createBarber,
  updateBarber,
  deleteBarber,
  uploadBarberAvatar
} from '../controllers/barberController.js';
import { requireStaffAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../configs/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/', getAllBarbers);
router.get('/:name', getBarberByName);

// Staff protected routes
router.post('/', requireStaffAuth, createBarber);
router.put('/:id', requireStaffAuth, updateBarber);
router.delete('/:id', requireStaffAuth, deleteBarber);
router.post('/upload-avatar', requireStaffAuth, upload.single('avatar'), uploadBarberAvatar);
router.post('/toggle-break', requireStaffAuth, toggleBarberBreak);
router.post('/toggle-duty', requireStaffAuth, toggleBarberDuty);

export default router;
