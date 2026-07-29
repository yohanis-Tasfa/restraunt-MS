import { Request, Response } from 'express';
import { MenuCategoryService } from '../services/menu-category.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const categoryService = new MenuCategoryService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, restaurantId, parentId, isActive } = req.query;

  const result = await categoryService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    restaurantId: restaurantId as string,
    parentId: parentId === 'null' ? null : (parentId as string),
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Menu categories fetched successfully')
  );
});

export const getTree = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId } = req.query;

  if (!restaurantId) {
    throw new ApiError(400, 'Restaurant ID is required');
  }

  const tree = await categoryService.getTree(restaurantId as string);

  res.status(200).json(
    new ApiResponse(200, tree, 'Category tree fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await categoryService.getById(id);

  res.status(200).json(
    new ApiResponse(200, category, 'Menu category fetched successfully')
  );
});

export const getCategoryItems = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit, search, isActive } = req.query;

  const result = await categoryService.getCategoryItems(id, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Category items fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, restaurantId, parentId, isActive, sortOrder } = req.body;

  if (!name || !restaurantId) {
    throw new ApiError(400, 'Name and restaurantId are required');
  }

  const category = await categoryService.create({
    name,
    description,
    restaurantId,
    parentId,
    isActive,
    sortOrder,
  });

  res.status(201).json(
    new ApiResponse(201, category, 'Menu category created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await categoryService.update(id, req.body);

  res.status(200).json(
    new ApiResponse(200, category, 'Menu category updated successfully')
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await categoryService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Menu category deleted successfully')
  );
});
