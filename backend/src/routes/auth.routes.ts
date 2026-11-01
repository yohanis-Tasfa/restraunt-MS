import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPasswordWithToken);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
