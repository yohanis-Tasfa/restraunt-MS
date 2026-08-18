import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';
import {
  CreateOrderData,
  UpdateOrderData,
  OrderCalculation,
  OrderQueryParams,
  OrderItemInput,
} from '../types/order.types';

export class OrderService {
  async getAll(params: OrderQueryParams = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      branchId,
      status,
      type,
      customerId,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.orderNumber = { contains: search, mode: 'insensitive' };
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            subtotal: true,
            notes: true,
            menuItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 3, // Only get first 3 items for performance
        },
        _count: {
          select: {
            items: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                logo: true,
                phone: true,
                address: true,
                taxRate: true,
                vatRate: true,
                serviceCharge: true,
                currency: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    return order;
  }

  async create(data: CreateOrderData, userId: string) {
    // Validate branch
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
      include: {
        restaurant: {
          select: {
            taxRate: true,
            vatRate: true,
            serviceCharge: true,
          },
        },
      },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Validate table if provided
    if (data.tableId) {
      const table = await prisma.table.findUnique({
        where: { id: data.tableId },
      });

      if (!table) {
        throw new ApiError(404, 'Table not found');
      }

      if (table.branchId !== data.branchId) {
        throw new ApiError(400, 'Table does not belong to this branch');
      }
    }

    // Validate customer if provided
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new ApiError(404, 'Customer not found');
      }
    }

    // Validate menu items and get prices
    const menuItemIds = data.items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new ApiError(400, 'One or more menu items not found');
    }

    // Check if items are available
    const unavailableItems = menuItems.filter((item) => !item.isAvailable);
    if (unavailableItems.length > 0) {
      throw new ApiError(
        400,
        `The following items are not available: ${unavailableItems.map((i) => i.name).join(', ')}`
      );
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of data.items) {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) continue;

      const price = item.price || menuItem.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
        notes: item.notes,
        status: 'PENDING',
      });
    }

    const tax = subtotal * (branch.restaurant.taxRate / 100);
    const vat = subtotal * (branch.restaurant.vatRate / 100);
    const serviceCharge = subtotal * (branch.restaurant.serviceCharge / 100);
    const discount = data.discount || 0;
    const total = subtotal + tax + vat + serviceCharge - discount;

    // Generate unique order number
    const orderNumber = await this.generateOrderNumber(data.branchId);

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        type: data.type,
        status: 'PENDING',
        branchId: data.branchId,
        tableId: data.tableId,
        customerId: data.customerId,
        createdById: userId,
        subtotal,
        tax,
        vat,
        serviceCharge,
        discount,
        total,
        notes: data.notes,
        specialInstructions: data.specialInstructions,
        paymentStatus: 'UNPAID',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    // Update table status if table order
    if (data.tableId) {
      await prisma.table.update({
        where: { id: data.tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    return order;
  }

  async update(id: string, data: UpdateOrderData) {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { branch: { include: { restaurant: true } } },
    });

    if (!existing) {
      throw new ApiError(404, 'Order not found');
    }

    // Can't edit completed/cancelled orders
    if (['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(existing.status)) {
      throw new ApiError(400, `Cannot edit ${existing.status.toLowerCase()} orders`);
    }

    // Recalculate if discount changed
    let updateData: any = { ...data };

    if (data.discount !== undefined && data.discount !== existing.discount) {
      const total =
        existing.subtotal +
        existing.tax +
        existing.vat +
        existing.serviceCharge -
        data.discount;
      updateData.total = total;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return order;
  }

  async updateStatus(id: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'SERVED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      
      // Free up table if it's a table order
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async addItems(orderId: string, items: OrderItemInput[]) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { branch: { include: { restaurant: true } } },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new ApiError(400, `Cannot add items to ${order.status.toLowerCase()} orders`);
    }

    // Validate menu items
    const menuItemIds = items.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new ApiError(400, 'One or more menu items not found or unavailable');
    }

    // Calculate new items cost
    let additionalSubtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) continue;

      const price = item.price || menuItem.price;
      const itemSubtotal = price * item.quantity;
      additionalSubtotal += itemSubtotal;

      orderItems.push({
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price,
        subtotal: itemSubtotal,
        notes: item.notes,
        status: 'PENDING',
      });
    }

    // Recalculate order totals
    const newSubtotal = order.subtotal + additionalSubtotal;
    const tax = newSubtotal * (order.branch.restaurant.taxRate / 100);
    const vat = newSubtotal * (order.branch.restaurant.vatRate / 100);
    const serviceCharge = newSubtotal * (order.branch.restaurant.serviceCharge / 100);
    const total = newSubtotal + tax + vat + serviceCharge - order.discount;

    // Add items and update order
    await prisma.orderItem.createMany({
      data: orderItems,
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        tax,
        vat,
        serviceCharge,
        total,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return updated;
  }

  async removeItem(orderId: string, itemId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { branch: { include: { restaurant: true } }, items: true },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new ApiError(400, `Cannot remove items from ${order.status.toLowerCase()} orders`);
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new ApiError(404, 'Order item not found');
    }

    // Delete the item
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Recalculate order totals
    const newSubtotal = order.subtotal - item.subtotal;
    const tax = newSubtotal * (order.branch.restaurant.taxRate / 100);
    const vat = newSubtotal * (order.branch.restaurant.vatRate / 100);
    const serviceCharge = newSubtotal * (order.branch.restaurant.serviceCharge / 100);
    const total = newSubtotal + tax + vat + serviceCharge - order.discount;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        tax,
        vat,
        serviceCharge,
        total,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return updated;
  }

  async cancel(id: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status === 'COMPLETED') {
      throw new ApiError(400, 'Cannot cancel completed orders. Process a refund instead.');
    }

    if (order.status === 'CANCELLED') {
      throw new ApiError(400, 'Order is already cancelled');
    }

    // Cancel order
    const cancelled = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}` : order.notes,
      },
    });

    // Free up table if applicable
    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return cancelled;
  }

  async getDailyStats(branchId?: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const where: any = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { not: 'CANCELLED' },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const [totalOrders, totalRevenue, paymentStats] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      date: targetDate.toISOString().split('T')[0],
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      paymentMethods: paymentStats.map((stat) => ({
        method: stat.method,
        count: stat._count,
        total: stat._sum.amount || 0,
      })),
    };
  }

  private async generateOrderNumber(branchId: string): Promise<string> {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    // Count orders today for this branch
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const count = await prisma.order.count({
      where: {
        branchId,
        createdAt: { gte: startOfDay },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${branch?.code || 'ORD'}-${dateStr}-${sequence}`;
  }
}
