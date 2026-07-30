import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  restaurantId: string;
  birthday?: Date;
  notes?: string;
}

interface UpdateCustomerData extends Partial<Omit<CreateCustomerData, 'restaurantId'>> {}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  city?: string;
  hasOrders?: boolean;
}

interface LoyaltyPointsData {
  points: number;
  reason: string;
}

export class CustomerService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 50, search, restaurantId, city, hasOrders } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (hasOrders) {
      where.totalOrders = { gt: 0 };
    }

    const total = await prisma.customer.count({ where });

    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add customer segment
    const customersWithSegment = customers.map((customer) => ({
      ...customer,
      segment: this.getCustomerSegment(customer.totalOrders, customer.totalSpent),
    }));

    return {
      data: customersWithSegment,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            total: true,
            status: true,
            createdAt: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reservations: {
          select: {
            id: true,
            reservationDate: true,
            guests: true,
            status: true,
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
          orderBy: { reservationDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Add customer segment
    const customerWithSegment = {
      ...customer,
      segment: this.getCustomerSegment(customer.totalOrders, customer.totalSpent),
      lastVisit: customer.orders[0]?.createdAt || null,
    };

    return customerWithSegment;
  }

  async create(data: CreateCustomerData) {
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new ApiError(404, 'Restaurant not found');
    }

    // Check if customer with email or phone already exists
    if (data.email || data.phone) {
      const existing = await prisma.customer.findFirst({
        where: {
          restaurantId: data.restaurantId,
          OR: [
            data.email ? { email: data.email } : {},
            data.phone ? { phone: data.phone } : {},
          ].filter((obj) => Object.keys(obj).length > 0),
        },
      });

      if (existing) {
        throw new ApiError(
          400,
          'Customer with this email or phone already exists in this restaurant'
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        ...data,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return customer;
  }

  async update(id: string, data: UpdateCustomerData) {
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Customer not found');
    }

    // Check email/phone uniqueness if being changed
    if (data.email || data.phone) {
      const conflict = await prisma.customer.findFirst({
        where: {
          id: { not: id },
          restaurantId: existing.restaurantId,
          OR: [
            data.email && data.email !== existing.email ? { email: data.email } : {},
            data.phone && data.phone !== existing.phone ? { phone: data.phone } : {},
          ].filter((obj) => Object.keys(obj).length > 0),
        },
      });

      if (conflict) {
        throw new ApiError(400, 'Customer with this email or phone already exists');
      }
    }

    const updateData: any = { ...data };
    if (data.birthday) {
      updateData.birthday = new Date(data.birthday);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return customer;
  }

  async delete(id: string) {
    const existing = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Customer not found');
    }

    // Soft delete by anonymizing data if has orders
    if (existing._count.orders > 0) {
      await prisma.customer.update({
        where: { id },
        data: {
          firstName: 'Deleted',
          lastName: 'Customer',
          email: null,
          phone: null,
          address: null,
          notes: 'Customer deleted',
        },
      });

      return { message: 'Customer data anonymized (has order history)' };
    }

    // Hard delete if no orders
    await prisma.customer.delete({ where: { id } });

    return { message: 'Customer deleted successfully' };
  }

  async getOrders(customerId: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    const total = await prisma.order.count({
      where: { customerId },
    });

    const orders = await prisma.order.findMany({
      where: { customerId },
      skip,
      take: limit,
      include: {
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

  async getReservations(customerId: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    const total = await prisma.reservation.count({
      where: { customerId },
    });

    const reservations = await prisma.reservation.findMany({
      where: { customerId },
      skip,
      take: limit,
      include: {
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
            capacity: true,
          },
        },
      },
      orderBy: { reservationDate: 'desc' },
    });

    return {
      data: reservations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async manageLoyaltyPoints(customerId: string, data: LoyaltyPointsData) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    const newPoints = customer.loyaltyPoints + data.points;

    if (newPoints < 0) {
      throw new ApiError(400, 'Insufficient loyalty points');
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: newPoints,
        notes: `${customer.notes || ''}\n${new Date().toISOString()}: ${data.reason} (${data.points > 0 ? '+' : ''}${data.points} points)`,
      },
    });

    return {
      customerId: updated.id,
      previousPoints: customer.loyaltyPoints,
      pointsChanged: data.points,
      currentPoints: updated.loyaltyPoints,
      reason: data.reason,
    };
  }

  async getUpcomingBirthdays(restaurantId: string, days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Get all customers with birthdays
    const customers = await prisma.customer.findMany({
      where: {
        restaurantId,
        birthday: { not: null },
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // Filter customers with upcoming birthdays (same month/day)
    const upcomingBirthdays = customers.filter((customer) => {
      if (!customer.birthday) return false;

      const birthday = new Date(customer.birthday);
      const currentYear = today.getFullYear();

      // Create this year's birthday
      const thisYearBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());

      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(currentYear + 1);
      }

      return thisYearBirthday >= today && thisYearBirthday <= futureDate;
    });

    // Sort by upcoming birthday
    upcomingBirthdays.sort((a, b) => {
      const aDate = new Date(a.birthday!);
      const bDate = new Date(b.birthday!);
      return aDate.getMonth() * 31 + aDate.getDate() - (bDate.getMonth() * 31 + bDate.getDate());
    });

    return upcomingBirthdays.map((customer) => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      birthday: customer.birthday,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer._count.orders,
    }));
  }

  async getStats(restaurantId?: string) {
    const where = restaurantId ? { restaurantId } : {};

    const [totalCustomers, activeCustomers, totalLoyaltyPoints, avgOrderValue] =
      await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.count({
          where: {
            ...where,
            totalOrders: { gt: 0 },
          },
        }),
        prisma.customer.aggregate({
          where,
          _sum: { loyaltyPoints: true },
        }),
        prisma.customer.aggregate({
          where: {
            ...where,
            totalOrders: { gt: 0 },
          },
          _avg: { totalSpent: true },
        }),
      ]);

    // Get customer segments
    const allCustomers = await prisma.customer.findMany({
      where,
      select: {
        totalOrders: true,
        totalSpent: true,
      },
    });

    const segments = {
      vip: 0,
      regular: 0,
      new: 0,
    };

    allCustomers.forEach((customer) => {
      const segment = this.getCustomerSegment(customer.totalOrders, customer.totalSpent);
      segments[segment as keyof typeof segments]++;
    });

    return {
      totalCustomers,
      activeCustomers,
      totalLoyaltyPoints: totalLoyaltyPoints._sum.loyaltyPoints || 0,
      averageOrderValue: avgOrderValue._avg.totalSpent || 0,
      segments,
    };
  }

  private getCustomerSegment(totalOrders: number, totalSpent: number): string {
    if (totalOrders >= 10 || totalSpent >= 5000) {
      return 'vip';
    } else if (totalOrders >= 3 || totalSpent >= 1000) {
      return 'regular';
    } else {
      return 'new';
    }
  }

  // Helper method to award loyalty points on order completion
  async awardPointsForOrder(customerId: string, orderTotal: number) {
    const pointsEarned = Math.floor(orderTotal * 0.1); // 10% of order total

    await this.manageLoyaltyPoints(customerId, {
      points: pointsEarned,
      reason: `Order completed - ${orderTotal} ETB`,
    });

    return pointsEarned;
  }

  // Helper method to redeem points (100 points = 50 ETB)
  async redeemPoints(customerId: string, points: number): Promise<number> {
    const discountAmount = (points / 100) * 50;

    await this.manageLoyaltyPoints(customerId, {
      points: -points,
      reason: `Redeemed ${points} points for ${discountAmount} ETB discount`,
    });

    return discountAmount;
  }
}
