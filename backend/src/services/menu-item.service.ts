import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateMenuItemData {
  name: string;
  description?: string;
  image?: string;
  price: number;
  cost?: number;
  categoryId: string;
  preparationTime?: number;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  nutritionInfo?: any;
}

interface UpdateMenuItemData extends Partial<CreateMenuItemData> {}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export class MenuItemService {
  async getAll(params: QueryParams = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      isAvailable,
      isVegetarian,
      isSpicy,
      minPrice,
      maxPrice,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (isVegetarian !== undefined) {
      where.isVegetarian = isVegetarian;
    }

    if (isSpicy !== undefined) {
      where.isSpicy = isSpicy;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    const total = await prisma.menuItem.count({ where });

    const items = await prisma.menuItem.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            variants: true,
            addons: true,
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        addons: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        recipeItems: {
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }

    return item;
  }

  async create(data: CreateMenuItemData) {
    // Check if category exists
    const category = await prisma.menuCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new ApiError(404, 'Menu category not found');
    }

    // Check if item name exists in same category
    const existing = await prisma.menuItem.findFirst({
      where: {
        name: data.name,
        categoryId: data.categoryId,
      },
    });

    if (existing) {
      throw new ApiError(400, 'Menu item with this name already exists in this category');
    }

    const item = await prisma.menuItem.create({
      data: {
        ...data,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        isVegetarian: data.isVegetarian || false,
        isSpicy: data.isSpicy || false,
        allergens: data.allergens || [],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return item;
  }

  async update(id: string, data: UpdateMenuItemData) {
    const existing = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu item not found');
    }

    // Check if category exists (if being changed)
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await prisma.menuCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new ApiError(404, 'Menu category not found');
      }
    }

    // Check name uniqueness if name or category is being changed
    if (data.name || data.categoryId) {
      const nameExists = await prisma.menuItem.findFirst({
        where: {
          name: data.name || existing.name,
          categoryId: data.categoryId || existing.categoryId,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ApiError(400, 'Menu item with this name already exists in this category');
      }
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return item;
  }

  async toggleAvailability(id: string, isAvailable: boolean) {
    const item = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  async delete(id: string) {
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            recipeItems: true,
            variants: true,
            addons: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu item not found');
    }

    // Check if item has order history
    if (existing._count.orderItems > 0) {
      throw new ApiError(
        400,
        'Cannot delete menu item with order history. Mark as unavailable instead.'
      );
    }

    // Delete related records first
    if (existing._count.variants > 0) {
      await prisma.menuVariant.deleteMany({ where: { menuItemId: id } });
    }

    if (existing._count.addons > 0) {
      await prisma.menuAddon.deleteMany({ where: { menuItemId: id } });
    }

    if (existing._count.recipeItems > 0) {
      await prisma.recipeItem.deleteMany({ where: { menuItemId: id } });
    }

    await prisma.menuItem.delete({ where: { id } });

    return { message: 'Menu item deleted successfully' };
  }

  async getVariants(menuItemId: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }

    const variants = await prisma.menuVariant.findMany({
      where: { menuItemId },
      orderBy: { price: 'asc' },
    });

    return variants;
  }

  async getAddons(menuItemId: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }

    const addons = await prisma.menuAddon.findMany({
      where: { menuItemId },
      orderBy: { name: 'asc' },
    });

    return addons;
  }
}
