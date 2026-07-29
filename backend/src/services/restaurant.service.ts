import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateRestaurantData {
  name: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxRate?: number;
  vatRate?: number;
  serviceCharge?: number;
  currency?: string;
}

interface UpdateRestaurantData extends Partial<CreateRestaurantData> {}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
}

export class RestaurantService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 10, search, city } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    // Get total count
    const total = await prisma.restaurant.count({ where });

    // Get restaurants
    const restaurants = await prisma.restaurant.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
            menuCategories: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: restaurants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            users: true,
            menuCategories: true,
            customers: true,
            suppliers: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    return restaurant;
  }

  async create(data: CreateRestaurantData) {
    // Check if restaurant with same name exists
    const existing = await prisma.restaurant.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new ApiError(400, 'Restaurant with this name already exists');
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        ...data,
        country: data.country || 'Ethiopia',
        currency: data.currency || 'ETB',
        taxRate: data.taxRate || 0,
        vatRate: data.vatRate || 15,
        serviceCharge: data.serviceCharge || 0,
      },
      include: {
        _count: {
          select: { branches: true, users: true },
        },
      },
    });

    return restaurant;
  }

  async update(id: string, data: UpdateRestaurantData) {
    // Check if restaurant exists
    const existing = await prisma.restaurant.findUnique({ where: { id } });

    if (!existing) {
      throw new ApiError(404, 'Restaurant not found');
    }

    // Check if name is being changed to an existing name
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.restaurant.findFirst({
        where: { name: data.name, id: { not: id } },
      });

      if (nameExists) {
        throw new ApiError(400, 'Restaurant with this name already exists');
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { branches: true, users: true },
        },
      },
    });

    return restaurant;
  }

  async delete(id: string) {
    // Check if restaurant exists
    const existing = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { branches: true, users: true },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Restaurant not found');
    }

    // Check if restaurant has branches
    if (existing._count.branches > 0) {
      throw new ApiError(
        400,
        'Cannot delete restaurant with existing branches. Delete branches first.'
      );
    }

    // Check if restaurant has users
    if (existing._count.users > 0) {
      throw new ApiError(
        400,
        'Cannot delete restaurant with existing users. Reassign users first.'
      );
    }

    await prisma.restaurant.delete({ where: { id } });

    return { message: 'Restaurant deleted successfully' };
  }

  async getBranches(restaurantId: string, params: QueryParams = {}) {
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { restaurantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.branch.count({ where });

    const branches = await prisma.branch.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            users: true,
            tables: true,
            orders: true,
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
}
