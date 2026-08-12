import { Request, Response } from 'express';
import prisma from '../config/database';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { UserStatus } from '@prisma/client';

const userService = new UserService();

// User Controllers
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, restaurantId, branchId, roleId, status } = req.query;

  const params = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    restaurantId: restaurantId as string,
    branchId: branchId as string,
    roleId: roleId as string,
    status: status as UserStatus,
  };

  const result = await userService.getAll(params);
  res.json(new ApiResponse(200, result, 'Users retrieved successfully'));
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.getById(id);
  res.json(new ApiResponse(200, user, 'User retrieved successfully'));
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  if (!data.email || !data.password || !data.firstName || !data.lastName) {
    throw new ApiError(400, 'Email, password, first name, and last name are required');
  }

  if (!data.roleId || !data.restaurantId) {
    throw new ApiError(400, 'Role ID and Restaurant ID are required');
  }

  // Password validation
  if (data.password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  const user = await userService.create(data);
  res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const user = await userService.update(id, data);
  res.json(new ApiResponse(200, user, 'User updated successfully'));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.delete(id);
  res.json(new ApiResponse(200, result, result.message));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters long');
  }

  const result = await userService.changePassword(id, { currentPassword, newPassword });
  res.json(new ApiResponse(200, result, result.message));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, 'New password is required');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters long');
  }

  const result = await userService.resetPassword(id, newPassword);
  res.json(new ApiResponse(200, result, result.message));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  if (!Object.values(UserStatus).includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }

  const result = await userService.updateStatus(id, status);
  res.json(new ApiResponse(200, result, result.message));
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  const stats = await userService.getStats(restaurantId as string);
  res.json(new ApiResponse(200, stats, 'User statistics retrieved successfully'));
});

// Role Controllers
export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await userService.getAllRoles();
  res.json(new ApiResponse(200, roles, 'Roles retrieved successfully'));
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const role = await userService.getRoleById(id);
  res.json(new ApiResponse(200, role, 'Role retrieved successfully'));
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, permissions } = req.body;

  if (!name) {
    throw new ApiError(400, 'Role name is required');
  }

  const role = await userService.createRole({ name, description, permissions });
  res.status(201).json(new ApiResponse(201, role, 'Role created successfully'));
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, permissions } = req.body;

  const role = await userService.updateRole(id, { name, description, permissions });
  res.json(new ApiResponse(200, role, 'Role updated successfully'));
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.deleteRole(id);
  res.json(new ApiResponse(200, result, result.message));
});
