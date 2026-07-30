import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllSettings,
  getSettingByKey,
  getSettingsByCategory,
  setSetting,
  setMultipleSettings,
  deleteSetting,
  resetSetting,
  resetAllSettings,
  initializeSettings,
  getRestaurantSettings,
  getTaxSettings,
  getBusinessHours,
  getOrderSettings,
  getPaymentSettings,
  getLoyaltySettings,
  getInventorySettings,
  getNotificationSettings,
  getReceiptSettings,
  getSystemSettings,
} from '../controllers/setting.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Only Super Admin and Admin can manage settings
const adminRoles = ['Super Admin', 'Admin'];
const managerRoles = ['Super Admin', 'Admin', 'Manager'];

// ============ GENERAL SETTINGS ============

// POST /api/settings/initialize - Initialize default settings
router.post('/initialize', authorize(['Super Admin']), initializeSettings);

// POST /api/settings/reset-all - Reset all settings to defaults
router.post('/reset-all', authorize(['Super Admin']), resetAllSettings);

// POST /api/settings/reset/:key - Reset specific setting to default
router.post('/reset/:key', authorize(adminRoles), resetSetting);

// POST /api/settings/bulk - Set multiple settings at once
router.post('/bulk', authorize(adminRoles), setMultipleSettings);

// GET /api/settings - Get all settings (optionally grouped)
router.get('/', authorize(managerRoles), getAllSettings);

// POST /api/settings - Set/update a setting
router.post('/', authorize(adminRoles), setSetting);

// GET /api/settings/category/:category - Get settings by category
router.get('/category/:category', authorize(managerRoles), getSettingsByCategory);

// GET /api/settings/:key - Get specific setting by key
router.get('/:key', authorize(managerRoles), getSettingByKey);

// DELETE /api/settings/:key - Delete specific setting
router.delete('/:key', authorize(['Super Admin']), deleteSetting);

// ============ CATEGORY-SPECIFIC SETTINGS ============

// GET /api/settings/restaurant/info - Get restaurant settings
router.get('/restaurant/info', authorize(managerRoles), getRestaurantSettings);

// GET /api/settings/tax/rates - Get tax settings
router.get('/tax/rates', authorize(managerRoles), getTaxSettings);

// GET /api/settings/business/hours - Get business hours
router.get('/business/hours', authorize(managerRoles), getBusinessHours);

// GET /api/settings/order/config - Get order settings
router.get('/order/config', authorize(managerRoles), getOrderSettings);

// GET /api/settings/payment/methods - Get payment settings
router.get('/payment/methods', authorize(managerRoles), getPaymentSettings);

// GET /api/settings/loyalty/program - Get loyalty settings
router.get('/loyalty/program', authorize(managerRoles), getLoyaltySettings);

// GET /api/settings/inventory/config - Get inventory settings
router.get('/inventory/config', authorize([...managerRoles, 'Inventory Manager']), getInventorySettings);

// GET /api/settings/notifications/config - Get notification settings
router.get('/notifications/config', authorize(adminRoles), getNotificationSettings);

// GET /api/settings/receipt/format - Get receipt settings
router.get('/receipt/format', authorize(managerRoles), getReceiptSettings);

// GET /api/settings/system/config - Get system settings
router.get('/system/config', authorize(['Super Admin']), getSystemSettings);

export default router;
