import api from './client';

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  department: string;
  position: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salary: number;
  hireDate: string;
  contractEndDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bankAccount?: string;
  taxNumber?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive: boolean;
    role: {
      id: string;
      name: string;
    };
    branch?: {
      id: string;
      name: string;
    };
  };
  payrolls?: Payroll[];
}

export interface Payroll {
  id: string;
  employeeId: string;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  netSalary: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateEmployeeData {
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
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salary: number;
  hireDate: string;
  contractEndDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bankAccount?: string;
  taxNumber?: string;
}

export interface UpdateEmployeeData {
  department?: string;
  position?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  salary?: number;
  contractEndDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bankAccount?: string;
  taxNumber?: string;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface EmployeeFilters {
  department?: string;
  status?: string;
  employmentType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePayrollData {
  employeeId: string;
  period: string;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  overtime?: number;
  notes?: string;
}

export interface PayrollFilters {
  employeeId?: string;
  period?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AttendanceFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface MarkAttendanceData {
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';
  notes?: string;
}

export const employeesApi = {
  async getEmployees(filters?: EmployeeFilters) {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.employmentType) params.append('employmentType', filters.employmentType);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<{
      employees: Employee[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/employees?${params.toString()}`);
    return response;
  },

  async getEmployeeById(id: string) {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response;
  },

  async createEmployee(data: CreateEmployeeData) {
    const response = await api.post<Employee>('/employees', data);
    return response;
  },

  async updateEmployee(id: string, data: UpdateEmployeeData) {
    const response = await api.put<Employee>(`/employees/${id}`, data);
    return response;
  },

  async deleteEmployee(id: string) {
    const response = await api.delete<{ message: string }>(`/employees/${id}`);
    return response;
  },

  async getEmployeeStats() {
    const response = await api.get<{
      total: number;
      active: number;
      onLeave: number;
      byDepartment: { department: string; _count: number }[];
      byEmploymentType: { employmentType: string; _count: number }[];
    }>('/employees/stats');
    return response;
  },

  async getPayrolls(filters?: PayrollFilters) {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<{
      payrolls: Payroll[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/employees/payroll/list?${params.toString()}`);
    return response;
  },

  async createPayroll(data: CreatePayrollData) {
    const response = await api.post<Payroll>('/employees/payroll', data);
    return response;
  },

  async updatePayrollStatus(id: string, status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED') {
    const response = await api.put<Payroll>(`/employees/payroll/${id}/status`, { status });
    return response;
  },

  async getAttendance(filters?: AttendanceFilters) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<{
      attendance: Attendance[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/employees/attendance/list?${params.toString()}`);
    return response;
  },

  async markAttendance(data: MarkAttendanceData) {
    const response = await api.post<Attendance>('/employees/attendance', data);
    return response;
  },
};

export default employeesApi;
