import { Request, Response } from 'express';
import { MenuVariantService } from '../services/menu-variant.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const variantService = new MenuVariantService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { menuItemId } = req.query;

  const variants = await variantService.getAll(menuItemId as string);

  res.status(200).json(
    new ApiResponse(200, variants, 'Menu variants fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const variant = await variantService.getById(id);

  res.status(200).json(
    new ApiResponse(200, variant, 'Menu variant fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, price, menuItemId, isActive } = req.body;

  if (!name || !menuItemId || price === undefined) {
    throw new ApiError(400, 'Name, menuItemId, and price are required');
  }

  const variant = await variantService.create({
    name,
    price: parseFloat(price),
    menuItemId,
    isActive,
  });

  res.status(201).json(
    new ApiResponse(201, variant, 'Menu variant created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (data.price) data.price = parseFloat(data.price);

  const variant = await variantService.update(id, data);

  res.status(200).json(
    new ApiResponse(200, variant, 'Menu variant updated successfully')
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await variantService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Menu variant deleted successfully')
  );
});
