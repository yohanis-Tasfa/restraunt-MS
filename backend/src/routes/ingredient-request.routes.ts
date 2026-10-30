import { Router } from 'express';
import * as controller from '../controllers/ingredient-request.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all requests (Kitchen Staff, Managers, Owners)
router.get('/', controller.getAll);

// Create request (Kitchen Staff, Managers, Owners)
router.post('/', controller.create);

// Approve & Issue to kitchen (Managers, Owners, Inventory)
router.post('/:id/approve', controller.approve);

// Reject request (Managers, Owners)
router.post('/:id/reject', controller.reject);

// Cancel request (Kitchen Staff who created it or Managers)
router.post('/:id/cancel', controller.cancel);

export default router;

