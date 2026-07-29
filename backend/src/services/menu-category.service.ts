import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateCategoryData {
  name: string;
  description?: string;
  restaurantId: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface UpdateCategoryData extends Partial<Omit<CreateCategoryData, 'restaurantId'>> {}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export class MenuCategoryService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 50, search, restaurantId, parentId, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (parentId !== undefined) {
      where.parentId = parentId === null ? null : parentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await prisma.menuCategory.count({ where });

    const categories = await prisma.menuCategory.findMany({
      where,
      skip,
      take: limit,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            menuItems: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      data: categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isActive: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
    });

    if (!category) {
      throw new ApiError(404, 'Menu category not found');
    }

    return category;
  }

  async getTree(restaurantId: string) {
    // Get all root categories (no parent)
    const rootCategories = await prisma.menuCategory.findMany({
      where: {
        restaurantId,
        parentId: null,
        isActive: true,
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
            _count: {
              select: { menuItems: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return rootCategories;
  }

  async getCategoryItems(categoryId: string, params: QueryParams = {}) {
    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(404, 'Menu category not found');
    }

    const { page = 1, limit = 20, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = { categoryId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isAvailable = isActive;
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
          },
        },
        _count: {
          select: {
            variants: true,
            addons: true,
          },
        },
      },
      orderBy: { name: 'asc' },
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

  async create(data: CreateCategoryData) {
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    // Check if parent category exists (if provided)
    if (data.parentId) {
      const parent = await prisma.menuCategory.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new ApiError(404, 'Parent category not found');
      }

      // Ensure parent belongs to same restaurant
      if (parent.restaurantId !== data.restaurantId) {
        throw new ApiError(400, 'Parent category must belong to the same restaurant');
      }
    }

    // Check if category name exists in same restaurant
    const existing = await prisma.menuCategory.findFirst({
      where: {
        name: data.name,
        restaurantId: data.restaurantId,
        parentId: data.parentId || null,
      },
    });

    if (existing) {
      throw new ApiError(400, 'Category with this name already exists in this level');
    }

    const category = await prisma.menuCategory.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return category;
  }

  async update(id: string, data: UpdateCategoryData) {
    const existing = await prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu category not found');
    }

    // Check if parent category exists (if being changed)
    if (data.parentId) {
      // Prevent category from being its own parent
      if (data.parentId === id) {
        throw new ApiError(400, 'Category cannot be its own parent');
      }

      const parent = await prisma.menuCategory.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new ApiError(404, 'Parent category not found');
      }

      // Ensure parent belongs to same restaurant
      if (parent.restaurantId !== existing.restaurantId) {
        throw new ApiError(400, 'Parent category must belong to the same restaurant');
      }

      // Prevent circular references (child becoming parent)
      const isDescendant = await this.isDescendantOf(id, data.parentId);
      if (isDescendant) {
        throw new ApiError(400, 'Cannot set a descendant category as parent');
      }
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.menuCategory.findFirst({
        where: {
          name: data.name,
          restaurantId: existing.restaurantId,
          parentId: data.parentId !== undefined ? data.parentId : existing.parentId,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ApiError(400, 'Category with this name already exists in this level');
      }
    }

    const category = await prisma.menuCategory.update({
      where: { id },
      data,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return category;
  }

  async delete(id: string) {
    const existing = await prisma.menuCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            menuItems: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu category not found');
    }

    if (existing._count.children > 0) {
      throw new ApiError(
        400,
        'Cannot delete category with subcategories. Delete subcategories first.'
      );
    }

    if (existing._count.menuItems > 0) {
      throw new ApiError(
        400,
        'Cannot delete category with menu items. Reassign or delete items first.'
      );
    }

    await prisma.menuCategory.delete({ where: { id } });

    return { message: 'Menu category deleted successfully' };
  }

  // Helper method to check if a category is descendant of another
  private async isDescendantOf(categoryId: string, potentialAncestorId: string): Promise<boolean> {
    const category = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: { children: true },
    });

    if (!category) return false;

    for (const child of category.children) {
      if (child.id === potentialAncestorId) {
        return true;
      }
      const isDescendant = await this.isDescendantOf(child.id, potentialAncestorId);
      if (isDescendant) {
        return true;
      }
    }

    return false;
  }
}
