import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Upload payment proof
router.post(
  '/payment-proof',
  uploadController.uploadMiddleware,
  uploadController.uploadPaymentProof
);

// Upload profile picture
router.post(
  '/profile-picture',
  uploadController.uploadMiddleware,
  uploadController.uploadProfilePicture
);

// Generic image upload
router.post(
  '/image',
  uploadController.uploadMiddleware,
  uploadController.uploadImage
);

export default router;
