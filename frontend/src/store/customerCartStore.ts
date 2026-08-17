import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerCartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export interface CustomerCartData {
  sessionId: string;
  tableId: string;
  tableNumber: string;
  items: CustomerCartItem[];
  total: number;
  guestCount: number;
  timestamp: number;
}

interface CustomerCartStore {
  carts: Record<string, CustomerCartData>; // Key is sessionId
  
  // Set cart data from customer
  setCustomerCart: (sessionId: string, data: CustomerCartData) => void;
  
  // Get cart data for a session
  getCustomerCart: (sessionId: string) => CustomerCartData | null;
  
  // Clear cart after POS processes it
  clearCustomerCart: (sessionId: string) => void;
  
  // Get all active carts (for waiter to see pending orders)
  getActiveCarts: () => CustomerCartData[];
  
  // Clear old carts (older than 2 hours)
  clearOldCarts: () => void;
}

export const useCustomerCartStore = create<CustomerCartStore>()(
  persist(
    (set, get) => ({
      carts: {},

      setCustomerCart: (sessionId, data) => {
        set((state) => ({
          carts: {
            ...state.carts,
            [sessionId]: data,
          },
        }));
      },

      getCustomerCart: (sessionId) => {
        const cart = get().carts[sessionId];
        if (!cart) return null;
        
        // Check if cart is still valid (less than 2 hours old)
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        if (cart.timestamp < twoHoursAgo) {
          get().clearCustomerCart(sessionId);
          return null;
        }
        
        return cart;
      },

      clearCustomerCart: (sessionId) => {
        set((state) => {
          const newCarts = { ...state.carts };
          delete newCarts[sessionId];
          return { carts: newCarts };
        });
      },

      getActiveCarts: () => {
        const carts = get().carts;
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        
        return Object.values(carts).filter((cart) => cart.timestamp >= twoHoursAgo);
      },

      clearOldCarts: () => {
        const carts = get().carts;
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        
        const activeCarts = Object.entries(carts).reduce((acc, [sessionId, cart]) => {
          if (cart.timestamp >= twoHoursAgo) {
            acc[sessionId] = cart;
          }
          return acc;
        }, {} as Record<string, CustomerCartData>);
        
        set({ carts: activeCarts });
      },
    }),
    {
      name: 'customer-cart-storage',
    }
  )
);
