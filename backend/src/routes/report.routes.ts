import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSalesSummary,
  getSalesByDate,
  getTopSellingItems,
  getInventorySummary,
  getInventoryMovements,
  getLowStockReport,
  getExpiringItemsReport,
  getCustomerSummary,
  getTopCustomers,
  getRevenueByBranch,
  getRevenueByCategory,
  getDashboardStats,
  getExpensesSummary,
  getProfitLoss,
} from '../controllers/report.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Only Admin, Manager, and Super Admin can access reports
const reportRoles = ['Super Admin', 'Admin', 'Manager'];

// ============ DASHBOARD ============
// GET /api/reports/dashboard - Get dashboard statistics
router.get('/dashboard', authorize(reportRoles), getDashboardStats);

// ============ SALES REPORTS ============
// GET /api/reports/sales/summary - Get sales summary
router.get('/sales/summary', authorize(reportRoles), getSalesSummary);

// GET /api/reports/sales/by-date - Get sales by date (day/week/month)
router.get('/sales/by-date', authorize(reportRoles), getSalesByDate);

// GET /api/reports/sales/top-items - Get top selling items
router.get('/sales/top-items', authorize(reportRoles), getTopSellingItems);

// ============ INVENTORY REPORTS ============
// GET /api/reports/inventory/summary - Get inventory summary
router.get('/inventory/summary', authorize([...reportRoles, 'Inventory Manager']), getInventorySummary);

// GET /api/reports/inventory/movements - Get inventory movements
router.get('/inventory/movements', authorize([...reportRoles, 'Inventory Manager']), getInventoryMovements);

// GET /api/reports/inventory/low-stock - Get low stock items
router.get('/inventory/low-stock', authorize([...reportRoles, 'Inventory Manager']), getLowStockReport);

// GET /api/reports/inventory/expiring - Get expiring items
router.get('/inventory/expiring', authorize([...reportRoles, 'Inventory Manager']), getExpiringItemsReport);

// ============ CUSTOMER REPORTS ============
// GET /api/reports/customers/summary - Get customer summary
router.get('/customers/summary', authorize(reportRoles), getCustomerSummary);

// GET /api/reports/customers/top - Get top customers
router.get('/customers/top', authorize(reportRoles), getTopCustomers);

// ============ REVENUE REPORTS ============
// GET /api/reports/revenue/by-branch - Get revenue by branch
router.get('/revenue/by-branch', authorize(reportRoles), getRevenueByBranch);

// GET /api/reports/revenue/by-category - Get revenue by category
router.get('/revenue/by-category', authorize(reportRoles), getRevenueByCategory);

// ============ EXPENSE REPORTS ============
// GET /api/reports/expenses/summary - Get expense summary
router.get('/expenses/summary', authorize(reportRoles), getExpensesSummary);

// ============ PROFIT & LOSS ============
// GET /api/reports/profit-loss - Get profit & loss statement
router.get('/profit-loss', authorize(reportRoles), getProfitLoss);

export default router;
