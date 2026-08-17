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

// QR Code Ordering Routes

// Generate QR code for table (Manager+)
router.post('/:id/qr-code/generate', authorize('tables.update'), tableController.generateQRCode);

// Regenerate QR code for table (Manager+)
router.post('/:id/qr-code/regenerate', authorize('tables.update'), tableController.regenerateQRCode);

// Download QR code image (Manager+)
router.get('/:id/qr-code/download', authorize('tables.update'), tableController.downloadQRCode);

// Waiter Assignment Routes

// Assign waiter to table (Manager+)
router.post('/:id/assign-waiter', authorize('tables.update'), tableController.assignWaiter);

// Unassign waiter from table (Manager+)
router.delete('/:id/assign-waiter', authorize('tables.update'), tableController.unassignWaiter);

// Get tables assigned to a waiter (any authenticated user)
router.get('/waiter/:waiterId/assigned', tableController.getAssignedTables);

export default router;
