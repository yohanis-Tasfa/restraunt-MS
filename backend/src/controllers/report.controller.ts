import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const reportService = new ReportService();

// ============ SALES REPORTS ============

export const getSalesSummary = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const report = await reportService.getSalesSummary(params);
  res.json(new ApiResponse(200, report, 'Sales summary retrieved successfully'));
});

export const getSalesByDate = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate, groupBy } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const validGroupBy = ['day', 'week', 'month'];
  const group = groupBy && validGroupBy.includes(groupBy as string) 
    ? (groupBy as 'day' | 'week' | 'month') 
    : 'day';

  const report = await reportService.getSalesByDate(params, group);
  res.json(new ApiResponse(200, report, 'Sales by date retrieved successfully'));
});

export const getTopSellingItems = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate, limit } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const limitNum = limit ? parseInt(limit as string) : 10;
  const report = await reportService.getTopSellingItems(params, limitNum);
  res.json(new ApiResponse(200, report, 'Top selling items retrieved successfully'));
});

// ============ INVENTORY REPORTS ============

export const getInventorySummary = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
  };

  const report = await reportService.getInventorySummary(params);
  res.json(new ApiResponse(200, report, 'Inventory summary retrieved successfully'));
});

export const getInventoryMovements = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const report = await reportService.getInventoryMovements(params);
  res.json(new ApiResponse(200, report, 'Inventory movements retrieved successfully'));
});

export const getLowStockReport = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
  };

  const report = await reportService.getLowStockReport(params);
  res.json(new ApiResponse(200, report, 'Low stock report retrieved successfully'));
});

export const getExpiringItemsReport = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, days } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
  };

  const daysAhead = days ? parseInt(days as string) : 7;
  const report = await reportService.getExpiringItemsReport(params, daysAhead);
  res.json(new ApiResponse(200, report, 'Expiring items report retrieved successfully'));
});

// ============ CUSTOMER REPORTS ============

export const getCustomerSummary = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const report = await reportService.getCustomerSummary(params);
  res.json(new ApiResponse(200, report, 'Customer summary retrieved successfully'));
});

export const getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate, limit } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const limitNum = limit ? parseInt(limit as string) : 10;
  const report = await reportService.getTopCustomers(params, limitNum);
  res.json(new ApiResponse(200, report, 'Top customers retrieved successfully'));
});

// ============ REVENUE REPORTS ============

export const getRevenueByBranch = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, startDate, endDate } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const report = await reportService.getRevenueByBranch(params);
  res.json(new ApiResponse(200, report, 'Revenue by branch retrieved successfully'));
});

export const getRevenueByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const report = await reportService.getRevenueByCategory(params);
  res.json(new ApiResponse(200, report, 'Revenue by category retrieved successfully'));
});

// ============ DASHBOARD ============

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, branchId, startDate, endDate } = req.query;

  const params = {
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  };

  const report = await reportService.getDashboardStats(params);
  res.json(new ApiResponse(200, report, 'Dashboard statistics retrieved successfully'));
});

// ============ EXPENSE REPORTS ============

export const getExpensesSummary = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  // Use expenses API directly via prisma
  const prisma = require('../config/database').default;
  
  const where: any = {};
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const expenses = await prisma.expense.findMany({ where });
  
  const summary = {
    totalExpenses: expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
    totalPaid: expenses.filter((exp: any) => exp.status === 'APPROVED').reduce((sum: number, exp: any) => sum + exp.amount, 0),
    totalPending: expenses.filter((exp: any) => exp.status === 'PENDING').reduce((sum: number, exp: any) => sum + exp.amount, 0),
    expenseCount: expenses.length,
  };

  const byCategory = expenses.reduce((acc: any, exp: any) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { category: exp.category, amount: 0, count: 0 };
    }
    acc[exp.category].amount += exp.amount;
    acc[exp.category].count += 1;
    return acc;
  }, {});

  const result = {
    period: {
      startDate: startDate || new Date(0).toISOString(),
      endDate: endDate || new Date().toISOString(),
    },
    summary,
    byCategory: Object.values(byCategory),
  };

  res.json(new ApiResponse(200, result, 'Expense summary retrieved successfully'));
});

// ============ PROFIT & LOSS ============

export const getProfitLoss = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const prisma = require('../config/database').default;

  const where: any = {};
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  // Get orders (revenue)
  const orders = await prisma.order.findMany({
    where: { ...where, status: { in: ['COMPLETED', 'SERVED'] } },
  });

  const revenue = {
    sales: orders.reduce((sum: number, order: any) => sum + order.subtotal, 0),
    tax: orders.reduce((sum: number, order: any) => sum + order.tax, 0),
    serviceCharge: orders.reduce((sum: number, order: any) => sum + order.serviceCharge, 0),
    totalRevenue: orders.reduce((sum: number, order: any) => sum + order.total, 0),
  };

  // Get expenses
  const expenseWhere: any = {};
  if (startDate && endDate) {
    expenseWhere.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const allExpenses = await prisma.expense.findMany({ where: expenseWhere });

  const expenses = {
    ingredients: allExpenses.filter((e: any) => e.category === 'Ingredients').reduce((sum: number, e: any) => sum + e.amount, 0),
    utilities: allExpenses.filter((e: any) => e.category === 'Utilities').reduce((sum: number, e: any) => sum + e.amount, 0),
    payroll: allExpenses.filter((e: any) => e.category === 'Payroll').reduce((sum: number, e: any) => sum + e.amount, 0),
    rent: allExpenses.filter((e: any) => e.category === 'Rent').reduce((sum: number, e: any) => sum + e.amount, 0),
    marketing: allExpenses.filter((e: any) => e.category === 'Marketing').reduce((sum: number, e: any) => sum + e.amount, 0),
    maintenance: allExpenses.filter((e: any) => e.category === 'Maintenance').reduce((sum: number, e: any) => sum + e.amount, 0),
    other: allExpenses.filter((e: any) => e.category === 'Other').reduce((sum: number, e: any) => sum + e.amount, 0),
    totalExpenses: allExpenses.reduce((sum: number, e: any) => sum + e.amount, 0),
  };

  const profit = {
    gross: revenue.sales - expenses.ingredients,
    net: revenue.totalRevenue - expenses.totalExpenses,
    margin: revenue.totalRevenue > 0 ? ((revenue.totalRevenue - expenses.totalExpenses) / revenue.totalRevenue) * 100 : 0,
  };

  const result = {
    period: {
      startDate: startDate || new Date(0).toISOString(),
      endDate: endDate || new Date().toISOString(),
    },
    revenue,
    expenses,
    profit,
  };

  res.json(new ApiResponse(200, result, 'Profit & Loss report retrieved successfully'));
});
