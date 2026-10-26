import { Request, Response } from 'express';
import { TipService } from '../services/tip.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const tipService = new TipService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, waiterId, status, method, startDate, endDate } = req.query;

  const result = await tipService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    waiterId: waiterId as string,
    status: status as any,
    method: method as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Tips fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tip = await tipService.getById(id);

  res.status(200).json(
    new ApiResponse(200, tip, 'Tip fetched successfully')
  );
});

export const getMyTips = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, method, startDate, endDate } = req.query;
  const waiterId = req.user.id; // Get from authenticated user

  const result = await tipService.getMyTips(waiterId, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    status: status as any,
    method: method as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Your tips fetched successfully')
  );
});

export const getTipSummary = asyncHandler(async (req: Request, res: Response) => {
  const { waiterId, startDate, endDate } = req.query;

  const summary = await tipService.getTipSummary(
    waiterId as string,
    startDate as string,
    endDate as string
  );

  res.status(200).json(
    new ApiResponse(200, summary, 'Tip summary fetched successfully')
  );
});

export const getMyTipSummary = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const waiterId = req.user.id; // Get from authenticated user

  const summary = await tipService.getTipSummary(
    waiterId,
    startDate as string,
    endDate as string
  );

  res.status(200).json(
    new ApiResponse(200, summary, 'Your tip summary fetched successfully')
  );
});

export const markAsPaid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;
  const paidById = req.user.id; // Manager/Cashier who is paying

  const tip = await tipService.markAsPaid(id, paidById, { notes });

  res.status(200).json(
    new ApiResponse(200, tip, 'Tip marked as paid successfully')
  );
});

export const getPendingPayoutAmount = asyncHandler(async (req: Request, res: Response) => {
  const { waiterId } = req.query;

  const result = await tipService.getPendingPayoutAmount(waiterId as string);

  res.status(200).json(
    new ApiResponse(200, result, 'Pending payout amount fetched successfully')
  );
});
