import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ReportParams {
  restaurantId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export class ReportService {
  private getDateRange(params: ReportParams): DateRange {
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    return { startDate, endDate };
  }

  private buildWhereClause(params: ReportParams) {
    const where: any = {};

    if (params.restaurantId) {
      where.restaurantId = params.restaurantId;
    }

    if (params.branchId) {
      where.branchId = params.branchId;
    }

    return where;
  }

  // ============ SALES REPORTS ============

  async getSalesSummary(params: ReportParams) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const orders = await prisma.order.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: [OrderStatus.CANCELLED],
        },
      },
      include: {
        payments: {
          where: {
            status: PaymentStatus.COMPLETED,
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalTax = orders.reduce((sum, order) => sum + order.taxAmount, 0);
    const totalServiceCharge = orders.reduce((sum, order) => sum + order.serviceCharge, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate by order type
    const ordersByType = orders.reduce((acc, order) => {
      const type = order.orderType;
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0 };
      }
      acc[type].count++;
      acc[type].revenue += order.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Calculate by payment method
    const paymentsByMethod = orders.reduce((acc, order) => {
      order.payments.forEach((payment) => {
        const method = payment.paymentMethod;
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count++;
        acc[method].amount += payment.amount;
      });
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Calculate by status
    const ordersByStatus = orders.reduce((acc, order) => {
      const status = order.status;
      if (!acc[status]) {
        acc[status] = { count: 0, revenue: 0 };
      }
      acc[status].count++;
      acc[status].revenue += order.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalOrders,
        totalRevenue,
        totalTax,
        totalServiceCharge,
        averageOrderValue,
        netRevenue: totalRevenue - totalTax - totalServiceCharge,
      },
      ordersByType,
      paymentsByMethod,
      ordersByStatus,
    };
  }

  async getSalesByDate(params: ReportParams, groupBy: 'day' | 'week' | 'month' = 'day') {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const orders = await prisma.order.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: [OrderStatus.CANCELLED],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const salesByDate = orders.reduce((acc, order) => {
      let dateKey: string;

      if (groupBy === 'day') {
        dateKey = order.createdAt.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(order.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else {
        dateKey = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
      }

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          orders: 0,
          revenue: 0,
          tax: 0,
          serviceCharge: 0,
        };
      }

      acc[dateKey].orders++;
      acc[dateKey].revenue += order.totalAmount;
      acc[dateKey].tax += order.taxAmount;
      acc[dateKey].serviceCharge += order.serviceCharge;

      return acc;
    }, {} as Record<string, any>);

    return {
      period: { startDate, endDate },
      groupBy,
      data: Object.values(salesByDate),
    };
  }

  async getTopSellingItems(params: ReportParams, limit: number = 10) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          ...where,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            notIn: [OrderStatus.CANCELLED],
          },
        },
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by menu item
    const itemStats = orderItems.reduce((acc, item) => {
      const itemId = item.menuItemId;
      if (!acc[itemId]) {
        acc[itemId] = {
          menuItem: item.menuItem,
          quantitySold: 0,
          revenue: 0,
        };
      }
      acc[itemId].quantitySold += item.quantity;
      acc[itemId].revenue += item.totalPrice;
      return acc;
    }, {} as Record<string, any>);

    // Sort by quantity sold and limit
    const topItems = Object.values(itemStats)
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, limit);

    return {
      period: { startDate, endDate },
      items: topItems,
    };
  }

  // ============ INVENTORY REPORTS ============

  async getInventorySummary(params: ReportParams) {
    const where = this.buildWhereClause(params);

    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      expiringSoonItems,
      inventoryValue,
    ] = await Promise.all([
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.count({
        where: {
          ...where,
          currentStock: {
            lte: prisma.inventoryItem.fields.reorderLevel,
          },
        },
      }),
      prisma.inventoryItem.count({
        where: {
          ...where,
          currentStock: 0,
        },
      }),
      prisma.inventoryItem.count({
        where: {
          ...where,
          expiryDate: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            gte: new Date(),
          },
        },
      }),
      prisma.inventoryItem.findMany({
        where,
        select: {
          currentStock: true,
          unitPrice: true,
        },
      }),
    ]);

    const totalValue = inventoryValue.reduce(
      (sum, item) => sum + item.currentStock * item.unitPrice,
      0
    );

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      expiringSoonItems,
      totalValue,
    };
  }

  async getInventoryMovements(params: ReportParams) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        inventoryItem: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by movement type
    const movementsByType = movements.reduce((acc, movement) => {
      const type = movement.movementType;
      if (!acc[type]) {
        acc[type] = { count: 0, quantity: 0 };
      }
      acc[type].count++;
      acc[type].quantity += movement.quantity;
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    return {
      period: { startDate, endDate },
      movements,
      summary: movementsByType,
    };
  }

  async getLowStockReport(params: ReportParams) {
    const where = this.buildWhereClause(params);

    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        ...where,
        currentStock: {
          lte: prisma.inventoryItem.fields.reorderLevel,
        },
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        currentStock: 'asc',
      },
    });

    return {
      items: lowStockItems,
      count: lowStockItems.length,
    };
  }

  async getExpiringItemsReport(params: ReportParams, days: number = 7) {
    const where = this.buildWhereClause(params);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const expiringItems = await prisma.inventoryItem.findMany({
      where: {
        ...where,
        expiryDate: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return {
      items: expiringItems,
      count: expiringItems.length,
      daysAhead: days,
    };
  }

  // ============ CUSTOMER REPORTS ============

  async getCustomerSummary(params: ReportParams) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const [
      totalCustomers,
      newCustomers,
      activeCustomers,
      customersBySegment,
    ] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.count({
        where: {
          ...where,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.customer.count({
        where: {
          ...where,
          orders: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      }),
      prisma.customer.groupBy({
        by: ['segment'],
        where,
        _count: true,
      }),
    ]);

    const segmentStats = customersBySegment.map((item) => ({
      segment: item.segment,
      count: item._count,
    }));

    return {
      period: { startDate, endDate },
      totalCustomers,
      newCustomers,
      activeCustomers,
      segmentStats,
    };
  }

  async getTopCustomers(params: ReportParams, limit: number = 10) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const customers = await prisma.customer.findMany({
      where,
      include: {
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              notIn: [OrderStatus.CANCELLED],
            },
          },
        },
      },
    });

    const customerStats = customers
      .map((customer) => {
        const totalSpent = customer.orders.reduce(
          (sum, order) => sum + order.totalAmount,
          0
        );
        const orderCount = customer.orders.length;

        return {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          segment: customer.segment,
          loyaltyPoints: customer.loyaltyPoints,
          totalSpent,
          orderCount,
          averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        };
      })
      .filter((c) => c.orderCount > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    return {
      period: { startDate, endDate },
      customers: customerStats,
    };
  }

  // ============ REVENUE REPORTS ============

  async getRevenueByBranch(params: ReportParams) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const orders = await prisma.order.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: [OrderStatus.CANCELLED],
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    const revenueByBranch = orders.reduce((acc, order) => {
      const branchId = order.branchId;
      if (!acc[branchId]) {
        acc[branchId] = {
          branch: order.branch,
          orders: 0,
          revenue: 0,
          tax: 0,
          serviceCharge: 0,
        };
      }
      acc[branchId].orders++;
      acc[branchId].revenue += order.totalAmount;
      acc[branchId].tax += order.taxAmount;
      acc[branchId].serviceCharge += order.serviceCharge;
      return acc;
    }, {} as Record<string, any>);

    return {
      period: { startDate, endDate },
      branches: Object.values(revenueByBranch),
    };
  }

  async getRevenueByCategory(params: ReportParams) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          ...where,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            notIn: [OrderStatus.CANCELLED],
          },
        },
      },
      include: {
        menuItem: {
          select: {
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

    const revenueByCategory = orderItems.reduce((acc, item) => {
      const category = item.menuItem.category;
      const categoryId = category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: category.name,
          items: 0,
          revenue: 0,
        };
      }
      acc[categoryId].items += item.quantity;
      acc[categoryId].revenue += item.totalPrice;
      return acc;
    }, {} as Record<string, any>);

    return {
      period: { startDate, endDate },
      categories: Object.values(revenueByCategory).sort(
        (a: any, b: any) => b.revenue - a.revenue
      ),
    };
  }

  // ============ DASHBOARD STATS ============

  async getDashboardStats(params: ReportParams) {
    const { startDate, endDate } = this.getDateRange(params);
    const where = this.buildWhereClause(params);

    const [
      salesSummary,
      inventorySummary,
      customerSummary,
      recentOrders,
      lowStockAlert,
      topSellingItems,
    ] = await Promise.all([
      this.getSalesSummary(params),
      this.getInventorySummary(params),
      this.getCustomerSummary(params),
      prisma.order.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.getLowStockReport(params),
      this.getTopSellingItems(params, 5),
    ]);

    return {
      period: { startDate, endDate },
      sales: salesSummary.summary,
      inventory: inventorySummary,
      customers: customerSummary,
      recentOrders,
      alerts: {
        lowStock: lowStockAlert.count,
      },
      topSellingItems: topSellingItems.items,
    };
  }
}
