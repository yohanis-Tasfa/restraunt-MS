import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateInventoryData {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  cost: number;
  branchId: string;
  expiryDate?: Date;
  batchNumber?: string;
}

interface UpdateInventoryData extends Partial<Omit<CreateInventoryData, 'branchId'>> {}

interface MovementData {
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  reference?: string;
  notes?: string;
  // New fields for automatic expense creation
  costPerUnit?: number;
  totalCost?: number;
  supplier?: string;
  paymentMethod?: string;
  userId?: string;
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  category?: string;
  lowStock?: boolean;
}

export class InventoryService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 50, search, branchId, category, lowStock } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (lowStock) {
      where.quantity = { lte: prisma.inventory.fields.minQuantity };
    }

    const total = await prisma.inventory.count({ where });

    const items = await prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            movements: true,
            recipeItems: true,
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

  async getById(id: string) {
    const item = await prisma.inventory.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        movements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        recipeItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        purchaseItems: {
          include: {
            purchaseOrder: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                supplier: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    return item;
  }

  async create(data: CreateInventoryData) {
    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check if SKU already exists (if provided)
    if (data.sku) {
      const existing = await prisma.inventory.findUnique({
        where: { sku: data.sku },
      });

      if (existing) {
        throw new ApiError(400, 'SKU already exists');
      }
    }

    const item = await prisma.inventory.create({
      data: {
        ...data,
        quantity: data.quantity || 0,
        minQuantity: data.minQuantity || 0,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create initial movement if quantity > 0
    if (data.quantity && data.quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          inventoryId: item.id,
          type: 'IN',
          quantity: data.quantity,
          reference: 'Initial Stock',
          notes: 'Opening balance',
        },
      });
    }

    return item;
  }

  async update(id: string, data: UpdateInventoryData) {
    const existing = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Inventory item not found');
    }

    // Check SKU uniqueness if being changed
    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await prisma.inventory.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        throw new ApiError(400, 'SKU already exists');
      }
    }

    const updateData: any = { ...data };
    if (data.expiryDate) {
      updateData.expiryDate = new Date(data.expiryDate);
    }

    const item = await prisma.inventory.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return item;
  }

  async delete(id: string) {
    const existing = await prisma.inventory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipeItems: true,
            purchaseItems: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Inventory item not found');
    }

    // Check if used in recipes
    if (existing._count.recipeItems > 0) {
      throw new ApiError(
        400,
        'Cannot delete inventory item that is used in recipes. Remove from recipes first.'
      );
    }

    // Delete movements first
    await prisma.inventoryMovement.deleteMany({
      where: { inventoryId: id },
    });

    // Delete purchase order items
    if (existing._count.purchaseItems > 0) {
      await prisma.purchaseOrderItem.deleteMany({
        where: { inventoryId: id },
      });
    }

    await prisma.inventory.delete({ where: { id } });

    return { message: 'Inventory item deleted successfully' };
  }

  async addMovement(data: MovementData) {
    const item = await prisma.inventory.findUnique({
      where: { id: data.inventoryId },
    });

    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    // Calculate new quantity
    let newQuantity = item.quantity;

    if (data.type === 'IN' || data.type === 'ADJUSTMENT') {
      newQuantity += data.quantity;
    } else if (data.type === 'OUT' || data.type === 'WASTE' || data.type === 'TRANSFER') {
      newQuantity -= data.quantity;

      if (newQuantity < 0) {
        throw new ApiError(400, `Insufficient stock. Available: ${item.quantity} ${item.unit}`);
      }
    }

    // Create movement
    const movement = await prisma.inventoryMovement.create({
      data: {
        inventoryId: data.inventoryId,
        type: data.type,
        quantity: data.quantity,
        reference: data.reference,
        notes: data.notes,
      },
    });

    // Update inventory quantity
    await prisma.inventory.update({
      where: { id: data.inventoryId },
      data: { quantity: newQuantity },
    });

    // Auto-create expense for Stock-In with cost information
    let expense = null;
    if (data.type === 'IN' && data.totalCost && data.totalCost > 0 && data.userId) {
      try {
        const expenseDescription = `${item.name} - ${data.quantity} ${item.unit}${data.supplier ? ` from ${data.supplier}` : ''}`;
        const expenseReference = data.paymentMethod || data.reference || 'Stock In';

        expense = await prisma.expense.create({
          data: {
            category: 'Ingredients',
            amount: data.totalCost,
            description: expenseDescription,
            reference: expenseReference,
            userId: data.userId,
            date: new Date(),
            status: 'APPROVED', // Mark as paid immediately
          },
        });
      } catch (error) {
        console.error('Failed to create expense:', error);
        // Don't fail the entire operation if expense creation fails
      }
    }

    return {
      movement,
      newQuantity,
      unit: item.unit,
      expense: expense ? {
        id: expense.id,
        amount: expense.amount,
        category: expense.category,
      } : null,
    };
  }

  async getLowStock(branchId?: string) {
    const where: any = {
      quantity: { lte: prisma.inventory.fields.minQuantity },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    // Use raw query since we can't compare quantity with minQuantity directly
    const items = await prisma.inventory.findMany({
      where: branchId ? { branchId } : {},
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter items where quantity <= minQuantity
    const lowStockItems = items.filter((item) => item.quantity <= item.minQuantity);

    return lowStockItems;
  }

  async getExpiring(branchId?: string, days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: any = {
      expiryDate: {
        gte: today,
        lte: futureDate,
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const items = await prisma.inventory.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return items;
  }

  async getMovements(inventoryId: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const item = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    const total = await prisma.inventoryMovement.count({
      where: { inventoryId },
    });

    const movements = await prisma.inventoryMovement.findMany({
      where: { inventoryId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategories(branchId?: string) {
    const where = branchId ? { branchId } : {};

    const items = await prisma.inventory.findMany({
      where,
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categories = items
      .map((item) => item.category)
      .filter((cat) => cat !== null && cat !== undefined);

    return Array.from(new Set(categories)).sort();
  }

  // Auto-deduct inventory based on order items
  async deductInventoryForOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipeItems: {
                  include: {
                    inventory: true,
                  },
                },
              },
            },
          },
        },
        branch: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const deductions: any[] = [];

    for (const orderItem of order.items) {
      const recipe = orderItem.menuItem.recipeItems;

      if (recipe.length === 0) {
        continue; // No recipe defined
      }

      for (const recipeItem of recipe) {
        const quantityNeeded = recipeItem.quantity * orderItem.quantity;

        // Check if enough stock
        if (recipeItem.inventory.quantity < quantityNeeded) {
          throw new ApiError(
            400,
            `Insufficient stock for ${recipeItem.inventory.name}. ` +
              `Needed: ${quantityNeeded} ${recipeItem.unit}, ` +
              `Available: ${recipeItem.inventory.quantity} ${recipeItem.inventory.unit}`
          );
        }

        // Deduct inventory
        await this.addMovement({
          inventoryId: recipeItem.inventoryId,
          type: 'OUT',
          quantity: quantityNeeded,
          reference: `Order ${order.orderNumber}`,
          notes: `Auto-deducted for ${orderItem.menuItem.name} x${orderItem.quantity}`,
        });

        deductions.push({
          inventoryItem: recipeItem.inventory.name,
          quantity: quantityNeeded,
          unit: recipeItem.unit,
        });
      }
    }

    return {
      orderId,
      orderNumber: order.orderNumber,
      deductions,
    };
  }
}
