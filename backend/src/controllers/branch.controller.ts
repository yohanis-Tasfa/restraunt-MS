import { Request, Response } from 'express';
import { BranchService } from '../services/branch.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const branchService = new BranchService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, restaurantId, isActive } = req.query;

  const result = await branchService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    restaurantId: restaurantId as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Branches fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const branch = await branchService.getById(id);

  res.status(200).json(
    new ApiResponse(200, branch, 'Branch fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, code, restaurantId, address, phone, isActive, openingTime, closingTime } = req.body;

  if (!name || !code || !restaurantId) {
    throw new ApiError(400, 'Name, code, and restaurantId are required');
  }

  const branch = await branchService.create({
    name,
    code,
    restaurantId,
    address,
    phone,
    isActive,
    openingTime,
    closingTime,
  });

  res.status(201).json(
    new ApiResponse(201, branch, 'Branch created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const branch = await branchService.update(id, req.body);

  res.status(200).json(
    new ApiResponse(200, branch, 'Branch updated successfully')
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await branchService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Branch deleted successfully')
  );
});

export const toggleActive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    throw new ApiError(400, 'isActive field is required');
  }

  const branch = await branchService.toggleActive(id, isActive);

  res.status(200).json(
    new ApiResponse(200, branch, `Branch ${isActive ? 'activated' : 'deactivated'} successfully`)
  );
});
