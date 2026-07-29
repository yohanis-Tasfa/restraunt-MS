import { Request, Response } from 'express';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const purchaseOrderService = new PurchaseOrderService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, supplierId, status, startDate, endDate } = req.query;

  const result = await purchaseOrderService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    supplierId: supplierId as string,
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Purchase orders fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await purchaseOrderService.getById(id);

  res.status(200).json(
    new ApiResponse(200, order, 'Purchase order fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { supplierId, items, notes, expectedDate } = req.body;

  if (!supplierId || !items || items.length === 0) {
    throw new ApiError(400, 'SupplierId and items are required');
  }

  const order = await purchaseOrderService.create({
    supplierId,
    items,
    notes,
    expectedDate,
  });

  res.status(201).json(
    new ApiResponse(201, order, 'Purchase order created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await purchaseOrderService.update(id, req.body);

  res.status(200).json(
    new ApiResponse(200, order, 'Purchase order updated successfully')
  );
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  const order = await purchaseOrderService.updateStatus(id, status);

  res.status(200).json(
    new ApiResponse(200, order, `Purchase order status updated to ${status}`)
  );
});

export const receiveGoods = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, 'Items array is required');
  }

  const order = await purchaseOrderService.receiveGoods(id, items);

  res.status(200).json(
    new ApiResponse(200, order, 'Goods received successfully')
  );
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await purchaseOrderService.cancel(id, reason);

  res.status(200).json(
    new ApiResponse(200, order, 'Purchase order cancelled successfully')
  );
});
