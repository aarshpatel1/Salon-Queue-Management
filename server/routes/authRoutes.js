import express from 'express';
import { verifyPin, checkAuth } from '../controllers/authController.js';
import { requireStaffAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/verify-pin', verifyPin);
router.get('/check', requireStaffAuth, checkAuth);

export default router;
