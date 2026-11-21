import express from 'express';
import {
  getAdminData,
  updateSettings,
  toggleMasterQueue,
  uploadSalonImage
} from '../controllers/adminController.js';
import { requireStaffAuth } from '../middlewares/authMiddleware.js';
import { upload } from '../configs/cloudinary.js';

const router = express.Router();

router.use(requireStaffAuth);

router.get('/data', getAdminData);
router.post('/settings', updateSettings);
router.post('/toggle-queue', toggleMasterQueue);
router.post('/upload-image', upload.single('image'), uploadSalonImage);

export default router;
