import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateVariantData {
  name: string;
  price: number;
  menuItemId: string;
  isActive?: boolean;
}

interface UpdateVariantData extends Partial<Omit<CreateVariantData, 'menuItemId'>> {}

export class MenuVariantService {
  async getAll(menuItemId?: string) {
    const where = menuItemId ? { menuItemId } : {};

    const variants = await prisma.menuVariant.findMany({
      where,
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    return variants;
  }

  async getById(id: string) {
    const variant = await prisma.menuVariant.findUnique({
      where: { id },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!variant) {
      throw new ApiError(404, 'Menu variant not found');
    }

    return variant;
  }

  async create(data: CreateVariantData) {
    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: data.menuItemId },
    });

    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    // Check if variant name already exists for this menu item
    const existing = await prisma.menuVariant.findFirst({
      where: {
        name: data.name,
        menuItemId: data.menuItemId,
      },
    });

    if (existing) {
      throw new ApiError(400, 'Variant with this name already exists for this menu item');
    }

    const variant = await prisma.menuVariant.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return variant;
  }

  async update(id: string, data: UpdateVariantData) {
    const existing = await prisma.menuVariant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu variant not found');
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.menuVariant.findFirst({
        where: {
          name: data.name,
          menuItemId: existing.menuItemId,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ApiError(400, 'Variant with this name already exists for this menu item');
      }
    }

    const variant = await prisma.menuVariant.update({
      where: { id },
      data,
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return variant;
  }

  async delete(id: string) {
    const existing = await prisma.menuVariant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu variant not found');
    }

    await prisma.menuVariant.delete({ where: { id } });

    return { message: 'Menu variant deleted successfully' };
  }
}
