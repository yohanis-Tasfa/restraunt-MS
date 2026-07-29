import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateSupplierData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  contactPerson?: string;
  restaurantId: string;
  isActive?: boolean;
}

interface UpdateSupplierData extends Partial<Omit<CreateSupplierData, 'restaurantId'>> {}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  isActive?: boolean;
}

export class SupplierService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 50, search, restaurantId, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await prisma.supplier.count({ where });

    const suppliers = await prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      data: suppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        purchaseOrders: {
          include: {
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    // Calculate total spent
    const totalSpent = await prisma.purchaseOrder.aggregate({
      where: {
        supplierId: id,
        status: 'RECEIVED',
      },
      _sum: {
        total: true,
      },
    });

    return {
      ...supplier,
      totalSpent: totalSpent._sum.total || 0,
    };
  }

  async create(data: CreateSupplierData) {
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    // Check if supplier name already exists for this restaurant
    const existing = await prisma.supplier.findFirst({
      where: {
        name: data.name,
        restaurantId: data.restaurantId,
      },
    });

    if (existing) {
      throw new ApiError(400, 'Supplier with this name already exists');
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return supplier;
  }

  async update(id: string, data: UpdateSupplierData) {
    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Supplier not found');
    }

    // Check name uniqueness if being changed
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.supplier.findFirst({
        where: {
          name: data.name,
          restaurantId: existing.restaurantId,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ApiError(400, 'Supplier with this name already exists');
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return supplier;
  }

  async delete(id: string) {
    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Supplier not found');
    }

    // Check if supplier has purchase orders
    if (existing._count.purchaseOrders > 0) {
      throw new ApiError(
        400,
        'Cannot delete supplier with existing purchase orders. Mark as inactive instead.'
      );
    }

    await prisma.supplier.delete({ where: { id } });

    return { message: 'Supplier deleted successfully' };
  }
}
