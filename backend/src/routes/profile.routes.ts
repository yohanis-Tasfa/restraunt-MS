import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';
import { profileUpload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/change-password', profileController.changePassword);
router.post('/picture', profileUpload.single('profilePicture'), profileController.uploadProfilePicture);
router.get('/activity', profileController.getActivityLog);

export default router;
