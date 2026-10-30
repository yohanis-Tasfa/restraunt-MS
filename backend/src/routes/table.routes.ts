import { Router } from 'express';
import * as tableController from '../controllers/table.controller';
import { authenticate, authorize, requireRole } from '../middleware/auth';

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

// Create table (Manager/Owner only)
router.post('/', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.create);

// Update table configuration (Manager/Owner only)
router.put('/:id', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.update);

// Update table status (Operational floor management: Waiter, Cashier, Manager, Owner)
router.patch('/:id/status', authorize('tables.update'), tableController.updateStatus);

// Merge tables (Manager/Owner only)
router.post('/merge', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.merge);

// Unmerge table (Manager/Owner only)
router.post('/:id/unmerge', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.unmerge);

// Delete table (Manager/Owner only)
router.delete('/:id', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.remove);

// QR Code Ordering Routes

// Generate QR code for table (Manager/Owner only)
router.post('/:id/qr-code/generate', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.generateQRCode);

// Regenerate QR code for table (Manager/Owner only)
router.post('/:id/qr-code/regenerate', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.regenerateQRCode);

// Download QR code image (Available to service staff and managers)
router.get('/:id/qr-code/download', authorize('tables.read', 'tables.update'), tableController.downloadQRCode);

// Waiter Assignment Routes (Manager/Owner only - Waiters cannot assign waiters)
router.post('/:id/assign-waiter', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.assignWaiter);

// Unassign waiter from table (Manager/Owner only)
router.delete('/:id/assign-waiter', requireRole('Owner', 'Manager', 'Super Admin', 'Admin'), tableController.unassignWaiter);

// Get tables assigned to a waiter (any authenticated user)
router.get('/waiter/:waiterId/assigned', tableController.getAssignedTables);

export default router;
