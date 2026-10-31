import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError';

interface GetAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  roleId?: string;
  status?: string;
}

interface CreateUserData {
  email: string;
  username?: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  restaurantId: string;
  branchId?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

interface UpdateUserData {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  branchId?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  async getAll(params: GetAllUsersParams = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      restaurantId,
      branchId,
      roleId,
      status,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Restaurant filter
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    // Branch filter
    if (branchId) {
      where.branchId = branchId;
    }

    // Role filter
    if (roleId) {
      where.roleId = roleId;
    }

    // Status filter
    if (status === 'ACTIVE') {
      where.isActive = true;
      where.isLocked = false;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    } else if (status === 'LOCKED') {
      where.isLocked = true;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          isLocked: true,
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
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          employee: {
            select: {
              id: true,
              employeeCode: true,
              position: true,
              department: true,
              salary: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isLocked: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
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
        employee: {
          select: {
            id: true,
            employeeCode: true,
            position: true,
            department: true,
            salary: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  async create(data: CreateUserData) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ApiError(400, 'Email already exists');
    }

    // Auto-generate username if not provided
    const baseUsername = data.username?.trim() || data.email.split('@')[0];
    let finalUsername = baseUsername;
    const existingUsername = await prisma.user.findUnique({
      where: { username: finalUsername },
    });
    if (existingUsername) {
      finalUsername = `${baseUsername}_${Math.floor(Math.random() * 899 + 100)}`;
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    // Verify branch exists if provided
    if (data.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: data.branchId },
      });

      if (!branch) {
        throw new ApiError(404, 'Branch not found');
      }

      // Verify branch belongs to restaurant
      if (branch.restaurantId !== data.restaurantId) {
        throw new ApiError(400, 'Branch does not belong to the specified restaurant');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        username: finalUsername,
        password: hashedPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        roleId: data.roleId,
        restaurantId: data.restaurantId,
        branchId: data.branchId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isLocked: data.isLocked !== undefined ? data.isLocked : false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isLocked: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  async update(id: string, data: UpdateUserData) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    // Check if email is being updated and if it already exists
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ApiError(400, 'Email already exists');
      }
    }

    // Verify role exists if being updated
    if (data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
      });

      if (!role) {
        throw new ApiError(404, 'Role not found');
      }
    }

    // Verify branch exists if being updated
    if (data.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: data.branchId },
      });

      if (!branch) {
        throw new ApiError(404, 'Branch not found');
      }

      // Verify branch belongs to user's restaurant
      if (branch.restaurantId !== existingUser.restaurantId) {
        throw new ApiError(400, 'Branch does not belong to the user\'s restaurant');
      }
    }

    const updatePayload: any = {};
    if (data.email) updatePayload.email = data.email.trim().toLowerCase();
    if (data.username) updatePayload.username = data.username.trim();
    if (data.firstName) updatePayload.firstName = data.firstName.trim();
    if (data.lastName) updatePayload.lastName = data.lastName.trim();
    if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null;
    if (data.roleId) updatePayload.roleId = data.roleId;
    if (data.branchId !== undefined) updatePayload.branchId = data.branchId || null;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.isLocked !== undefined) updatePayload.isLocked = data.isLocked;

    const user = await prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isLocked: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  async delete(id: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check if user has orders
    const ordersCount = await prisma.order.count({
      where: { createdById: id },
    });

    if (ordersCount > 0) {
      // Soft delete - deactivate the user instead
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        success: true,
        message: `User deactivated (has ${ordersCount} orders). User active status set to false.`,
      };
    }

    // Hard delete if no orders
    await prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  async changePassword(id: string, data: ChangePasswordData) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async updateStatus(id: string, status: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    let isActive = user.isActive;
    let isLocked = user.isLocked;

    if (status === 'ACTIVE') {
      isActive = true;
      isLocked = false;
    } else if (status === 'INACTIVE') {
      isActive = false;
    } else if (status === 'LOCKED') {
      isLocked = true;
    } else if (status === 'UNLOCKED') {
      isLocked = false;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive, isLocked },
    });

    return {
      success: true,
      message: `User status updated to ${status}`,
    };
  }

  async getStats(restaurantId?: string) {
    const where: any = restaurantId ? { restaurantId } : {};

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      lockedUsers,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, isActive: true, isLocked: false } }),
      prisma.user.count({ where: { ...where, isActive: false } }),
      prisma.user.count({ where: { ...where, isLocked: true } }),
      prisma.user.groupBy({
        by: ['roleId'],
        where,
        _count: true,
      }),
    ]);

    // Get role names
    const roleIds = usersByRole.map((r) => r.roleId);
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });

    const usersByRoleWithNames = usersByRole.map((item) => {
      const role = roles.find((r) => r.id === item.roleId);
      return {
        roleId: item.roleId,
        roleName: role?.name || 'Unknown',
        count: item._count,
      };
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers: lockedUsers,
      usersByRole: usersByRoleWithNames,
    };
  }

  // Role management methods
  async getAllRoles() {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles;
  }

  async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    return role;
  }

  async createRole(data: { name: string; description?: string; permissions?: any }) {
    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new ApiError(400, 'Role name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions || {},
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        createdAt: true,
      },
    });

    return role;
  }

  async updateRole(id: string, data: { name?: string; description?: string; permissions?: any }) {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    // Check if new name already exists
    if (data.name && data.name !== role.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name: data.name },
      });

      if (existingRole) {
        throw new ApiError(400, 'Role name already exists');
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        updatedAt: true,
      },
    });

    return updatedRole;
  }

  async deleteRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    if (role._count.users > 0) {
      throw new ApiError(
        400,
        `Cannot delete role. ${role._count.users} user(s) are assigned to this role.`
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}
