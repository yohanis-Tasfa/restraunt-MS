import { Router } from 'express';
import { customerSessionController } from '../controllers/customer-session.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (for customers scanning QR codes)

// Create a new session (when customer scans QR code)
router.post('/', customerSessionController.createSession);

// Get session by QR code (for customer to check their session)
router.get('/qr/:qrCode', customerSessionController.getSessionByQRCode);

// Protected routes (for staff)
router.use(authenticate);

// Get all sessions with filters (staff only)
router.get('/', customerSessionController.getSessions);

// Get session statistics (staff only)
router.get('/stats', customerSessionController.getSessionStats);

// Get session by ID
router.get('/:id', customerSessionController.getSession);

// Get active session for a table
router.get('/table/:tableId/active', customerSessionController.getActiveSessionByTable);

// Update session
router.put('/:id', customerSessionController.updateSession);

// End session
router.post('/:id/end', customerSessionController.endSession);

export default router;
