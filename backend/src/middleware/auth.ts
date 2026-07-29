import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../config/database';

interface JwtPayload {
  userId: string;
  email: string;
  roleId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Access token is required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        restaurant: true,
        branch: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'User account is inactive');
    }

    if (user.isLocked) {
      throw new ApiError(403, 'User account is locked');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Token expired');
    }
    throw error;
  }
});

export const authorize = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const userPermissions = req.user.role.permissions as string[];

    const hasPermission = permissions.some((permission) => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );

    if (!hasPermission) {
      throw new ApiError(403, 'Insufficient permissions');
    }

    next();
  };
};
