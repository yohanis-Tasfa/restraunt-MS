import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface CreateReservationData {
  customerId: string;
  branchId: string;
  tableId?: string; // Deprecated: for backward compatibility
  tableIds?: string[]; // New: support multiple tables
  reservationDate: Date;
  guests: number;
  notes?: string;
}

interface UpdateReservationData extends Partial<Omit<CreateReservationData, 'customerId' | 'branchId'>> {}

interface QueryParams {
  page?: number;
  limit?: number;
  branchId?: string;
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export class ReservationService {
  async getAll(params: QueryParams = {}) {
    const { page = 1, limit = 20, branchId, customerId, status, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.reservationDate = {};
      if (startDate) {
        where.reservationDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.reservationDate.lte = new Date(endDate);
      }
    }

    const total = await prisma.reservation.count({ where });

    const reservations = await prisma.reservation.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
          },
        },
        reservationTables: {
          include: {
            table: {
              select: {
                id: true,
                number: true,
                capacity: true,
              },
            },
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

  async getById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
            status: true,
          },
        },
        reservationTables: {
          include: {
            table: {
              select: {
                id: true,
                number: true,
                capacity: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    return reservation;
  }

  async create(data: CreateReservationData) {
    // Validate customer
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Validate branch
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
    });

    if (!branch) {
      throw new ApiError(404, 'Branch not found');
    }

    // Handle both single tableId and multiple tableIds
    const tableIds = data.tableIds || (data.tableId ? [data.tableId] : []);

    // Validate tables if provided
    if (tableIds.length > 0) {
      const tables = await prisma.table.findMany({
        where: { id: { in: tableIds } },
      });

      if (tables.length !== tableIds.length) {
        throw new ApiError(404, 'One or more tables not found');
      }

      // Validate all tables belong to the branch
      const invalidTables = tables.filter(t => t.branchId !== data.branchId);
      if (invalidTables.length > 0) {
        throw new ApiError(400, 'One or more tables do not belong to this branch');
      }

      // Check for conflicting reservations on any of the tables
      for (const table of tables) {
        const conflict = await this.checkConflict(
          table.id,
          data.reservationDate,
          data.reservationDate
        );

        if (conflict) {
          throw new ApiError(
            400,
            `Table ${table.number} is already reserved for ${new Date(data.reservationDate).toLocaleString()}`
          );
        }
      }
    }

    // Check if reservation date is in the future
    if (new Date(data.reservationDate) < new Date()) {
      throw new ApiError(400, 'Reservation date must be in the future');
    }

    // Create reservation with multiple tables
    const reservation = await prisma.reservation.create({
      data: {
        customerId: data.customerId,
        branchId: data.branchId,
        tableId: tableIds[0] || null, // Keep first table for backward compatibility
        reservationDate: new Date(data.reservationDate),
        guests: data.guests,
        notes: data.notes,
        status: 'PENDING',
        reservationTables: {
          create: tableIds.map(tableId => ({
            tableId,
          })),
        },
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
        reservationTables: {
          include: {
            table: {
              select: {
                id: true,
                number: true,
                capacity: true,
              },
            },
          },
        },
      },
    });

    // Update status of all assigned tables to RESERVED
    if (tableIds.length > 0) {
      await prisma.table.updateMany({
        where: { id: { in: tableIds } },
        data: { status: 'RESERVED' },
      });
    }

    return reservation;
  }

  async update(id: string, data: UpdateReservationData) {
    const existing = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Reservation not found');
    }

    // Can't edit completed/cancelled reservations
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(existing.status)) {
      throw new ApiError(400, `Cannot edit ${existing.status.toLowerCase()} reservations`);
    }

    // Validate table if being changed
    if (data.tableId && data.tableId !== existing.tableId) {
      const table = await prisma.table.findUnique({
        where: { id: data.tableId },
      });

      if (!table) {
        throw new ApiError(404, 'Table not found');
      }

      if (table.branchId !== existing.branchId) {
        throw new ApiError(400, 'Table does not belong to this branch');
      }

      // Check capacity
      const guests = data.guests || existing.guests;
      if (guests > table.capacity) {
        throw new ApiError(
          400,
          `Table ${table.number} has capacity of ${table.capacity}, but ${guests} guests requested`
        );
      }

      // Check for conflicts
      const reservationDate = data.reservationDate || existing.reservationDate;
      const conflict = await this.checkConflict(data.tableId, reservationDate, reservationDate, id);

      if (conflict) {
        throw new ApiError(
          400,
          `Table ${table.number} is already reserved for ${new Date(reservationDate).toLocaleString()}`
        );
      }

      // Free up old table if changing tables
      if (existing.tableId && existing.tableId !== data.tableId) {
        await prisma.table.update({
          where: { id: existing.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      // Reserve new table
      await prisma.table.update({
        where: { id: data.tableId },
        data: { status: 'RESERVED' },
      });
    }

    // Validate reservation date if being changed
    if (data.reservationDate) {
      const newDate = new Date(data.reservationDate);
      if (newDate < new Date()) {
        throw new ApiError(400, 'Reservation date must be in the future');
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...data,
        reservationDate: data.reservationDate ? new Date(data.reservationDate) : undefined,
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
    });

    return reservation;
  }

  async updateStatus(id: string, status: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        reservationTables: {
          select: {
            tableId: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    // Get all table IDs for this reservation
    const tableIds = reservation.reservationTables.map(rt => rt.tableId);
    if (tableIds.length === 0 && reservation.tableId) {
      // Fallback to old single-table format
      tableIds.push(reservation.tableId);
    }

    // Update status of all tables based on reservation status
    if (tableIds.length > 0) {
      let tableStatus: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' = 'AVAILABLE';

      if (status === 'CONFIRMED' || status === 'PENDING') {
        tableStatus = 'RESERVED';
      } else if (status === 'SEATED') {
        tableStatus = 'OCCUPIED';
      } else if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
        tableStatus = 'AVAILABLE';
      }

      await prisma.table.updateMany({
        where: { id: { in: tableIds } },
        data: { status: tableStatus },
      });
    }

    return updated;
  }

  async cancel(id: string, reason?: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        reservationTables: {
          select: {
            tableId: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    if (reservation.status === 'COMPLETED') {
      throw new ApiError(400, 'Cannot cancel completed reservations');
    }

    if (reservation.status === 'CANCELLED') {
      throw new ApiError(400, 'Reservation is already cancelled');
    }

    const cancelled = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${reservation.notes || ''}\nCancellation reason: ${reason}` : reservation.notes,
      },
    });

    // Get all table IDs for this reservation and free them up
    const tableIds = reservation.reservationTables.map(rt => rt.tableId);
    if (tableIds.length === 0 && reservation.tableId) {
      // Fallback to old single-table format
      tableIds.push(reservation.tableId);
    }

    if (tableIds.length > 0) {
      await prisma.table.updateMany({
        where: { id: { in: tableIds } },
        data: { status: 'AVAILABLE' },
      });
    }

    return cancelled;
  }

  async delete(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        reservationTables: {
          select: {
            tableId: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    // Get all table IDs to free them up
    const tableIds = reservation.reservationTables.map(rt => rt.tableId);
    if (tableIds.length === 0 && reservation.tableId) {
      tableIds.push(reservation.tableId);
    }

    // Delete the reservation (cascades to reservationTables automatically)
    await prisma.reservation.delete({
      where: { id },
    });

    // Free up all tables
    if (tableIds.length > 0) {
      await prisma.table.updateMany({
        where: { id: { in: tableIds } },
        data: { status: 'AVAILABLE' },
      });
    }

    return { message: 'Reservation deleted successfully' };
  }

  async getUpcoming(branchId: string, days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const reservations = await prisma.reservation.findMany({
      where: {
        branchId,
        reservationDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
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
        table: {
          select: {
            id: true,
            number: true,
          },
        },
      },
      orderBy: { reservationDate: 'asc' },
    });

    return reservations;
  }

  private async checkConflict(
    tableId: string,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: string
  ): Promise<boolean> {
    // Add buffer time (e.g., 2 hours) for each reservation
    const bufferHours = 2;
    const start = new Date(startTime);
    start.setHours(start.getHours() - bufferHours);
    const end = new Date(endTime);
    end.setHours(end.getHours() + bufferHours);

    const where: any = {
      tableId,
      status: { in: ['PENDING', 'CONFIRMED', 'SEATED'] },
      reservationDate: {
        gte: start,
        lte: end,
      },
    };

    if (excludeReservationId) {
      where.id = { not: excludeReservationId };
    }

    const conflicting = await prisma.reservation.findFirst({ where });

    return !!conflicting;
  }
}
