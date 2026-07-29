import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateAddonData {
  name: string;
  price: number;
  menuItemId: string;
  isActive?: boolean;
}

interface UpdateAddonData extends Partial<Omit<CreateAddonData, 'menuItemId'>> {}

export class MenuAddonService {
  async getAll(menuItemId?: string) {
    const where = menuItemId ? { menuItemId } : {};

    const addons = await prisma.menuAddon.findMany({
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
      orderBy: { name: 'asc' },
    });

    return addons;
  }

  async getById(id: string) {
    const addon = await prisma.menuAddon.findUnique({
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

    if (!addon) {
      throw new ApiError(404, 'Menu addon not found');
    }

    return addon;
  }

  async create(data: CreateAddonData) {
    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: data.menuItemId },
    });

    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    // Check if addon name already exists for this menu item
    const existing = await prisma.menuAddon.findFirst({
      where: {
        name: data.name,
        menuItemId: data.menuItemId,
      },
    });

    if (existing) {
      throw new ApiError(400, 'Addon with this name already exists for this menu item');
    }

    const addon = await prisma.menuAddon.create({
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

    return addon;
  }

  async update(id: string, data: UpdateAddonData) {
    const existing = await prisma.menuAddon.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu addon not found');
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.menuAddon.findFirst({
        where: {
          name: data.name,
          menuItemId: existing.menuItemId,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ApiError(400, 'Addon with this name already exists for this menu item');
      }
    }

    const addon = await prisma.menuAddon.update({
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

    return addon;
  }

  async delete(id: string) {
    const existing = await prisma.menuAddon.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Menu addon not found');
    }

    await prisma.menuAddon.delete({ where: { id } });

    return { message: 'Menu addon deleted successfully' };
  }
}
