import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: any;
    };
    restaurant: {
      id: string;
      name: string;
    };
    branch?: {
      id: string;
      name: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // ApiResponse wraps data in { data: {...} }
  },
  
  logout: () => apiClient.post('/auth/logout'),
  
  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
