import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreatePurchaseOrderData {
  supplierId: string;
  items: PurchaseOrderItemInput[];
  notes?: string;
  expectedDate?: Date;
}

interface PurchaseOrderItemInput {
  inventoryId: string;
  quantity: number;
  price: number;
}

interface UpdatePurchaseOrderData {
  notes?: string;
  expectedDate?: Date;
}

interface QueryParams {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export class PurchaseOrderService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 20, supplierId, status, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
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

    const total = await prisma.purchaseOrder.count({ where });

    const orders = await prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
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
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contactPerson: true,
          },
        },
        items: {
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Purchase order not found');
    }

    return order;
  }

  async create(data: CreatePurchaseOrderData) {
    // Validate supplier
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    // Validate inventory items
    const inventoryIds = data.items.map((item) => item.inventoryId);
    const inventoryItems = await prisma.inventory.findMany({
      where: { id: { in: inventoryIds } },
    });

    if (inventoryItems.length !== inventoryIds.length) {
      throw new ApiError(400, 'One or more inventory items not found');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of data.items) {
      const inventory = inventoryItems.find((inv) => inv.id === item.inventoryId);
      if (!inventory) continue;

      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal,
        receivedQty: 0,
      });
    }

    const tax = 0; // You can add tax calculation here
    const total = subtotal + tax;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create purchase order
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        status: 'DRAFT',
        subtotal,
        tax,
        total,
        notes: data.notes,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        items: {
          create: orderItems,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  async update(id: string, data: UpdatePurchaseOrderData) {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Purchase order not found');
    }

    // Can't edit received/cancelled orders
    if (['RECEIVED', 'CANCELLED'].includes(existing.status)) {
      throw new ApiError(400, `Cannot edit ${existing.status.toLowerCase()} purchase orders`);
    }

    const updateData: any = { ...data };
    if (data.expectedDate) {
      updateData.expectedDate = new Date(data.expectedDate);
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  async updateStatus(id: string, status: string) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, 'Purchase order not found');
    }

    const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updateData: any = { status };

    if (status === 'RECEIVED') {
      updateData.receivedDate = new Date();
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  async receiveGoods(id: string, receivedItems: { itemId: string; receivedQty: number }[]) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (order.status !== 'APPROVED') {
      throw new ApiError(400, 'Purchase order must be approved before receiving goods');
    }

    // Update received quantities and add inventory
    for (const receivedItem of receivedItems) {
      const orderItem = order.items.find((item) => item.id === receivedItem.itemId);

      if (!orderItem) {
        throw new ApiError(404, `Purchase order item ${receivedItem.itemId} not found`);
      }

      // Update received quantity
      await prisma.purchaseOrderItem.update({
        where: { id: receivedItem.itemId },
        data: {
          receivedQty: receivedItem.receivedQty,
        },
      });

      // Add to inventory
      await prisma.inventory.update({
        where: { id: orderItem.inventoryId },
        data: {
          quantity: {
            increment: receivedItem.receivedQty,
          },
        },
      });

      // Create inventory movement
      await prisma.inventoryMovement.create({
        data: {
          inventoryId: orderItem.inventoryId,
          type: 'IN',
          quantity: receivedItem.receivedQty,
          reference: `PO ${order.orderNumber}`,
          notes: `Received from ${order.supplier?.name || 'supplier'}`,
        },
      });
    }

    // Update order status to RECEIVED
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        receivedDate: new Date(),
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async cancel(id: string, reason?: string) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (order.status === 'RECEIVED') {
      throw new ApiError(400, 'Cannot cancel received purchase orders');
    }

    if (order.status === 'CANCELLED') {
      throw new ApiError(400, 'Purchase order is already cancelled');
    }

    const cancelled = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}` : order.notes,
      },
    });

    return cancelled;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    // Count orders today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const count = await prisma.purchaseOrder.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `PO-${dateStr}-${sequence}`;
  }
}
