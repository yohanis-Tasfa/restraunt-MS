import { Request, Response } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const restaurantService = new RestaurantService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, city } = req.query;

  const result = await restaurantService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    city: city as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Restaurants fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const restaurant = await restaurantService.getById(id);

  res.status(200).json(
    new ApiResponse(200, restaurant, 'Restaurant fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await restaurantService.create(req.body);

  res.status(201).json(
    new ApiResponse(201, restaurant, 'Restaurant created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const restaurant = await restaurantService.update(id, req.body);

  res.status(200).json(
    new ApiResponse(200, restaurant, 'Restaurant updated successfully')
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await restaurantService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Restaurant deleted successfully')
  );
});

export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit, search } = req.query;

  const result = await restaurantService.getBranches(id, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Restaurant branches fetched successfully')
  );
});
