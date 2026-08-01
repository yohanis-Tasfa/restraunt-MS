import { Request, Response } from 'express';
import { MenuItemService } from '../services/menu-item.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const itemService = new MenuItemService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    search,
    categoryId,
    isAvailable,
    isVegetarian,
    isSpicy,
    minPrice,
    maxPrice,
  } = req.query;

  const result = await itemService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    categoryId: categoryId as string,
    isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
    isVegetarian: isVegetarian === 'true' ? true : isVegetarian === 'false' ? false : undefined,
    isSpicy: isSpicy === 'true' ? true : isSpicy === 'false' ? false : undefined,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Menu items fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await itemService.getById(id);

  res.status(200).json(
    new ApiResponse(200, item, 'Menu item fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    image,
    price,
    cost,
    categoryId,
    preparationTime,
    isAvailable,
    isVegetarian,
    isSpicy,
    allergens,
    nutritionInfo,
  } = req.body;

  console.log('Creating menu item with data:', {
    name,
    categoryId,
    price,
    hasImage: !!image,
  });

  if (!name || !categoryId || price === undefined) {
    console.error('Validation failed:', { name, categoryId, price });
    throw new ApiError(400, 'Name, categoryId, and price are required');
  }

  const item = await itemService.create({
    name,
    description,
    image,
    price: parseFloat(price),
    cost: cost ? parseFloat(cost) : undefined,
    categoryId,
    preparationTime: preparationTime ? parseInt(preparationTime) : undefined,
    isAvailable,
    isVegetarian,
    isSpicy,
    allergens,
    nutritionInfo,
  });

  res.status(201).json(
    new ApiResponse(201, item, 'Menu item created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  // Convert numeric strings to numbers
  if (data.price) data.price = parseFloat(data.price);
  if (data.cost) data.cost = parseFloat(data.cost);
  if (data.preparationTime) data.preparationTime = parseInt(data.preparationTime);

  const item = await itemService.update(id, data);

  res.status(200).json(
    new ApiResponse(200, item, 'Menu item updated successfully')
  );
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  if (isAvailable === undefined) {
    throw new ApiError(400, 'isAvailable field is required');
  }

  const item = await itemService.toggleAvailability(id, isAvailable);

  res.status(200).json(
    new ApiResponse(
      200,
      item,
      `Menu item ${isAvailable ? 'marked as available' : 'marked as unavailable'}`
    )
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await itemService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Menu item deleted successfully')
  );
});

export const getVariants = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const variants = await itemService.getVariants(id);

  res.status(200).json(
    new ApiResponse(200, variants, 'Menu item variants fetched successfully')
  );
});

export const getAddons = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const addons = await itemService.getAddons(id);

  res.status(200).json(
    new ApiResponse(200, addons, 'Menu item addons fetched successfully')
  );
});
