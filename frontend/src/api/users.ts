import apiClient from './client';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export type UserBranch = Branch;

export interface UserEmployee {
  id: string;
  employeeCode: string;
  position: string;
  department: string;
  salary: number;
  bankAccount?: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  isLocked: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
  role: Role;
  restaurant?: { id: string; name: string };
  branch?: UserBranch | null;
  employee?: UserEmployee | null;
}

export interface CreateUserData {
  email: string;
  username?: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  restaurantId?: string;
  branchId?: string;
  bankAccount?: string;
  salary?: number;
  employeeCode?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  branchId?: string;
  isActive?: boolean;
  isLocked?: boolean;
  bankAccount?: string;
  salary?: number;
  employeeCode?: string;
}

export const usersApi = {
  getAll: async (params?: { search?: string; roleId?: string; status?: string; page?: number; limit?: number }) => {
    const cleanParams: Record<string, any> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.roleId) cleanParams.roleId = params.roleId;
    if (params?.status) cleanParams.status = params.status;
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;

    const res: any = await apiClient.get('/users', { params: cleanParams });
    const payload = res?.data || res;
    const users = Array.isArray(payload) ? payload : (payload?.users || []);
    const pagination = payload?.pagination || { total: users.length, page: 1, limit: 50, pages: 1 };
    return {
      users: users as AppUser[],
      pagination,
    };
  },

  getById: async (id: string) => {
    const res: any = await apiClient.get(`/users/${id}`);
    return (res?.data || res) as AppUser;
  },

  create: async (data: CreateUserData) => {
    const res: any = await apiClient.post('/users', data);
    return res?.data || res;
  },

  update: async (id: string, data: UpdateUserData) => {
    const res: any = await apiClient.put(`/users/${id}`, data);
    return res?.data || res;
  },

  delete: async (id: string) => {
    const res: any = await apiClient.delete(`/users/${id}`);
    return res?.data || res;
  },

  resetPassword: async (id: string, newPassword: string) => {
    const res: any = await apiClient.post(`/users/${id}/reset-password`, { newPassword });
    return res?.data || res;
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'UNLOCKED') => {
    const res: any = await apiClient.patch(`/users/${id}/status`, { status });
    return res?.data || res;
  },

  getAllRoles: async () => {
    const res: any = await apiClient.get('/users/roles/all');
    const data = res?.data || res;
    return (Array.isArray(data) ? data : []) as Role[];
  },

  getBranches: async () => {
    const res: any = await apiClient.get('/branches');
    const data = res?.data || res;
    return (Array.isArray(data) ? data : []) as Branch[];
  },
};
