import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';
import { CreatePaymentData, RefundPaymentData, PaymentQueryParams } from '../types/payment.types';
import { websocketService } from './websocket.service';

export class PaymentService {
  async getAll(params: PaymentQueryParams = {}) {
    const { page = 1, limit = 20, orderId, method, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (method) {
      where.method = method;
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

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            type: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
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
            items: {
              include: {
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
      },
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    return payment;
  }

  private async resolveWaiterId(userId?: string, order?: any): Promise<string | null> {
    // 1. If userId belongs to a waiter, attribute tip directly to that waiter
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      if (user?.role?.name === 'Waiter') {
        return user.id;
      }
    }

    // 2. If table has an assigned waiter, attribute to table's waiter
    if (order?.table?.assignedWaiterId) {
      return order.table.assignedWaiterId;
    }

    // 3. If order creator was a waiter, attribute to order creator
    if (order?.createdById) {
      const creator = await prisma.user.findUnique({
        where: { id: order.createdById },
        include: { role: true },
      });
      if (creator?.role?.name === 'Waiter') {
        return creator.id;
      }
    }

    // 4. Fallback to userId if available, otherwise order.createdById
    return userId || order?.createdById || null;
  }

  async create(data: CreatePaymentData, recordedById?: string) {
    // Validate order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        payments: true,
        table: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new ApiError(400, 'Cannot process payment for cancelled order');
    }

    // Calculate total paid so far
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = order.total - totalPaid;

    // Validate payment amount
    if (data.amount <= 0) {
      throw new ApiError(400, 'Payment amount must be greater than 0');
    }

    // Allow overpayment for tips - payment can be more than remaining balance
    // Only validate it's not unreasonably high
    if (data.amount > order.total * 3) {
      throw new ApiError(
        400,
        `Payment amount (${data.amount} ETB) seems unreasonably high`
      );
    }

    // Calculate tip if paying more than remaining balance
    let tipAmount = 0;
    if (data.amount > remaining) {
      tipAmount = Math.round((data.amount - remaining) * 100) / 100;
    }

    // Amount applied to the order balance
    const paymentAmountTowardOrder = Math.min(data.amount, remaining);

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        proofImageUrl: data.proofImageUrl,
        transactionRef: data.transactionRef,
        notes: tipAmount > 0
          ? `${data.notes || ''}\nTotal received: ${data.amount} ETB (includes ${tipAmount.toFixed(2)} ETB tip)`.trim()
          : data.notes,
        status: 'completed',
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            table: true,
            createdById: true,
          },
        },
      },
    });

    // Update order payment status
    const newTotalPaid = totalPaid + paymentAmountTowardOrder;
    const paymentStatus = newTotalPaid >= order.total ? 'PAID' : 'UNPAID';

    await prisma.order.update({
      where: { id: data.orderId },
      data: { paymentStatus },
    });

    // Create Tip record if there is an overpayment (tip)
    if (tipAmount > 0) {
      const waiterId = await this.resolveWaiterId(recordedById, order);

      if (waiterId) {
        const tipRecord = await prisma.tip.create({
          data: {
            orderId: data.orderId,
            paymentId: payment.id,
            waiterId,
            amount: tipAmount,
            method: data.method,
            status: data.method === 'CASH' ? 'PAID' : 'PENDING',
            notes: `Tip from ${data.method} payment (${data.amount} ETB for ${order.total} ETB bill)`,
          },
          include: {
            waiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                branchId: true,
                branch: {
                  select: {
                    id: true,
                    restaurantId: true,
                  },
                },
              },
            },
          },
        });

        // Emit WebSocket notification to waiter
        if (tipRecord.waiter?.branchId && tipRecord.waiter.branch?.restaurantId) {
          websocketService.emitTipReceived(
            tipRecord,
            waiterId,
            tipRecord.waiter.branchId,
            tipRecord.waiter.branch.restaurantId
          );
        }
      }
    }

    return payment;
  }

  /**
   * Collect payment from customer - used by waiters
   * Handles cash and transfer with photo upload
   * Returns change amount for cash payments
   */
  async collectPayment(data: CreatePaymentData & { amountReceived?: number }, collectedById?: string) {
    // Validate order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        payments: true,
        table: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new ApiError(400, 'Cannot process payment for cancelled order');
    }

    // Calculate total paid so far
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = order.total - totalPaid;

    // Validate payment amount
    if (data.amount <= 0) {
      throw new ApiError(400, 'Payment amount must be greater than 0');
    }

    // Allow overpayment for tips - payment can be more than remaining balance
    // Only validate it's not unreasonably high (e.g., more than 3x the order total)
    if (data.amount > order.total * 3) {
      throw new ApiError(
        400,
        `Payment amount (${data.amount} ETB) seems unreasonably high`
      );
    }

    // For CASH, calculate change
    let change = 0;
    let tipAmount = 0;
    if (data.method === 'CASH' && data.amountReceived) {
      if (data.amountReceived < data.amount) {
        throw new ApiError(400, 'Amount received is less than payment amount');
      }
      change = data.amountReceived - data.amount;
    }

    // Calculate tip if paying more than remaining balance
    if (data.amount > remaining) {
      tipAmount = data.amount - remaining;
    }

    // For TRANSFER, require proof image
    if ((data.method === 'BANK_TRANSFER' || data.method === 'MOBILE' || data.method === 'TELEBIRR' || data.method === 'CBE_BIRR') && !data.proofImageUrl) {
      throw new ApiError(400, 'Transfer proof image is required for digital payments');
    }

    // Actual payment amount toward order (excluding tip)
    const paymentAmountTowardOrder = Math.min(data.amount, remaining);

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: paymentAmountTowardOrder, // Only the amount applied to the order
        method: data.method,
        reference: data.reference,
        proofImageUrl: data.proofImageUrl,
        transactionRef: data.transactionRef,
        notes: tipAmount > 0 
          ? `${data.notes || ''}\nTotal received: ${data.amount} ETB (includes ${tipAmount.toFixed(2)} ETB tip)`.trim()
          : data.notes,
        status: 'completed',
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            table: true,
            createdById: true, // Get waiter ID
          },
        },
      },
    });

    // Create Tip record if there's an overpayment
    let tipRecord = null;
    if (tipAmount > 0) {
      const waiterId = await this.resolveWaiterId(collectedById, order);

      if (waiterId) {
        tipRecord = await prisma.tip.create({
          data: {
            orderId: data.orderId,
            paymentId: payment.id,
            waiterId,
            amount: tipAmount,
            method: data.method,
            status: data.method === 'CASH' ? 'PAID' : 'PENDING',
            notes: `Tip from ${data.method} payment - pending payout`,
          },
          include: {
            waiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                branchId: true,
                branch: {
                  select: {
                    id: true,
                    restaurantId: true,
                  },
                },
              },
            },
          },
        });

        // Emit WebSocket notification to waiter
        if (tipRecord.waiter?.branchId && tipRecord.waiter.branch?.restaurantId) {
          websocketService.emitTipReceived(
            tipRecord,
            waiterId,
            tipRecord.waiter.branchId,
            tipRecord.waiter.branch.restaurantId
          );
        }
      }
    }

    // Update order payment status
    const newTotalPaid = totalPaid + paymentAmountTowardOrder; // Only count payment toward order, not tip
    let paymentStatus: 'UNPAID' | 'PAID' = newTotalPaid >= order.total ? 'PAID' : 'UNPAID';

    if (paymentStatus === 'PAID') {
      // Mark order as completed and paid
      await prisma.order.update({
        where: { id: data.orderId },
        data: { 
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Free up the table
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    } else {
      // Still unpaid (partial payments not tracked)
      await prisma.order.update({
        where: { id: data.orderId },
        data: { paymentStatus: 'UNPAID' },
      });
    }

    return {
      payment,
      change,
      tip: tipAmount,
      tipId: tipRecord?.id,
      remaining: Math.max(0, remaining - paymentAmountTowardOrder), // Remaining after payment (not tip)
      totalPaid: newTotalPaid,
      isFullyPaid: paymentStatus === 'PAID',
    };
  }

  async refund(id: string, data: RefundPaymentData) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    if (payment.status === 'refunded') {
      throw new ApiError(400, 'Payment is already refunded');
    }

    const refundAmount = data.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new ApiError(400, 'Refund amount cannot exceed original payment amount');
    }

    // Update payment status
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: refundAmount === payment.amount ? 'refunded' : 'completed',
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        notes: `${payment.order.notes || ''}\nRefund reason: ${data.reason}`,
      },
    });

    // Free up table if applicable
    if (payment.order.tableId) {
      await prisma.table.update({
        where: { id: payment.order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return {
      ...updated,
      refundAmount,
      refundReason: data.reason,
    };
  }

  async getSummary(branchId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (branchId) {
      where.order = { branchId };
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

    const [totalPayments, paymentsByMethod, recentPayments] = await Promise.all([
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.findMany({
        where,
        take: 10,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalAmount: totalPayments._sum.amount || 0,
      totalCount: totalPayments._count,
      byMethod: paymentsByMethod.map((stat) => ({
        method: stat.method,
        count: stat._count,
        total: stat._sum.amount || 0,
      })),
      recentPayments,
    };
  }
}
