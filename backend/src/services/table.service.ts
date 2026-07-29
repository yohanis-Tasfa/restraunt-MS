import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateTableData {
  number: string;
  capacity: number;
  floorId?: string;
  branchId: string;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
}

interface UpdateTableData extends Partial<Omit<CreateTableData, 'branchId'>> {}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  floorId?: string;
  status?: string;
}

export class TableService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 50, search, branchId, floorId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.number = { contains: search, mode: 'insensitive' };
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (floorId) {
      where.floorId = floorId;
    }

    if (status) {
      where.status = status;
    }

    const total = await prisma.table.count({ where });

    const tables = await prisma.table.findMany({
      where,
      skip,
      take: limit,
      include: {
        floor: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
      orderBy: [{ floorId: 'asc' }, { number: 'asc' }],
    });

    return {
      data: tables,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
          },
        },
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
        orders: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
          },
          include: {
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
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reservations: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            reservationDate: { gte: new Date() },
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
          orderBy: { reservationDate: 'asc' },
        },
      },
    });

    if (!table) {
      throw new ApiError(404, 'Table not found');
    }

    return table;
  }

  async getByBranch(branchId: string) {
    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    const tables = await prisma.table.findMany({
      where: { branchId },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
          },
        },
        orders: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
          },
        },
      },
      orderBy: [{ floorId: 'asc' }, { number: 'asc' }],
    });

    // Group by floor
    const grouped = tables.reduce((acc: any, table) => {
      const floorName = table.floor?.name || 'No Floor';
      if (!acc[floorName]) {
        acc[floorName] = [];
      }
      acc[floorName].push(table);
      return acc;
    }, {});

    return grouped;
  }

  async create(data: CreateTableData) {
    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Check if floor exists (if provided)
    if (data.floorId) {
      const floor = await prisma.floor.findUnique({
        where: { id: data.floorId },
      });

      if (!floor) {
        throw new ApiError(404, 'Floor not found');
      }
    }

    // Check if table number already exists in this branch
    const existing = await prisma.table.findFirst({
      where: {
        number: data.number,
        branchId: data.branchId,
      },
    });

    if (existing) {
      throw new ApiError(400, 'Table number already exists in this branch');
    }

    const table = await prisma.table.create({
      data: {
        ...data,
        status: data.status || 'AVAILABLE',
      },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return table;
  }

  async update(id: string, data: UpdateTableData) {
    const existing = await prisma.table.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Table not found');
    }

    // Check if floor exists (if being changed)
    if (data.floorId) {
      const floor = await prisma.floor.findUnique({
        where: { id: data.floorId },
      });

      if (!floor) {
        throw new ApiError(404, 'Floor not found');
      }
    }

    // Check number uniqueness if number is being changed
    if (data.number && data.number !== existing.number) {
      const numberExists = await prisma.table.findFirst({
        where: {
          number: data.number,
          branchId: existing.branchId,
          id: { not: id },
        },
      });

      if (numberExists) {
        throw new ApiError(400, 'Table number already exists in this branch');
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data,
      include: {
        floor: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return table;
  }

  async updateStatus(id: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING') {
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new ApiError(404, 'Table not found');
    }

    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await prisma.table.update({
      where: { id },
      data: { status },
    });

    return updated;
  }

  async delete(id: string) {
    const existing = await prisma.table.findUnique({
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
      throw new ApiError(404, 'Table not found');
    }

    // Check if table has active orders
    const activeOrders = await prisma.order.count({
      where: {
        tableId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] },
      },
    });

    if (activeOrders > 0) {
      throw new ApiError(400, 'Cannot delete table with active orders');
    }

    // Check if table has upcoming reservations
    const upcomingReservations = await prisma.reservation.count({
      where: {
        tableId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        reservationDate: { gte: new Date() },
      },
    });

    if (upcomingReservations > 0) {
      throw new ApiError(400, 'Cannot delete table with upcoming reservations');
    }

    await prisma.table.delete({ where: { id } });

    return { message: 'Table deleted successfully' };
  }

  async mergeTables(tableIds: string[], mergedNumber: string) {
    if (tableIds.length < 2) {
      throw new ApiError(400, 'At least 2 tables are required for merging');
    }

    // Fetch all tables
    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds } },
    });

    if (tables.length !== tableIds.length) {
      throw new ApiError(404, 'One or more tables not found');
    }

    // Ensure all tables are from the same branch
    const branchIds = [...new Set(tables.map((t) => t.branchId))];
    if (branchIds.length > 1) {
      throw new ApiError(400, 'All tables must be from the same branch');
    }

    // Ensure all tables are available
    const unavailable = tables.filter((t) => t.status !== 'AVAILABLE');
    if (unavailable.length > 0) {
      throw new ApiError(
        400,
        `Tables ${unavailable.map((t) => t.number).join(', ')} are not available for merging`
      );
    }

    // Calculate total capacity
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

    // Create merged table
    const mergedTable = await prisma.table.create({
      data: {
        number: mergedNumber,
        capacity: totalCapacity,
        branchId: tables[0].branchId,
        floorId: tables[0].floorId,
        status: 'AVAILABLE',
      },
    });

    // Mark original tables as merged (you could add a mergedIntoId field to schema)
    // For now, we'll delete them or mark as unavailable
    await prisma.table.updateMany({
      where: { id: { in: tableIds } },
      data: { status: 'CLEANING' }, // Or delete them
    });

    return {
      mergedTable,
      originalTables: tables.map((t) => ({ id: t.id, number: t.number })),
    };
  }

  async unmerge(id: string) {
    // This would require additional schema changes to track merged tables
    // For now, just return an error
    throw new ApiError(400, 'Table unmerging requires additional implementation');
  }

  async getAvailability(branchId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const tables = await prisma.table.findMany({
      where: { branchId },
      include: {
        reservations: {
          where: {
            reservationDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        },
      },
    });

    return tables.map((table) => ({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      reservations: table.reservations.map((r) => ({
        id: r.id,
        time: r.reservationDate,
        guests: r.guests,
      })),
    }));
  }
}
