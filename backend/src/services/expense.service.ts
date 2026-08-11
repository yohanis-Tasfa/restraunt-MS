import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';

interface CreateExpenseData {
  category: string;
  amount: number;
  description?: string;
  reference?: string;
  attachment?: string;
  userId: string;
  date: Date;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface UpdateExpenseData {
  category?: string;
  amount?: number;
  description?: string;
  reference?: string;
  attachment?: string;
  date?: Date;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface QueryParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const expenseService = {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 20, category, status, startDate, endDate, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.expense.count({ where });

    const expenses = await prisma.expense.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return {
      data: expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      throw new ApiError(404, 'Expense not found');
    }

    return expense;
  },

  async create(data: CreateExpenseData) {
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        amount: data.amount,
        description: data.description,
        reference: data.reference,
        attachment: data.attachment,
        userId: data.userId,
        date: data.date,
        status: data.status || 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return expense;
  },

  async update(id: string, data: UpdateExpenseData) {
    const existing = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Expense not found');
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        category: data.category,
        amount: data.amount,
        description: data.description,
        reference: data.reference,
        attachment: data.attachment,
        date: data.date,
        status: data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return expense;
  },

  async delete(id: string) {
    const existing = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Expense not found');
    }

    await prisma.expense.delete({
      where: { id },
    });
  },

  async getStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Total this month/period
    const totalAmount = await prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    // Unpaid expenses
    const unpaidAmount = await prisma.expense.aggregate({
      where: {
        ...where,
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // By category
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    // Find largest category
    const largestCategory = byCategory.length > 0 ? byCategory[0] : null;

    return {
      totalAmount: totalAmount._sum.amount || 0,
      unpaidAmount: unpaidAmount._sum.amount || 0,
      unpaidCount: unpaidAmount._count || 0,
      largestCategory: largestCategory ? largestCategory.category : null,
      largestCategoryAmount: largestCategory ? largestCategory._sum.amount : 0,
      byCategory: byCategory.map(cat => ({
        category: cat.category,
        amount: cat._sum.amount || 0,
      })),
    };
  },

  async getCategories() {
    const categories = await prisma.expense.groupBy({
      by: ['category'],
      _count: true,
    });

    return categories.map(c => c.category);
  },
};
