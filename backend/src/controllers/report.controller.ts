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
