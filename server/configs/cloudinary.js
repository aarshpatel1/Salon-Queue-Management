import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo_salon',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret'
});

// Configure Multer with memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to upload buffer to Cloudinary
export const uploadToCloudinary = (fileBuffer, folder = 'salon_branja') => {
  return new Promise((resolve, reject) => {
    // If running in development with dummy credentials, return a valid placeholder URL
    if (
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY === '123456789012345'
    ) {
      const base64Data = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      return resolve({
        secure_url: base64Data,
        public_id: `mock_${Date.now()}`
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
