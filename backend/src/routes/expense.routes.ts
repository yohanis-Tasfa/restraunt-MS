import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get stats
router.get('/stats', expenseController.getStats);

// Get categories
router.get('/categories', expenseController.getCategories);

// Get all expenses
router.get('/', expenseController.getAll);

// Get expense by ID
router.get('/:id', expenseController.getById);

// Create expense
router.post('/', expenseController.create);

// Update expense
router.put('/:id', expenseController.update);

// Delete expense
router.delete('/:id', expenseController.delete);

export default router;
