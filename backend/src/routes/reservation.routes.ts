import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all reservations (any authenticated user)
router.get('/', reservationController.getAll);

// Get upcoming reservations (any authenticated user)
router.get('/upcoming', reservationController.getUpcoming);

// Get single reservation (any authenticated user)
router.get('/:id', reservationController.getById);

// Create reservation (Cashier+, Waiter+)
router.post('/', authorize('reservations.create'), reservationController.create);

// Update reservation (Cashier+, Waiter+)
router.put('/:id', authorize('reservations.create'), reservationController.update);

// Update reservation status (Cashier+, Waiter+)
router.patch('/:id/status', authorize('reservations.create'), reservationController.updateStatus);

// Cancel reservation (Manager+)
router.post('/:id/cancel', authorize('reservations.create'), reservationController.cancel);

// Delete reservation (Manager+)
router.delete('/:id', authorize('reservations.create'), reservationController.deleteReservation);

export default router;
