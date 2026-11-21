import express from 'express';
import {
  getServices,
  createService,
  updateService,
  toggleServiceActive
} from '../controllers/serviceController.js';
import { requireStaffAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (customers get active services)
router.get('/', getServices);

// Staff / Admin protected routes
router.post('/', requireStaffAuth, createService);
router.put('/:id', requireStaffAuth, updateService);
router.patch('/:id/toggle-active', requireStaffAuth, toggleServiceActive);

export default router;
