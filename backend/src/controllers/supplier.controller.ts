import { Request, Response } from 'express';
import { SupplierService } from '../services/supplier.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const supplierService = new SupplierService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, restaurantId, isActive } = req.query;

  const result = await supplierService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    restaurantId: restaurantId as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Suppliers fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const supplier = await supplierService.getById(id);

  res.status(200).json(
    new ApiResponse(200, supplier, 'Supplier fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, address, city, contactPerson, restaurantId, isActive } = req.body;

  if (!name || !restaurantId) {
    throw new ApiError(400, 'Name and restaurantId are required');
  }

  const supplier = await supplierService.create({
    name,
    email,
    phone,
    address,
    city,
    contactPerson,
    restaurantId,
    isActive,
  });

  res.status(201).json(
    new ApiResponse(201, supplier, 'Supplier created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const supplier = await supplierService.update(id, req.body);

  res.status(200).json(
    new ApiResponse(200, supplier, 'Supplier updated successfully')
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await supplierService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Supplier deleted successfully')
  );
});
