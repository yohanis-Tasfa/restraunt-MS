import api from './client';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  branch?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  restaurant?: {
    id: string;
    name: string;
    logo?: string;
  };
  employee?: {
    id: string;
    employeeCode: string;
    department: string;
    position: string;
    employmentType: string;
    salary: number;
    hireDate: string;
    status: string;
  };
  statistics: {
    totalOrders: number;
    totalExpenses: number;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const profileApi = {
  // Get current user profile
  async getProfile() {
    const response = await api.get<UserProfile>('/profile');
    return response;
  },

  // Update profile information
  async updateProfile(data: UpdateProfileData) {
    const response = await api.put<UserProfile>('/profile', data);
    return response;
  },

  // Change password
  async changePassword(data: ChangePasswordData) {
    const response = await api.post<{ message: string }>('/profile/change-password', data);
    return response;
  },

  // Upload profile picture
  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await api.post<{ id: string; profilePicture: string }>(
      '/profile/picture',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  },

  // Get activity log
  async getActivityLog(limit: number = 10) {
    const response = await api.get<ActivityLog[]>(`/profile/activity?limit=${limit}`);
    return response;
  },
};

export default profileApi;
