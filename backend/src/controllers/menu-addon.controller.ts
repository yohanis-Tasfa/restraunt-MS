import { Request, Response } from 'express';
import { MenuAddonService } from '../services/menu-addon.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const addonService = new MenuAddonService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { menuItemId } = req.query;

  const addons = await addonService.getAll(menuItemId as string);

  res.status(200).json(
    new ApiResponse(200, addons, 'Menu addons fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const addon = await addonService.getById(id);

  res.status(200).json(
    new ApiResponse(200, addon, 'Menu addon fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, price, menuItemId, isActive } = req.body;

  if (!name || !menuItemId || price === undefined) {
    throw new ApiError(400, 'Name, menuItemId, and price are required');
  }

  const addon = await addonService.create({
    name,
    price: parseFloat(price),
    menuItemId,
    isActive,
  });

  res.status(201).json(
    new ApiResponse(201, addon, 'Menu addon created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (data.price) data.price = parseFloat(data.price);

  const addon = await addonService.update(id, data);

  res.status(200).json(
    new ApiResponse(200, addon, 'Menu addon updated successfully')
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await addonService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Menu addon deleted successfully')
  );
});
