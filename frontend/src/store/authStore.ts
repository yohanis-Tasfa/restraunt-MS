import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
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
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  setAuth: (user, token) => {
    console.log('Setting auth:', { user, token });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  
  updateUser: (updates) => {
    const { user } = get();
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
  
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/admin/login';
  },
  
  hasRole: (roles) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role.name);
  },
}));
