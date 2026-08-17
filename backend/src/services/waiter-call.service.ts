import prisma from '../config/database';

interface CreateCallData {
  sessionId: string;
  requestType: 'ASSISTANCE' | 'ORDER_READY' | 'BILL_REQUEST' | 'OTHER';
  selectedItems?: any; // JSON data of selected menu items
}

interface CallStatsFilters {
  waiterId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export const waiterCallService = {
  // Create a new waiter call
  async createCall(data: CreateCallData) {
    const { sessionId, requestType, selectedItems } = data;

    // Get session with table and assigned waiter
    const session = await prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: {
        table: {
          include: {
            assignedWaiter: true,
            branch: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // If no waiter assigned to table, find any available waiter in the branch
    let waiterId = session.table.assignedWaiter?.id;

    if (!waiterId) {
      // Find any active waiter in the branch
      const availableWaiter = await prisma.user.findFirst({
        where: {
          branchId: session.table.branchId,
          isActive: true,
          role: {
            name: {
              in: ['Waiter', 'Server', 'Manager', 'Admin', 'Super Admin'],
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!availableWaiter) {
        throw new Error('No waiters available. Please contact staff.');
      }

      waiterId = availableWaiter.id;
    }

    // Create waiter call
    const call = await prisma.waiterCall.create({
      data: {
        sessionId,
        tableId: session.tableId,
        waiterId,
        requestType,
        selectedItems,
        status: 'PENDING',
      },
      include: {
        session: true,
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
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
      },
    });

    return call;
  },

  // Get call by ID
  async getCallById(id: string) {
    const call = await prisma.waiterCall.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            guestCount: true,
            status: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
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
      },
    });

    return call;
  },

  // Get calls for a specific waiter
  async getCallsForWaiter(
    waiterId: string,
    status?: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED'
  ) {
    const where: any = { waiterId };

    if (status) {
      where.status = status;
    }

    const calls = await prisma.waiterCall.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            guestCount: true,
            status: true,
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
      orderBy: {
        createdAt: 'asc', // FIFO - first in, first out
      },
    });

    return calls;
  },

  // Get calls for a session
  async getCallsForSession(sessionId: string) {
    const calls = await prisma.waiterCall.findMany({
      where: { sessionId },
      include: {
        table: {
          select: {
            id: true,
            number: true,
          },
        },
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

    return calls;
  },

  // Update call status
  async updateCallStatus(
    id: string,
    status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED',
    waiterId?: string,
    notes?: string
  ) {
    const updateData: any = { status };

    if (status === 'ACKNOWLEDGED' && !updateData.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const call = await prisma.waiterCall.update({
      where: { id },
      data: updateData,
      include: {
        session: {
          select: {
            id: true,
            customerName: true,
            guestCount: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
          },
        },
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return call;
  },

  // Cancel call
  async cancelCall(id: string, reason?: string) {
    const call = await prisma.waiterCall.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason,
      },
      include: {
        session: true,
        table: true,
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return call;
  },

  // Get pending calls for a branch
  async getPendingCallsByBranch(branchId: string) {
    const calls = await prisma.waiterCall.findMany({
      where: {
        status: 'PENDING',
        table: {
          branchId,
        },
      },
      include: {
        session: {
          select: {
            id: true,
            customerName: true,
            guestCount: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
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
      },
      orderBy: {
        createdAt: 'asc', // FIFO
      },
    });

    return calls;
  },

  // Get call statistics
  async getCallStats(filters: CallStatsFilters) {
    const { waiterId, branchId, startDate, endDate } = filters;

    const where: any = {};

    if (waiterId) {
      where.waiterId = waiterId;
    }

    if (branchId) {
      where.table = {
        branchId,
      };
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

    const [
      totalCalls,
      pendingCalls,
      acknowledgedCalls,
      completedCalls,
      cancelledCalls,
      averageResponseTime,
    ] = await Promise.all([
      // Total calls
      prisma.waiterCall.count({ where }),

      // Pending calls
      prisma.waiterCall.count({
        where: { ...where, status: 'PENDING' },
      }),

      // Acknowledged calls
      prisma.waiterCall.count({
        where: { ...where, status: 'ACKNOWLEDGED' },
      }),

      // Completed calls
      prisma.waiterCall.count({
        where: { ...where, status: 'COMPLETED' },
      }),

      // Cancelled calls
      prisma.waiterCall.count({
        where: { ...where, status: 'CANCELLED' },
      }),

      // Average response time (time between creation and acknowledgment)
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("acknowledgedAt" - "createdAt")) / 60) as avg_response_minutes
        FROM "WaiterCall"
        WHERE "acknowledgedAt" IS NOT NULL
        ${waiterId ? prisma.$queryRawUnsafe(`AND "waiterId" = '${waiterId}'`) : prisma.$queryRawUnsafe('')}
        ${branchId ? prisma.$queryRawUnsafe(`AND "tableId" IN (SELECT id FROM "Table" WHERE "branchId" = '${branchId}')`) : prisma.$queryRawUnsafe('')}
        ${startDate ? prisma.$queryRawUnsafe(`AND "createdAt" >= '${startDate}'`) : prisma.$queryRawUnsafe('')}
        ${endDate ? prisma.$queryRawUnsafe(`AND "createdAt" <= '${endDate}'`) : prisma.$queryRawUnsafe('')}
      `,
    ]);

    // Get calls by request type
    const callsByType = await prisma.waiterCall.groupBy({
      by: ['requestType'],
      where,
      _count: true,
    });

    return {
      totalCalls,
      pendingCalls,
      acknowledgedCalls,
      completedCalls,
      cancelledCalls,
      averageResponseMinutes: averageResponseTime?.[0]?.avg_response_minutes || 0,
      callsByType: callsByType.map((item) => ({
        type: item.requestType,
        count: item._count,
      })),
    };
  },

  // Get all calls with filters
  async getAllCalls(params: {
    status?: string;
    requestType?: string;
    tableId?: string;
    waiterId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const { status, requestType, tableId, waiterId, branchId, startDate, endDate, limit = 50, offset = 0 } = params;

    const where: any = {};

    if (status) where.status = status;
    if (requestType) where.requestType = requestType;
    if (tableId) where.tableId = tableId;
    if (waiterId) where.waiterId = waiterId;
    
    if (branchId) {
      where.table = {
        branchId,
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [calls, total] = await Promise.all([
      prisma.waiterCall.findMany({
        where,
        include: {
          session: {
            select: {
              id: true,
              customerName: true,
              guestCount: true,
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
          waiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.waiterCall.count({ where }),
    ]);

    return {
      calls,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  },

  // Get active calls (PENDING or ACKNOWLEDGED)
  async getActiveCalls(branchId?: string) {
    const where: any = {
      status: {
        in: ['PENDING', 'ACKNOWLEDGED'],
      },
    };

    if (branchId) {
      where.table = {
        branchId,
      };
    }

    const calls = await prisma.waiterCall.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            customerName: true,
            guestCount: true,
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
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return calls;
  },

  // Get calls for a table
  async getCallsForTable(tableId: string) {
    const calls = await prisma.waiterCall.findMany({
      where: { tableId },
      include: {
        session: {
          select: {
            id: true,
            customerName: true,
            guestCount: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
          },
        },
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

    return calls;
  },

  // Update call notes
  async updateNotes(id: string, notes: string) {
    const call = await prisma.waiterCall.update({
      where: { id },
      data: { notes },
      include: {
        session: {
          select: {
            id: true,
            customerName: true,
            guestCount: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
          },
        },
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return call;
  },
};
