import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

interface GetAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  roleId?: string;
  status?: UserStatus;
}

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  restaurantId: string;
  branchId?: string;
  status?: UserStatus;
}

interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  branchId?: string;
  status?: UserStatus;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  async getAll(params: GetAllUsersParams = {}) {
    const {
      page = 1,
      limit = 10,
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
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          lastLoginAt: true,
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
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        lastLoginAt: true,
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
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roleId: data.roleId,
        restaurantId: data.restaurantId,
        branchId: data.branchId,
        status: data.status || UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
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

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roleId: data.roleId,
        branchId: data.branchId,
        status: data.status,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
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
        data: { status: UserStatus.INACTIVE },
      });

      return {
        success: true,
        message: `User deactivated (has ${ordersCount} orders). User status set to INACTIVE.`,
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

  async updateStatus(id: string, status: UserStatus) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await prisma.user.update({
      where: { id },
      data: { status },
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
      suspendedUsers,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { ...where, status: UserStatus.INACTIVE } }),
      prisma.user.count({ where: { ...where, status: UserStatus.SUSPENDED } }),
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
      suspendedUsers,
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
