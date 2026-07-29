import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  res.status(201).json(
    new ApiResponse(201, result, 'User registered successfully')
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const result = await authService.login({ email, password });

  res.status(200).json(
    new ApiResponse(200, result, 'Login successful')
  );
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  const result = await authService.refreshToken(refreshToken);

  res.status(200).json(
    new ApiResponse(200, result, 'Token refreshed successfully')
  );
});



export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  await authService.logout(refreshToken);

  res.status(200).json(
    new ApiResponse(200, null, 'Logout successful')
  );
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const { password, ...userWithoutPassword } = req.user;

  res.status(200).json(
    new ApiResponse(200, userWithoutPassword, 'User details fetched successfully')
  );
});
