import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const inventoryService = new InventoryService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, branchId, category, lowStock } = req.query;

  const result = await inventoryService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    branchId: branchId as string,
    category: category as string,
    lowStock: lowStock === 'true',
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Inventory items fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await inventoryService.getById(id);

  res.status(200).json(
    new ApiResponse(200, item, 'Inventory item fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    sku,
    category,
    unit,
    quantity,
    minQuantity,
    maxQuantity,
    cost,
    branchId,
    expiryDate,
    batchNumber,
  } = req.body;

  if (!name || !unit || cost === undefined || !branchId) {
    throw new ApiError(400, 'Name, unit, cost, and branchId are required');
  }

  const item = await inventoryService.create({
    name,
    description,
    sku,
    category,
    unit,
    quantity: quantity ? parseFloat(quantity) : undefined,
    minQuantity: minQuantity ? parseFloat(minQuantity) : undefined,
    maxQuantity: maxQuantity ? parseFloat(maxQuantity) : undefined,
    cost: parseFloat(cost),
    branchId,
    expiryDate,
    batchNumber,
  });

  res.status(201).json(
    new ApiResponse(201, item, 'Inventory item created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  // Convert numeric strings
  if (data.quantity) data.quantity = parseFloat(data.quantity);
  if (data.minQuantity) data.minQuantity = parseFloat(data.minQuantity);
  if (data.maxQuantity) data.maxQuantity = parseFloat(data.maxQuantity);
  if (data.cost) data.cost = parseFloat(data.cost);

  const item = await inventoryService.update(id, data);

  res.status(200).json(
    new ApiResponse(200, item, 'Inventory item updated successfully')
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await inventoryService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Inventory item deleted successfully')
  );
});

export const addMovement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, quantity, reference, notes } = req.body;

  if (!type || !quantity) {
    throw new ApiError(400, 'Type and quantity are required');
  }

  const result = await inventoryService.addMovement({
    inventoryId: id,
    type,
    quantity: parseFloat(quantity),
    reference,
    notes,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Inventory movement added successfully')
  );
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const { branchId } = req.query;

  const items = await inventoryService.getLowStock(branchId as string);

  res.status(200).json(
    new ApiResponse(200, items, 'Low stock items fetched successfully')
  );
});

export const getExpiring = asyncHandler(async (req: Request, res: Response) => {
  const { branchId, days } = req.query;

  const items = await inventoryService.getExpiring(
    branchId as string,
    days ? parseInt(days as string) : undefined
  );

  res.status(200).json(
    new ApiResponse(200, items, 'Expiring items fetched successfully')
  );
});

export const getMovements = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const result = await inventoryService.getMovements(id, {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Inventory movements fetched successfully')
  );
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { branchId } = req.query;

  const categories = await inventoryService.getCategories(branchId as string);

  res.status(200).json(
    new ApiResponse(200, categories, 'Inventory categories fetched successfully')
  );
});
