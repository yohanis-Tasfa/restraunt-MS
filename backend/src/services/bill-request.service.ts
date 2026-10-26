import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';
import { websocketService } from './websocket.service';
import {
  CreateBillRequestData,
  UpdateBillRequestData,
  BillRequestQueryParams,
  BillRequestStatus,
  ProcessBillRequestData,
} from '../types/bill-request.types';

export class BillRequestService {
  async getAll(params: BillRequestQueryParams = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      requestedById,
      processedById,
      branchId,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * limit;

    console.log('BillRequestService.getAll called with:', params);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (requestedById) {
      where.requestedById = requestedById;
    }

    if (processedById) {
      where.processedById = processedById;
    }

    // Filter by branch - need to check if order's branchId matches
    if (branchId) {
      where.order = {
        ...where.order,
        branchId: branchId,
      };
    }

    if (startDate || endDate) {
      where.requestedAt = {};
      if (startDate) {
        where.requestedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.requestedAt.lte = new Date(endDate);
      }
    }

    console.log('Prisma where clause:', JSON.stringify(where, null, 2));

    const total = await prisma.billRequest.count({ where });
    console.log('Total bill requests found:', total);

    const billRequests = await prisma.billRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            status: true,
            total: true,
            branchId: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                subtotal: true,
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    console.log('Bill requests fetched from DB:', billRequests.length);

    const result = {
      data: billRequests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    console.log('Returning result:', {
      dataLength: result.data.length,
      pagination: result.pagination,
    });

    return result;
  }

  async getById(id: string) {
    const billRequest = await prisma.billRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    image: true,
                  },
                },
              },
            },
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
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            payments: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        processedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    if (!billRequest) {
      throw new ApiError(404, 'Bill request not found');
    }

    return billRequest;
  }

  async create(data: CreateBillRequestData, userId: string) {
    // Validate order exists and is served/completed
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        table: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Check if order is in a state where bill can be requested
    if (!['SERVED', 'COMPLETED'].includes(order.status)) {
      throw new ApiError(
        400,
        'Bill can only be requested for served or completed orders'
      );
    }

    // Check if there's already a pending bill request for this order
    const existingRequest = await prisma.billRequest.findFirst({
      where: {
        orderId: data.orderId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (existingRequest) {
      throw new ApiError(400, 'A bill request already exists for this order');
    }

    // Calculate priority based on how long the order has been served
    const now = new Date();
    const orderTime = new Date(order.updatedAt);
    const minutesWaiting = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60)
    );
    const priority = Math.min(minutesWaiting, 100); // Cap at 100

    const billRequest = await prisma.billRequest.create({
      data: {
        orderId: data.orderId,
        tableId: data.tableId || order.tableId,
        requestedById: userId,
        status: BillRequestStatus.PENDING,
        priority,
        notes: data.notes,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            branch: {
              select: {
                id: true,
                restaurantId: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket event
    if (billRequest.order?.branch) {
      websocketService.emitBillRequestCreated(
        billRequest,
        billRequest.order.branch.id,
        billRequest.order.branch.restaurantId
      );
    }

    return billRequest;
  }

  async update(id: string, data: UpdateBillRequestData) {
    const existing = await prisma.billRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Bill request not found');
    }

    if (existing.status === BillRequestStatus.COMPLETED) {
      throw new ApiError(400, 'Cannot update completed bill request');
    }

    const updated = await prisma.billRequest.update({
      where: { id },
      data,
      include: {
        order: true,
        table: true,
        requestedBy: true,
        processedBy: true,
      },
    });

    return updated;
  }

  async process(id: string, userId: string, data: ProcessBillRequestData = {}) {
    const billRequest = await prisma.billRequest.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!billRequest) {
      throw new ApiError(404, 'Bill request not found');
    }

    if (billRequest.status !== BillRequestStatus.PENDING) {
      throw new ApiError(
        400,
        `Bill request is already ${billRequest.status.toLowerCase()}`
      );
    }

    // Update bill request to processing
    const updated = await prisma.billRequest.update({
      where: { id },
      data: {
        status: BillRequestStatus.PROCESSING,
        processedById: userId,
        processedAt: new Date(),
        notes: data.notes
          ? `${billRequest.notes || ''}\n${data.notes}`.trim()
          : billRequest.notes,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
            branch: {
              include: {
                restaurant: true,
              },
            },
          },
        },
        table: true,
        requestedBy: true,
        processedBy: true,
      },
    });

    // Emit WebSocket event
    if (updated.order?.branch) {
      websocketService.emitBillRequestProcessed(
        updated,
        updated.order.branch.id,
        updated.order.branch.restaurantId
      );
    }

    return updated;
  }

  async complete(id: string, billId?: string) {
    const billRequest = await prisma.billRequest.findUnique({
      where: { id },
    });

    if (!billRequest) {
      throw new ApiError(404, 'Bill request not found');
    }

    if (billRequest.status === BillRequestStatus.COMPLETED) {
      throw new ApiError(400, 'Bill request is already completed');
    }

    const updated = await prisma.billRequest.update({
      where: { id },
      data: {
        status: BillRequestStatus.COMPLETED,
        billId,
      },
      include: {
        order: {
          include: {
            branch: {
              select: {
                id: true,
                restaurantId: true,
              },
            },
          },
        },
        table: true,
        requestedBy: true,
        processedBy: true,
      },
    });

    // Emit WebSocket event
    if (updated.order?.branch) {
      websocketService.emitBillRequestCompleted(
        updated,
        updated.order.branch.id,
        updated.order.branch.restaurantId
      );
    }

    return updated;
  }

  async cancel(id: string, reason?: string) {
    const billRequest = await prisma.billRequest.findUnique({
      where: { id },
    });

    if (!billRequest) {
      throw new ApiError(404, 'Bill request not found');
    }

    if (billRequest.status === BillRequestStatus.COMPLETED) {
      throw new ApiError(400, 'Cannot cancel completed bill request');
    }

    const updated = await prisma.billRequest.update({
      where: { id },
      data: {
        status: BillRequestStatus.CANCELLED,
        notes: reason
          ? `${billRequest.notes || ''}\nCancellation reason: ${reason}`.trim()
          : billRequest.notes,
      },
      include: {
        order: {
          include: {
            branch: {
              select: {
                id: true,
                restaurantId: true,
              },
            },
          },
        },
        table: true,
        requestedBy: true,
        processedBy: true,
      },
    });

    // Emit WebSocket event
    if (updated.order?.branch) {
      websocketService.emitBillRequestCancelled(
        updated,
        updated.order.branch.id,
        updated.order.branch.restaurantId
      );
    }

    return updated;
  }

  async getPendingCount(userId?: string) {
    const where: any = {
      status: { in: [BillRequestStatus.PENDING, BillRequestStatus.PROCESSING] },
    };

    if (userId) {
      where.requestedById = userId;
    }

    const count = await prisma.billRequest.count({ where });
    return count;
  }
}
