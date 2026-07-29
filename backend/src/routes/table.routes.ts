import { Router } from 'express';
import * as tableController from '../controllers/table.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all tables (any authenticated user)
router.get('/', tableController.getAll);

// Get table availability (any authenticated user)
router.get('/availability', tableController.getAvailability);

// Get tables by branch (any authenticated user)
router.get('/branch/:branchId', tableController.getByBranch);

// Get single table (any authenticated user)
router.get('/:id', tableController.getById);

// Create table (Manager+)
router.post('/', authorize('tables.update'), tableController.create);

// Update table (Manager+)
router.put('/:id', authorize('tables.update'), tableController.update);

// Update table status (Waiter+)
router.patch('/:id/status', authorize('tables.update'), tableController.updateStatus);

// Merge tables (Manager+)
router.post('/merge', authorize('tables.update'), tableController.merge);

// Unmerge table (Manager+)
router.post('/:id/unmerge', authorize('tables.update'), tableController.unmerge);

// Delete table (Admin only)
router.delete('/:id', authorize('branches.delete'), tableController.remove);

export default router;
