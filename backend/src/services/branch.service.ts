import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateBranchData {
  name: string;
  code: string;
  restaurantId: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
  openingTime?: string;
  closingTime?: string;
}

interface UpdateBranchData extends Partial<Omit<CreateBranchData, 'code' | 'restaurantId'>> {}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  isActive?: boolean;
}

export class BranchService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 10, search, restaurantId, isActive } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count
    const total = await prisma.branch.count({ where });

    // Get branches
    const branches = await prisma.branch.findMany({
      where,
      skip,
      take: limit,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            users: true,
            tables: true,
            orders: true,
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: branches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
            email: true,
            phone: true,
            taxRate: true,
            vatRate: true,
            serviceCharge: true,
            currency: true,
          },
        },
        _count: {
          select: {
            users: true,
            tables: true,
            orders: true,
            inventory: true,
            reservations: true,
          },
        },
      },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    return branch;
  }

  async create(data: CreateBranchData) {
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    // Check if branch code already exists
    const existingCode = await prisma.branch.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      throw new ApiError(400, 'Branch code already exists');
    }

    const branch = await prisma.branch.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return branch;
  }

  async update(id: string, data: UpdateBranchData) {
    // Check if branch exists
    const existing = await prisma.branch.findUnique({ where: { id } });

    if (!existing) {
      throw new ApiError(404, 'Branch not found');
    }

    const branch = await prisma.branch.update({
      where: { id },
      data,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return branch;
  }

  async delete(id: string) {
    // Check if branch exists
    const existing = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            tables: true,
            orders: true,
            inventory: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check if branch has users
    if (existing._count.users > 0) {
      throw new ApiError(
        400,
        'Cannot delete branch with existing users. Reassign users first.'
      );
    }

    // Check if branch has active orders
    if (existing._count.orders > 0) {
      throw new ApiError(
        400,
        'Cannot delete branch with existing orders. Complete or cancel orders first.'
      );
    }

    // Check if branch has tables
    if (existing._count.tables > 0) {
      throw new ApiError(
        400,
        'Cannot delete branch with existing tables. Delete tables first.'
      );
    }

    await prisma.branch.delete({ where: { id } });

    return { message: 'Branch deleted successfully' };
  }

  async toggleActive(id: string, isActive: boolean) {
    const branch = await prisma.branch.findUnique({ where: { id } });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: { isActive },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }
}
