import apiClient from './client';

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
}

export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    try {
      const res: any = await apiClient.get('/suppliers');
      return res.data || res || [];
    } catch {
      return [];
    }
  },
};

export default suppliersApi;

