import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const expenseController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, category, status, startDate, endDate, search } = req.query;

    const result = await expenseService.getAll({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      category: category as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string,
    });

    res.status(200).json(new ApiResponse(200, result, 'Expenses fetched successfully'));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const expense = await expenseService.getById(id);

    res.status(200).json(new ApiResponse(200, expense, 'Expense fetched successfully'));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { category, amount, description, reference, attachment, date, status } = req.body;

    if (!category || !amount || !date) {
      throw new ApiError(400, 'Category, amount, and date are required');
    }

    const expense = await expenseService.create({
      category,
      amount: parseFloat(amount),
      description,
      reference,
      attachment,
      userId: req.user.id,
      date: new Date(date),
      status,
    });

    res.status(201).json(new ApiResponse(201, expense, 'Expense created successfully'));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { category, amount, description, reference, attachment, date, status } = req.body;

    const expense = await expenseService.update(id, {
      category,
      amount: amount ? parseFloat(amount) : undefined,
      description,
      reference,
      attachment,
      date: date ? new Date(date) : undefined,
      status,
    });

    res.status(200).json(new ApiResponse(200, expense, 'Expense updated successfully'));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await expenseService.delete(id);

    res.status(200).json(new ApiResponse(200, null, 'Expense deleted successfully'));
  }),

  getStats: asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const stats = await expenseService.getStats(
      startDate as string,
      endDate as string
    );

    res.status(200).json(new ApiResponse(200, stats, 'Expense stats fetched successfully'));
  }),

  getCategories: asyncHandler(async (req: Request, res: Response) => {
    const categories = await expenseService.getCategories();

    res.status(200).json(new ApiResponse(200, categories, 'Categories fetched successfully'));
  }),
};
