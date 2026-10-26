import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';
import { TipQueryParams, TipStatus, MarkTipPaidData } from '../types/tip.types';
import { websocketService } from './websocket.service';

export class TipService {
  async getAll(params: TipQueryParams = {}) {
    const {
      page = 1,
      limit = 20,
      waiterId,
      status,
      method,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (waiterId) {
      where.waiterId = waiterId;
    }

    if (status) {
      where.status = status;
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

    const total = await prisma.tip.count({ where });

    const tips = await prisma.tip.findMany({
      where,
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            table: {
              select: {
                id: true,
                number: true,
              },
            },
          },
        },
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        paidBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: tips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const tip = await prisma.tip.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            table: {
              select: {
                id: true,
                number: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            proofImageUrl: true,
            transactionRef: true,
          },
        },
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        paidBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!tip) {
      throw new ApiError(404, 'Tip not found');
    }

    return tip;
  }

  async getMyTips(waiterId: string, params: TipQueryParams = {}) {
    return this.getAll({
      ...params,
      waiterId,
    });
  }

  async getTipSummary(waiterId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (waiterId) {
      where.waiterId = waiterId;
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

    const [totalStats, pendingStats, paidStats, byMethod] = await Promise.all([
      prisma.tip.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.tip.aggregate({
        where: { ...where, status: TipStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.tip.aggregate({
        where: { ...where, status: TipStatus.PAID },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.tip.groupBy({
        by: ['method'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: {
        amount: totalStats._sum.amount || 0,
        count: totalStats._count,
      },
      pending: {
        amount: pendingStats._sum.amount || 0,
        count: pendingStats._count,
      },
      paid: {
        amount: paidStats._sum.amount || 0,
        count: paidStats._count,
      },
      byMethod: byMethod.map((stat) => ({
        method: stat.method,
        count: stat._count,
        total: stat._sum.amount || 0,
      })),
    };
  }

  async markAsPaid(id: string, paidById: string, data: MarkTipPaidData = {}) {
    const tip = await prisma.tip.findUnique({
      where: { id },
    });

    if (!tip) {
      throw new ApiError(404, 'Tip not found');
    }

    if (tip.status === TipStatus.PAID) {
      throw new ApiError(400, 'Tip is already marked as paid');
    }

    const updated = await prisma.tip.update({
      where: { id },
      data: {
        status: TipStatus.PAID,
        paidAt: new Date(),
        paidById,
        notes: data.notes
          ? `${tip.notes || ''}\n${data.notes}`.trim()
          : tip.notes,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            table: {
              select: {
                number: true,
              },
            },
          },
        },
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
        paidBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Emit WebSocket notification to waiter
    if (updated.waiter.branchId && updated.waiter.branch?.restaurantId) {
      websocketService.emitTipPaid(
        updated,
        tip.waiterId,
        updated.waiter.branchId,
        updated.waiter.branch.restaurantId
      );
    }

    return updated;
  }

  async getPendingPayoutAmount(waiterId?: string) {
    const where: any = {
      status: TipStatus.PENDING,
    };

    if (waiterId) {
      where.waiterId = waiterId;
    }

    const result = await prisma.tip.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      amount: result._sum.amount || 0,
      count: result._count,
    };
  }
}
