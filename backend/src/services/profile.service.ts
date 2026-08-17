import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../config/cloudinary';

const prisma = new PrismaClient();

export const profileService = {
  // Get user profile with employee info if exists
  async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          profilePicture: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get employee info separately (may not exist for all users)
      const employee = await prisma.employee.findUnique({
        where: { userId },
        select: {
          id: true,
          employeeCode: true,
          department: true,
          position: true,
          employmentType: true,
          salary: true,
          hireDate: true,
          status: true,
        },
      });

      // Get user statistics
      const [totalOrders, totalExpenses] = await Promise.all([
        prisma.order.count({
          where: { createdById: userId },
        }),
        prisma.expense.count({
          where: { userId },
        }),
      ]);

      return {
        ...user,
        employee: employee || null,
        statistics: {
          totalOrders,
          totalExpenses,
        },
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  // Update profile information
  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
    }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        profilePicture: true,
        updatedAt: true,
      },
    });

    return user;
  },

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  },

  // Upload profile picture
  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    try {
      // When using CloudinaryStorage, the file.path contains the Cloudinary URL
      const imageUrl = (file as any).path || file.path;

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      // Update user profile picture
      const user = await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: imageUrl },
        select: {
          id: true,
          profilePicture: true,
        },
      });

      return user;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error('Failed to upload profile picture');
    }
  },

  // Get activity log
  async getActivityLog(userId: string, limit: number = 10) {
    const activities = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return activities;
  },
};
