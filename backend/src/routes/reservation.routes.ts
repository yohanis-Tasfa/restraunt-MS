import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller';
import { authenticate, authorize, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all reservations (any authenticated user)
router.get('/', reservationController.getAll);

// Get upcoming reservations (any authenticated user)
router.get('/upcoming', reservationController.getUpcoming);

// Get single reservation (any authenticated user)
router.get('/:id', reservationController.getById);

// Create reservation (Manager, Owner, Cashier / Front-desk)
router.post(
  '/',
  authorize('reservations.create', 'Owner', 'Manager', 'Cashier', 'Super Admin', 'Admin'),
  reservationController.create
);

// Update reservation details (Manager, Owner, Cashier)
router.put(
  '/:id',
  authorize('reservations.update', 'Owner', 'Manager', 'Cashier', 'Super Admin', 'Admin'),
  reservationController.update
);

// Update reservation status (Manager, Cashier, Waiter can seat arriving guests or mark complete)
router.patch(
  '/:id/status',
  authorize('reservations.update', 'Owner', 'Manager', 'Cashier', 'Waiter', 'Super Admin', 'Admin'),
  reservationController.updateStatus
);

// Cancel reservation (Manager, Owner, Cashier)
router.post(
  '/:id/cancel',
  authorize('reservations.cancel', 'Owner', 'Manager', 'Cashier', 'Super Admin', 'Admin'),
  reservationController.cancel
);

// Delete reservation (Manager, Owner only)
router.delete(
  '/:id',
  authorize('reservations.delete', 'Owner', 'Manager', 'Super Admin', 'Admin'),
  reservationController.deleteReservation
);

export default router;
