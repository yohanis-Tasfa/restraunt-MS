import prisma from '../config/database';
import { extractTableIdFromQRCode } from '../utils/qrcode';

interface CreateSessionData {
  qrCodeData: string;
  customerName?: string;
  customerPhone?: string;
  guestCount: number;
}

interface UpdateSessionData {
  customerName?: string;
  customerPhone?: string;
  guestCount?: number;
  status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
}

interface SessionFilters {
  tableId?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface SessionStatsFilters {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export const customerSessionService = {
  // Create a new customer session
  async createSession(data: CreateSessionData) {
    const { qrCodeData, customerName, customerPhone, guestCount } = data;

    // Extract table ID from QR code
    const tableId = extractTableIdFromQRCode(qrCodeData);
    if (!tableId) {
      throw new Error('Invalid QR code');
    }

    // Verify table exists and has this QR code
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        qrCodeData: qrCodeData,
      },
      include: {
        assignedWaiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!table) {
      throw new Error('Invalid QR code or table not found');
    }

    // Check if there's already an active session for this table
    const activeSession = await prisma.customerSession.findFirst({
      where: {
        tableId: table.id,
        status: 'ACTIVE',
      },
    });

    if (activeSession) {
      // Return existing active session instead of creating a new one
      return activeSession;
    }

    // Create new session
    const session = await prisma.customerSession.create({
      data: {
        tableId: table.id,
        customerName,
        customerPhone,
        guestCount,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
      include: {
        table: {
          include: {
            assignedWaiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update table status to OCCUPIED
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' },
    });

    return session;
  },

  // Get session by ID
  async getSessionById(id: string) {
    const session = await prisma.customerSession.findUnique({
      where: { id },
      include: {
        table: {
          include: {
            assignedWaiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        waiterCalls: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            waiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return session;
  },

  // Get session by QR code
  async getSessionByQRCode(qrCodeData: string) {
    const tableId = extractTableIdFromQRCode(qrCodeData);
    if (!tableId) {
      throw new Error('Invalid QR code');
    }

    const session = await prisma.customerSession.findFirst({
      where: {
        tableId,
        status: 'ACTIVE',
      },
      include: {
        table: {
          include: {
            assignedWaiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        waiterCalls: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            waiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return session;
  },

  // Get active session for a table
  async getActiveSessionByTable(tableId: string) {
    const session = await prisma.customerSession.findFirst({
      where: {
        tableId,
        status: 'ACTIVE',
      },
      include: {
        table: {
          include: {
            assignedWaiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        waiterCalls: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            waiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return session;
  },

  // Update session
  async updateSession(id: string, data: UpdateSessionData) {
    const session = await prisma.customerSession.update({
      where: { id },
      data,
      include: {
        table: {
          include: {
            assignedWaiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return session;
  },

  // End session
  async endSession(id: string) {
    const session = await prisma.customerSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
      include: {
        table: true,
      },
    });

    // Check if there are any other active sessions for this table
    const otherActiveSessions = await prisma.customerSession.findFirst({
      where: {
        tableId: session.tableId,
        status: 'ACTIVE',
        id: { not: id },
      },
    });

    // If no other active sessions, mark table as available
    if (!otherActiveSessions) {
      await prisma.table.update({
        where: { id: session.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return session;
  },

  // Get sessions with filters and pagination
  async getSessions(filters: SessionFilters) {
    const {
      tableId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    if (tableId) {
      where.tableId = tableId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.startedAt.lte = new Date(endDate);
      }
    }

    const [sessions, total] = await Promise.all([
      prisma.customerSession.findMany({
        where,
        include: {
          table: {
            select: {
              id: true,
              number: true,
              capacity: true,
              assignedWaiter: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          waiterCalls: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerSession.count({ where }),
    ]);

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get session statistics
  async getSessionStats(filters: SessionStatsFilters) {
    const { branchId, startDate, endDate } = filters;

    const where: any = {};

    if (branchId) {
      where.table = {
        branchId,
      };
    }

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.startedAt.lte = new Date(endDate);
      }
    }

    const [
      totalSessions,
      activeSessions,
      completedSessions,
      abandonedSessions,
      averageGuestCount,
      averageDuration,
    ] = await Promise.all([
      // Total sessions
      prisma.customerSession.count({ where }),

      // Active sessions
      prisma.customerSession.count({
        where: { ...where, status: 'ACTIVE' },
      }),

      // Completed sessions
      prisma.customerSession.count({
        where: { ...where, status: 'COMPLETED' },
      }),

      // Abandoned sessions
      prisma.customerSession.count({
        where: { ...where, status: 'ABANDONED' },
      }),

      // Average guest count
      prisma.customerSession.aggregate({
        where,
        _avg: {
          guestCount: true,
        },
      }),

      // Average session duration (for completed sessions only)
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")) / 60) as avg_duration_minutes
        FROM "CustomerSession"
        WHERE status = 'COMPLETED'
        ${branchId ? prisma.$queryRawUnsafe(`AND "tableId" IN (SELECT id FROM "Table" WHERE "branchId" = '${branchId}')`) : prisma.$queryRawUnsafe('')}
        ${startDate ? prisma.$queryRawUnsafe(`AND "startedAt" >= '${startDate}'`) : prisma.$queryRawUnsafe('')}
        ${endDate ? prisma.$queryRawUnsafe(`AND "startedAt" <= '${endDate}'`) : prisma.$queryRawUnsafe('')}
      `,
    ]);

    return {
      totalSessions,
      activeSessions,
      completedSessions,
      abandonedSessions,
      averageGuestCount: averageGuestCount._avg.guestCount || 0,
      averageDurationMinutes: averageDuration?.[0]?.avg_duration_minutes || 0,
    };
  },
};
