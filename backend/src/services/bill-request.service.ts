import prisma from '../config/database';
import { WaiterCallRequestType, WaiterCallStatus } from '@prisma/client';

export interface CreateBillRequestData {
  orderId: string;
  sessionId: string;
  tableId: string;
  waiterId: string;
}

class BillRequestService {
  /**
   * Customer requests bill - creates a waiter call with BILL_REQUEST type
   */
  async createBillRequest(data: CreateBillRequestData) {
    const { orderId, sessionId, tableId, waiterId } = data;

    // Get the order to include in the call data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Create waiter call for bill request
    const billRequest = await prisma.waiterCall.create({
      data: {
        sessionId,
        tableId,
        waiterId,
        requestType: WaiterCallRequestType.BILL_REQUEST,
        status: WaiterCallStatus.PENDING,
        selectedItems: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.menuItem.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
        },
      },
      include: {
        table: true,
        session: true,
      },
    });

    return billRequest;
  }

  /**
   * Get pending bill requests for a waiter
   */
  async getPendingBillRequests(waiterId: string) {
    const requests = await prisma.waiterCall.findMany({
      where: {
        waiterId,
        requestType: WaiterCallRequestType.BILL_REQUEST,
        status: {
          in: [WaiterCallStatus.PENDING, WaiterCallStatus.ACKNOWLEDGED],
        },
      },
      include: {
        table: true,
        session: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  /**
   * Get all pending bill requests (for managers)
   */
  async getAllPendingBillRequests(branchId?: string) {
    const where: any = {
      requestType: WaiterCallRequestType.BILL_REQUEST,
      status: {
        in: [WaiterCallStatus.PENDING, WaiterCallStatus.ACKNOWLEDGED],
      },
    };

    if (branchId) {
      where.table = {
        branchId,
      };
    }

    const requests = await prisma.waiterCall.findMany({
      where,
      include: {
        table: true,
        session: true,
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  /**
   * Waiter acknowledges bill request (on the way)
   */
  async acknowledgeBillRequest(id: string) {
    const billRequest = await prisma.waiterCall.update({
      where: { id },
      data: {
        status: WaiterCallStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      },
      include: {
        table: true,
        session: true,
      },
    });

    return billRequest;
  }

  /**
   * Complete bill request (after payment is collected)
   */
  async completeBillRequest(id: string, notes?: string) {
    const billRequest = await prisma.waiterCall.update({
      where: { id },
      data: {
        status: WaiterCallStatus.COMPLETED,
        completedAt: new Date(),
        notes,
      },
    });

    return billRequest;
  }

  /**
   * Get bill request details by ID
   */
  async getBillRequestById(id: string) {
    const billRequest = await prisma.waiterCall.findUnique({
      where: { id },
      include: {
        table: true,
        session: true,
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return billRequest;
  }
}

export default new BillRequestService();
