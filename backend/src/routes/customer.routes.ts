import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  getCustomerReservations,
  manageLoyaltyPoints,
  getUpcomingBirthdays,
  getCustomerStats,
} from '../controllers/customer.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/customers/stats - Get customer statistics
router.get('/stats', authorize('reports.read', 'Super Admin', 'Admin', 'Manager', 'Owner'), getCustomerStats);

// GET /api/customers/birthdays - Get upcoming birthdays
router.get('/birthdays', authorize('customers.read', 'Super Admin', 'Admin', 'Manager', 'Owner'), getUpcomingBirthdays);

// GET /api/customers - Get all customers
router.get('/', authorize('customers.read', 'Super Admin', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Owner'), getAllCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', authorize('customers.read', 'Super Admin', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Owner'), getCustomerById);

// POST /api/customers - Create new customer
router.post('/', authorize('customers.create', 'Super Admin', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Owner'), createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', authorize('customers.update', 'Super Admin', 'Admin', 'Manager', 'Owner'), updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', authorize('customers.delete', 'Super Admin', 'Admin', 'Owner'), deleteCustomer);

// GET /api/customers/:id/orders - Get customer orders
router.get('/:id/orders', authorize('orders.read', 'Super Admin', 'Admin', 'Manager', 'Cashier', 'Owner'), getCustomerOrders);

// GET /api/customers/:id/reservations - Get customer reservations
router.get('/:id/reservations', authorize('reservations.read', 'Super Admin', 'Admin', 'Manager', 'Waiter', 'Cashier', 'Owner'), getCustomerReservations);

// POST /api/customers/:id/loyalty-points - Manage loyalty points (add/subtract)
router.post('/:id/loyalty-points', authorize('Super Admin', 'Admin', 'Manager', 'Owner'), manageLoyaltyPoints);

export default router;
