import { Request, Response } from 'express';
import { TableService } from '../services/table.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const tableService = new TableService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, branchId, floorId, status } = req.query;

  const result = await tableService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    branchId: branchId as string,
    floorId: floorId as string,
    status: status as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Tables fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const table = await tableService.getById(id);

  res.status(200).json(
    new ApiResponse(200, table, 'Table fetched successfully')
  );
});

export const getByBranch = asyncHandler(async (req: Request, res: Response) => {
  const { branchId } = req.params;

  const tables = await tableService.getByBranch(branchId);

  res.status(200).json(
    new ApiResponse(200, tables, 'Branch tables fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { number, capacity, floorId, branchId, status } = req.body;

  if (!number || !capacity || !branchId) {
    throw new ApiError(400, 'Number, capacity, and branchId are required');
  }

  const table = await tableService.create({
    number,
    capacity: parseInt(capacity),
    floorId,
    branchId,
    status,
  });

  res.status(201).json(
    new ApiResponse(201, table, 'Table created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (data.capacity) data.capacity = parseInt(data.capacity);

  const table = await tableService.update(id, data);

  res.status(200).json(
    new ApiResponse(200, table, 'Table updated successfully')
  );
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  const table = await tableService.updateStatus(id, status);

  res.status(200).json(
    new ApiResponse(200, table, `Table status updated to ${status}`)
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await tableService.delete(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Table deleted successfully')
  );
});

export const merge = asyncHandler(async (req: Request, res: Response) => {
  const { tableIds, mergedNumber } = req.body;

  if (!tableIds || !Array.isArray(tableIds) || tableIds.length < 2) {
    throw new ApiError(400, 'At least 2 table IDs are required');
  }

  if (!mergedNumber) {
    throw new ApiError(400, 'Merged table number is required');
  }

  const result = await tableService.mergeTables(tableIds, mergedNumber);

  res.status(200).json(
    new ApiResponse(200, result, 'Tables merged successfully')
  );
});

export const unmerge = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await tableService.unmerge(id);

  res.status(200).json(
    new ApiResponse(200, result, 'Table unmerged successfully')
  );
});

export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { branchId, date } = req.query;

  if (!branchId) {
    throw new ApiError(400, 'Branch ID is required');
  }

  const availability = await tableService.getAvailability(branchId as string, date as string);

  res.status(200).json(
    new ApiResponse(200, availability, 'Table availability fetched successfully')
  );
});
