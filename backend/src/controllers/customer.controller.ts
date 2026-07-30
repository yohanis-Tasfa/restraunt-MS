import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const customerService = new CustomerService();

export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, restaurantId, city, hasOrders } = req.query;

  const params = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    restaurantId: restaurantId as string,
    city: city as string,
    hasOrders: hasOrders === 'true',
  };

  const result = await customerService.getAll(params);
  res.json(new ApiResponse(200, result, 'Customers retrieved successfully'));
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = await customerService.getById(id);
  res.json(new ApiResponse(200, customer, 'Customer retrieved successfully'));
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  if (!data.firstName || !data.lastName) {
    throw new ApiError(400, 'First name and last name are required');
  }

  if (!data.restaurantId) {
    throw new ApiError(400, 'Restaurant ID is required');
  }

  const customer = await customerService.create(data);
  res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const customer = await customerService.update(id, data);
  res.json(new ApiResponse(200, customer, 'Customer updated successfully'));
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await customerService.delete(id);
  res.json(new ApiResponse(200, result, result.message));
});

export const getCustomerOrders = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const params = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  };

  const result = await customerService.getOrders(id, params);
  res.json(new ApiResponse(200, result, 'Customer orders retrieved successfully'));
});

export const getCustomerReservations = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const params = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  };

  const result = await customerService.getReservations(id, params);
  res.json(new ApiResponse(200, result, 'Customer reservations retrieved successfully'));
});

export const manageLoyaltyPoints = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { points, reason } = req.body;

  if (typeof points !== 'number') {
    throw new ApiError(400, 'Points must be a number');
  }

  if (!reason) {
    throw new ApiError(400, 'Reason is required');
  }

  const result = await customerService.manageLoyaltyPoints(id, { points, reason });
  res.json(new ApiResponse(200, result, 'Loyalty points updated successfully'));
});

export const getUpcomingBirthdays = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  const { days } = req.query;

  if (!restaurantId) {
    throw new ApiError(400, 'Restaurant ID is required');
  }

  const daysAhead = days ? parseInt(days as string) : 30;
  const customers = await customerService.getUpcomingBirthdays(
    restaurantId as string,
    daysAhead
  );

  res.json(
    new ApiResponse(
      200,
      customers,
      `Found ${customers.length} customers with birthdays in the next ${daysAhead} days`
    )
  );
});

export const getCustomerStats = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  const stats = await customerService.getStats(restaurantId as string);
  res.json(new ApiResponse(200, stats, 'Customer statistics retrieved successfully'));
});
