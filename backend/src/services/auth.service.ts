import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  restaurantId?: string;
  branchId?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new ApiError(400, 'User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      include: {
        role: true,
        restaurant: true,
        branch: true,
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email, user.roleId);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        role: true,
        restaurant: true,
        branch: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive');
    }

    if (user.isLocked) {
      throw new ApiError(403, 'Account is locked');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email, user.roleId);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };

      // Check if token exists in database
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: { include: { role: true } } },
      });

      if (!refreshToken) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      if (refreshToken.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({ where: { token } });
        throw new ApiError(401, 'Refresh token expired');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(
        refreshToken.user.id,
        refreshToken.user.email,
        refreshToken.user.roleId
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  private generateAccessToken(userId: string, email: string, roleId: string): string {
    return jwt.sign({ userId, email, roleId }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }
}
