import { Router } from 'express';
import * as branchController from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all branches (any authenticated user)
router.get('/', branchController.getAll);

// Get single branch (any authenticated user)
router.get('/:id', branchController.getById);

// Create branch (Admin only)
router.post('/', authorize('branches.create'), branchController.create);

// Update branch (Admin only)
router.put('/:id', authorize('branches.update'), branchController.update);

// Toggle branch active status (Admin only)
router.patch('/:id/toggle-active', authorize('branches.update'), branchController.toggleActive);

// Delete branch (Admin only)
router.delete('/:id', authorize('branches.delete'), branchController.remove);

export default router;
