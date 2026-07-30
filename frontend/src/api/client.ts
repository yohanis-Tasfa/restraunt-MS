import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors & extract data
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract data from response.data.data (backend ApiResponse format)
    return response.data.data ? response.data : response;
  },
  async (error: AxiosError<any>) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Handle different error status codes
    if (error.response?.status === 401) {
      // Unauthorized - token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const api = {
  get: <T>(url: string, params?: any): Promise<T> =>
    apiClient.get(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: any): Promise<T> =>
    apiClient.post(url, data).then((res) => res.data),

  put: <T>(url: string, data?: any): Promise<T> =>
    apiClient.put(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: any): Promise<T> =>
    apiClient.patch(url, data).then((res) => res.data),

  delete: <T>(url: string): Promise<T> =>
    apiClient.delete(url).then((res) => res.data),
};

export default apiClient;
