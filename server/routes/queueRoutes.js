import express from 'express';
import {
  joinQueue,
  getTokenStatus,
  cancelSpot,
  callNextCustomer,
  startService,
  completeService,
  markNoShow,
  getQueueSummary,
  getReceptionQueue,
  reorderQueue,
  updateQueueToken,
  deleteQueueToken,
  uploadCustomerAvatar
} from '../controllers/queueController.js';
import { requireStaffAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../configs/cloudinary.js';

const router = express.Router();

// Public routes
router.post('/join', joinQueue);
router.get('/summary', getQueueSummary);
router.get('/status/:id', getTokenStatus);
router.post('/cancel/:id', cancelSpot);
router.post('/upload-avatar', upload.single('avatar'), uploadCustomerAvatar);

// Staff / Reception protected routes
router.get('/reception-data', requireStaffAuth, getReceptionQueue);
router.post('/call-next', requireStaffAuth, callNextCustomer);
router.post('/start-service', requireStaffAuth, startService);
router.post('/complete-service', requireStaffAuth, completeService);
router.post('/no-show', requireStaffAuth, markNoShow);
router.post('/reorder', requireStaffAuth, reorderQueue);
router.patch('/token/:id', requireStaffAuth, updateQueueToken);
router.delete('/token/:id', requireStaffAuth, deleteQueueToken);
router.post('/walk-in', requireStaffAuth, (req, res, next) => {
  req.body.isWalkIn = true;
  next();
}, joinQueue);

export default router;
