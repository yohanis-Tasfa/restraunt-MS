import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all orders (any authenticated user)
router.get('/', orderController.getAll);

// Get daily stats (Manager+)
router.get('/stats/daily', authorize('reports.read'), orderController.getDailyStats);

// Get single order (any authenticated user)
router.get('/:id', orderController.getById);

// Get order receipt (any authenticated user)
router.get('/:id/receipt', orderController.getReceipt);

// Create order (Cashier+)
router.post('/', authorize('orders.create'), orderController.create);

// Update order (Cashier+)
router.put('/:id', authorize('orders.update'), orderController.update);

// Update order status (Cashier+, Kitchen Staff can also update)
router.patch('/:id/status', authorize('orders.update'), orderController.updateStatus);

// Add items to order (Cashier+, Waiter)
router.post('/:id/items', authorize('orders.update'), orderController.addItems);

// Remove item from order (Cashier+, Waiter)
router.delete('/:id/items/:itemId', authorize('orders.update'), orderController.removeItem);

// Cancel order (Manager+)
router.post('/:id/cancel', authorize('orders.cancel'), orderController.cancel);

export default router;
