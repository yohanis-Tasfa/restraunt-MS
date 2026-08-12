import { Router } from 'express';
import authRoutes from './auth.routes';
import restaurantRoutes from './restaurant.routes';
import branchRoutes from './branch.routes';
import menuCategoryRoutes from './menu-category.routes';
import menuItemRoutes from './menu-item.routes';
import menuVariantRoutes from './menu-variant.routes';
import menuAddonRoutes from './menu-addon.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import tableRoutes from './table.routes';
import reservationRoutes from './reservation.routes';
import inventoryRoutes from './inventory.routes';
import customerRoutes from './customer.routes';
import expenseRoutes from './expense.routes';
import recipeRoutes from './recipe.routes';
import userRoutes from './user.routes';
import reportRoutes from './report.routes';
import settingRoutes from './setting.routes';
import uploadRoutes from './upload.routes';
import employeeRoutes from './employee.routes';
import profileRoutes from './profile.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/branches', branchRoutes);
router.use('/menu/categories', menuCategoryRoutes);
router.use('/menu/items', menuItemRoutes);
router.use('/menu/variants', menuVariantRoutes);
router.use('/menu/addons', menuAddonRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/tables', tableRoutes);
router.use('/reservations', reservationRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/expenses', expenseRoutes);
router.use('/recipes', recipeRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);
router.use('/upload', uploadRoutes);
router.use('/employees', employeeRoutes);
router.use('/profile', profileRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
