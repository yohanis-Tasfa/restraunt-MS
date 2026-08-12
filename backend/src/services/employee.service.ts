import { PrismaClient, EmploymentType, EmployeeStatus, PayrollStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const employeeService = {
  // Create a new employee
  async createEmployee(data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string;
    restaurantId?: string;
    branchId?: string;
    employeeCode: string;
    department: string;
    position: string;
    employmentType: EmploymentType;
    salary: number;
    hireDate: Date | string;
    contractEndDate?: Date | string;
    emergencyContact?: string;
    emergencyPhone?: string;
    bankAccount?: string;
    taxNumber?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Convert date strings to Date objects
    const hireDate = typeof data.hireDate === 'string' ? new Date(data.hireDate) : data.hireDate;
    const contractEndDate = data.contractEndDate 
      ? (typeof data.contractEndDate === 'string' ? new Date(data.contractEndDate) : data.contractEndDate)
      : undefined;

    // Create user and employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          roleId: data.roleId,
          restaurantId: data.restaurantId,
          branchId: data.branchId,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode: data.employeeCode,
          department: data.department,
          position: data.position,
          employmentType: data.employmentType,
          salary: data.salary,
          hireDate: hireDate,
          contractEndDate: contractEndDate,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          bankAccount: data.bankAccount,
          taxNumber: data.taxNumber,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              role: {
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
          },
        },
      });

      return employee;
    });

    return result;
  },

  // Get all employees
  async getAllEmployees(filters?: {
    department?: string;
    status?: EmployeeStatus;
    employmentType?: EmploymentType;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.department) {
      where.department = filters.department;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.employmentType) {
      where.employmentType = filters.employmentType;
    }

    if (filters?.search) {
      where.OR = [
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } },
        { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              role: {
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get employee by ID
  async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            role: {
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
        },
        payrolls: {
          orderBy: {
            period: 'desc',
          },
          take: 12, // Last 12 months
        },
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  },

  // Update employee
  async updateEmployee(
    id: string,
    data: {
      department?: string;
      position?: string;
      employmentType?: EmploymentType;
      salary?: number;
      contractEndDate?: Date;
      emergencyContact?: string;
      emergencyPhone?: string;
      bankAccount?: string;
      taxNumber?: string;
      status?: EmployeeStatus;
      // User fields
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      isActive?: boolean;
    }
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user if user fields are provided
      if (
        data.firstName ||
        data.lastName ||
        data.phone ||
        data.email ||
        data.isActive !== undefined
      ) {
        await tx.user.update({
          where: { id: employee.userId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
            isActive: data.isActive,
          },
        });
      }

      // Update employee
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: {
          department: data.department,
          position: data.position,
          employmentType: data.employmentType,
          salary: data.salary,
          contractEndDate: data.contractEndDate,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          bankAccount: data.bankAccount,
          taxNumber: data.taxNumber,
          status: data.status,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              role: {
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
          },
        },
      });

      return updatedEmployee;
    });

    return result;
  },

  // Delete employee
  async deleteEmployee(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Delete in transaction (user will cascade delete employee)
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    return { message: 'Employee deleted successfully' };
  },

  // Get employee statistics
  async getEmployeeStats() {
    const [total, active, onLeave, byDepartment, byEmploymentType] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.employee.groupBy({
        by: ['department'],
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['employmentType'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      onLeave,
      byDepartment,
      byEmploymentType,
    };
  },

  // Create payroll
  async createPayroll(data: {
    employeeId: string;
    period: Date;
    basicSalary: number;
    allowances?: number;
    deductions?: number;
    overtime?: number;
    notes?: string;
  }) {
    const netSalary =
      data.basicSalary +
      (data.allowances || 0) +
      (data.overtime || 0) -
      (data.deductions || 0);

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: data.employeeId,
        period: data.period,
        basicSalary: data.basicSalary,
        allowances: data.allowances || 0,
        deductions: data.deductions || 0,
        overtime: data.overtime || 0,
        netSalary,
        notes: data.notes,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return payroll;
  },

  // Get payrolls
  async getPayrolls(filters?: {
    employeeId?: string;
    period?: Date;
    status?: PayrollStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters?.period) {
      where.period = filters.period;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          period: 'desc',
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return {
      payrolls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Update payroll status
  async updatePayrollStatus(id: string, status: PayrollStatus) {
    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return payroll;
  },

  // Get attendance records
  async getAttendance(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
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
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      attendance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Mark attendance
  async markAttendance(data: {
    userId: string;
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    status: string;
    notes?: string;
  }) {
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: data.userId,
          date: data.date,
        },
      },
      update: {
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        status: data.status as any,
        notes: data.notes,
      },
      create: {
        userId: data.userId,
        date: data.date,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        status: data.status as any,
        notes: data.notes,
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

    return attendance;
  },
};
