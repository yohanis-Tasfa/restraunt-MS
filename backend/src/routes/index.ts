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

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
