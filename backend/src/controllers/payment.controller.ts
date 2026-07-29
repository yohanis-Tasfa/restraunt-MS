import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const paymentService = new PaymentService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, orderId, method, startDate, endDate } = req.query;

  const result = await paymentService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    orderId: orderId as string,
    method: method as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Payments fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payment = await paymentService.getById(id);

  res.status(200).json(
    new ApiResponse(200, payment, 'Payment fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, amount, method, reference } = req.body;

  if (!orderId || !amount || !method) {
    throw new ApiError(400, 'OrderId, amount, and method are required');
  }

  const payment = await paymentService.create({
    orderId,
    amount: parseFloat(amount),
    method,
    reference,
  });

  res.status(201).json(
    new ApiResponse(201, payment, 'Payment processed successfully')
  );
});

export const refund = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, amount } = req.body;

  if (!reason) {
    throw new ApiError(400, 'Refund reason is required');
  }

  const result = await paymentService.refund(id, {
    reason,
    amount: amount ? parseFloat(amount) : undefined,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Payment refunded successfully')
  );
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { branchId, startDate, endDate } = req.query;

  const summary = await paymentService.getSummary(
    branchId as string,
    startDate as string,
    endDate as string
  );

  res.status(200).json(
    new ApiResponse(200, summary, 'Payment summary fetched successfully')
  );
});
