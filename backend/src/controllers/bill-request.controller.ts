import { Request, Response } from 'express';
import { BillRequestService } from '../services/bill-request.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { BillRequestQueryParams, CreateBillRequestData, ProcessBillRequestData } from '../types/bill-request.types';

const billRequestService = new BillRequestService();

export const getBillRequests = asyncHandler(async (req: Request, res: Response) => {
  const params: BillRequestQueryParams = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    status: req.query.status as any,
    requestedById: req.query.requestedById as string,
    processedById: req.query.processedById as string,
    branchId: req.query.branchId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
  };

  console.log('Bill requests query params:', params);

  const result = await billRequestService.getAll(params);

  console.log('Bill requests service result:', {
    dataLength: result.data.length,
    pagination: result.pagination,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getBillRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const billRequest = await billRequestService.getById(id);

  res.json({
    success: true,
    data: billRequest,
  });
});

export const createBillRequest = asyncHandler(async (req: Request, res: Response) => {
  const data: CreateBillRequestData = req.body;
  const userId = req.user!.id;

  const billRequest = await billRequestService.create(data, userId);

  res.status(201).json({
    success: true,
    message: 'Bill request created successfully',
    data: billRequest,
  });
});

export const processBillRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: ProcessBillRequestData = req.body;
  const userId = req.user!.id;

  const billRequest = await billRequestService.process(id, userId, data);

  res.json({
    success: true,
    message: 'Bill request is now being processed',
    data: billRequest,
  });
});

export const completeBillRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { billId } = req.body;

  const billRequest = await billRequestService.complete(id, billId);

  res.json({
    success: true,
    message: 'Bill request completed successfully',
    data: billRequest,
  });
});

export const cancelBillRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const billRequest = await billRequestService.cancel(id, reason);

  res.json({
    success: true,
    message: 'Bill request cancelled',
    data: billRequest,
  });
});

export const getPendingCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;

  const count = await billRequestService.getPendingCount(userId);

  res.json({
    success: true,
    data: { count },
  });
});
