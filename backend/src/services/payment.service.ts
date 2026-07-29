import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';
import { CreatePaymentData, RefundPaymentData, PaymentQueryParams } from '../types/payment.types';

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

  async create(data: CreatePaymentData) {
    // Validate order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        payments: true,
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

    if (data.amount > remaining) {
      throw new ApiError(
        400,
        `Payment amount (${data.amount} ETB) exceeds remaining balance (${remaining} ETB)`
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        status: 'completed',
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
      },
    });

    // Update order payment status
    const newTotalPaid = totalPaid + data.amount;
    let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'PARTIAL';

    if (newTotalPaid >= order.total) {
      paymentStatus = 'PAID';
    } else if (newTotalPaid > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'UNPAID';
    }

    await prisma.order.update({
      where: { id: data.orderId },
      data: { paymentStatus },
    });

    return payment;
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
