import { Request, Response } from 'express';
import { IngredientRequestService } from '../services/ingredient-request.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const service = new IngredientRequestService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const branchId = (req.query.branchId as string) || req.user?.branchId || undefined;
  const status = req.query.status as string;

  const result = await service.getAll({ branchId, status });
  res.status(200).json(new ApiResponse(200, result, 'Ingredient requests fetched successfully'));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { inventoryId, quantity, priority, notes } = req.body;
  const branchId = req.body.branchId || req.user?.branchId;

  const result = await service.create({
    branchId,
    inventoryId,
    quantity,
    priority,
    notes,
    user: req.user,
  });

  res.status(201).json(new ApiResponse(201, result, 'Ingredient request submitted to store'));
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await service.approve(id, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Ingredient request approved and stock deducted'));
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const result = await service.reject(id, reason, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Ingredient request rejected'));
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await service.cancel(id, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Ingredient request cancelled'));
});

