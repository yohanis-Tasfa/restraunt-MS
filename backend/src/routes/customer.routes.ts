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
router.get('/stats', authorize(['Super Admin', 'Admin', 'Manager']), getCustomerStats);

// GET /api/customers/birthdays - Get upcoming birthdays
router.get('/birthdays', authorize(['Super Admin', 'Admin', 'Manager']), getUpcomingBirthdays);

// GET /api/customers - Get all customers
router.get('/', authorize(['Super Admin', 'Admin', 'Manager', 'Cashier', 'Waiter']), getAllCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', authorize(['Super Admin', 'Admin', 'Manager', 'Cashier', 'Waiter']), getCustomerById);

// POST /api/customers - Create new customer
router.post('/', authorize(['Super Admin', 'Admin', 'Manager', 'Cashier', 'Waiter']), createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', authorize(['Super Admin', 'Admin', 'Manager']), updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', authorize(['Super Admin', 'Admin']), deleteCustomer);

// GET /api/customers/:id/orders - Get customer orders
router.get('/:id/orders', authorize(['Super Admin', 'Admin', 'Manager', 'Cashier']), getCustomerOrders);

// GET /api/customers/:id/reservations - Get customer reservations
router.get('/:id/reservations', authorize(['Super Admin', 'Admin', 'Manager', 'Waiter']), getCustomerReservations);

// POST /api/customers/:id/loyalty-points - Manage loyalty points (add/subtract)
router.post('/:id/loyalty-points', authorize(['Super Admin', 'Admin', 'Manager']), manageLoyaltyPoints);

export default router;
