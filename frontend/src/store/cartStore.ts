import { create } from 'zustand';

// Local type definitions (avoiding imports to prevent cache issues)
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isAvailable: boolean;
  preparationTime?: number;
}

interface MenuVariant {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

interface MenuAddon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface CartAddon {
  addonId: string;
  addon: MenuAddon;
  quantity: number;
  price: number;
}

export interface CartItem {
  id: string; // Unique cart item ID (menuItemId + variantId + addons hash)
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
  variantId?: string;
  variant?: MenuVariant;
  addons: CartAddon[];
  specialInstructions?: string;
  subtotal: number;
}

interface CartStore {
  items: CartItem[];
  
  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  
  // Computed values
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: (taxRate?: number) => number;
  getTotal: (taxRate?: number, discount?: number) => number;
}

// Helper to generate unique cart item ID
const generateCartItemId = (
  menuItemId: string,
  variantId?: string,
  addons?: CartAddon[]
): string => {
  const addonIds = addons?.map(a => `${a.addonId}:${a.quantity}`).sort().join(',') || '';
  return `${menuItemId}:${variantId || 'none'}:${addonIds}`;
};

// Helper to calculate item subtotal
const calculateSubtotal = (
  unitPrice: number,
  quantity: number,
  addons: CartAddon[]
): number => {
  const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
  return (unitPrice + addonsTotal) * quantity;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (newItem) => {
    const cartItemId = generateCartItemId(
      newItem.menuItemId,
      newItem.variantId,
      newItem.addons
    );

    const subtotal = calculateSubtotal(
      newItem.unitPrice,
      newItem.quantity,
      newItem.addons
    );

    set((state) => {
      const existingItemIndex = state.items.findIndex(item => item.id === cartItemId);

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + newItem.quantity;
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: calculateSubtotal(existingItem.unitPrice, newQuantity, existingItem.addons),
        };

        return { items: updatedItems };
      } else {
        // New item, add to cart
        return {
          items: [
            ...state.items,
            {
              ...newItem,
              id: cartItemId,
              subtotal,
            },
          ],
        };
      }
    });
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== itemId),
    }));
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    set((state) => ({
      items: state.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: calculateSubtotal(item.unitPrice, quantity, item.addons),
            }
          : item
      ),
    }));
  },

  updateInstructions: (itemId, instructions) => {
    set((state) => ({
      items: state.items.map(item =>
        item.id === itemId
          ? { ...item, specialInstructions: instructions }
          : item
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0);
  },

  getTax: (taxRate = 0.15) => {
    // Default 15% tax rate (Ethiopian VAT)
    return get().getSubtotal() * taxRate;
  },

  getTotal: (taxRate = 0.15, discount = 0) => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax(taxRate);
    return subtotal + tax - discount;
  },
}));
