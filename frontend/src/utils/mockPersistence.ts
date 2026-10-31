import type { PurchaseOrder, POStatus } from '../api/purchaseOrders';
import type { Expense } from '../api/expenses';
import type { InventoryItem } from '../api/inventory';

export interface PredefinedIngredient {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
  category: string;
}

export const PREDEFINED_INGREDIENTS: PredefinedIngredient[] = [
  { id: 'ing-1', name: 'Teff Flour Grade-1 (White)', unit: 'kg', defaultPrice: 130, category: 'Grains' },
  { id: 'ing-2', name: 'Berbere Special Spice Blend', unit: 'kg', defaultPrice: 260, category: 'Spices' },
  { id: 'ing-3', name: 'Beef Shank & Ribeye (Tibs Cut)', unit: 'kg', defaultPrice: 450, category: 'Meat' },
  { id: 'ing-4', name: 'Lean Beef Top-Round (Kitfo Cut)', unit: 'kg', defaultPrice: 400, category: 'Meat' },
  { id: 'ing-5', name: 'Niter Kibbeh (Clarified Butter)', unit: 'kg', defaultPrice: 600, category: 'Dairy' },
  { id: 'ing-6', name: 'Ayib (Traditional Cottage Cheese)', unit: 'kg', defaultPrice: 120, category: 'Dairy' },
  { id: 'ing-7', name: 'Fresh Red Onions (Habesha Shinkurt)', unit: 'kg', defaultPrice: 65, category: 'Produce' },
  { id: 'ing-8', name: 'Fresh Ripe Tomatoes', unit: 'kg', defaultPrice: 50, category: 'Produce' },
  { id: 'ing-9', name: 'Cooking Oil (Pure Sunflower)', unit: 'L', defaultPrice: 180, category: 'Oils' },
  { id: 'ing-10', name: 'Sidama Washed Coffee Beans', unit: 'kg', defaultPrice: 380, category: 'Beverages' },
  { id: 'ing-11', name: 'Ambo Sparkling Mineral Water', unit: 'bottle', defaultPrice: 35, category: 'Beverages' },
  { id: 'ing-12', name: 'St. George Draft Bottles (500ml)', unit: 'bottle', defaultPrice: 40, category: 'Beverages' },
  { id: 'ing-13', name: 'Mitmita Hot Chili Blend', unit: 'kg', defaultPrice: 280, category: 'Spices' },
  { id: 'ing-14', name: 'Garlic (Nech Shinkurt)', unit: 'kg', defaultPrice: 140, category: 'Produce' },
  { id: 'ing-15', name: 'Korarima (Cardamom Seed)', unit: 'kg', defaultPrice: 420, category: 'Spices' },
];

export const INITIAL_MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-item-1',
    name: 'Teff Flour Grade-1 (White)',
    description: 'High-quality export grade white teff flour from Debre Zeit',
    sku: 'ING-TEFF-01',
    category: 'Grains',
    quantity: 200,
    minQuantity: 50,
    maxQuantity: 500,
    cost: 130.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-2',
    name: 'Berbere Special Spice Blend',
    description: 'Authentic 16-spice blend sun-dried and pounded',
    sku: 'ING-BERB-02',
    category: 'Spices',
    quantity: 25,
    minQuantity: 10,
    maxQuantity: 100,
    cost: 260.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-3',
    name: 'Beef Shank & Ribeye (Tibs Cut)',
    description: 'Fresh local beef cuts for sizzling shekla tibs',
    sku: 'ING-BEEF-03',
    category: 'Meat',
    quantity: 15, // Currently low stock (min is 30)
    minQuantity: 30,
    maxQuantity: 200,
    cost: 450.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-4',
    name: 'Lean Beef Top-Round (Kitfo Cut)',
    description: 'Ultra-lean tender cut prepared daily for kitfo special',
    sku: 'ING-BEEF-04',
    category: 'Meat',
    quantity: 10, // Currently low stock (min is 25)
    minQuantity: 25,
    maxQuantity: 150,
    cost: 400.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-5',
    name: 'Niter Kibbeh (Clarified Butter)',
    description: 'Traditional spiced clarified butter with korarima and koseret',
    sku: 'ING-BUTT-05',
    category: 'Dairy',
    quantity: 8, // Currently low stock (min is 15)
    minQuantity: 15,
    maxQuantity: 80,
    cost: 600.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-6',
    name: 'Ayib (Traditional Cottage Cheese)',
    description: 'Fresh homemade curd cheese for kitfo and fasting platters',
    sku: 'ING-AYIB-06',
    category: 'Dairy',
    quantity: 12, // Low stock (min is 20)
    minQuantity: 20,
    maxQuantity: 100,
    cost: 120.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-7',
    name: 'Ambo Sparkling Mineral Water',
    description: '330ml glass bottles direct from Senkele springs',
    sku: 'BEV-AMBO-07',
    category: 'Beverages',
    quantity: 200,
    minQuantity: 50,
    maxQuantity: 500,
    cost: 35.0,
    unit: 'bottle',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-8',
    name: 'St. George Draft Bottles (500ml)',
    description: 'Standard beer crate bottles',
    sku: 'BEV-STG-08',
    category: 'Beverages',
    quantity: 180,
    minQuantity: 50,
    maxQuantity: 400,
    cost: 40.0,
    unit: 'bottle',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-9',
    name: 'Fresh Red Onions (Habesha Shinkurt)',
    description: 'Essential cooking base for all traditional wats',
    sku: 'ING-ONION-09',
    category: 'Produce',
    quantity: 35,
    minQuantity: 20,
    maxQuantity: 150,
    cost: 65.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-item-10',
    name: 'Sidama Washed Coffee Beans',
    description: 'Single origin Grade-1 coffee beans for traditional jebena ceremony',
    sku: 'BEV-COFF-10',
    category: 'Beverages',
    quantity: 18,
    minQuantity: 10,
    maxQuantity: 80,
    cost: 380.0,
    unit: 'kg',
    branchId: 'branch-1',
    expiryDate: new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_MOCK_POS: PurchaseOrder[] = [
  {
    id: 'po-101',
    orderNumber: 'PO-2026-0042',
    supplierId: 'sup-1',
    supplier: {
      id: 'sup-1',
      name: 'Addis Agri-Wholesale & Grain Trading',
      phone: '+251 911 234 567',
      contactPerson: 'Mulugeta Tadesse',
    },
    status: 'RECEIVED',
    subtotal: 32500.0,
    tax: 0,
    total: 32500.0,
    expectedDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    receivedDate: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    notes: 'Grade-1 White Teff & Spices for Main Branch kitchen',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'poi-1',
        purchaseOrderId: 'po-101',
        inventoryId: 'ing-1',
        quantity: 200,
        receivedQty: 200,
        price: 130.0,
        subtotal: 26000.0,
        inventory: { id: 'ing-1', name: 'Teff Flour Grade-1 (White)', unit: 'kg' },
      },
      {
        id: 'poi-2',
        purchaseOrderId: 'po-101',
        inventoryId: 'ing-2',
        quantity: 25,
        receivedQty: 25,
        price: 260.0,
        subtotal: 6500.0,
        inventory: { id: 'ing-2', name: 'Berbere Special Spice Blend', unit: 'kg' },
      },
    ],
  },
  {
    id: 'po-102',
    orderNumber: 'PO-2026-0043',
    supplierId: 'sup-2',
    supplier: {
      id: 'sup-2',
      name: 'Abyssinia Premium Butchery Co.',
      phone: '+251 922 456 789',
      contactPerson: 'Dawit Bekele',
    },
    status: 'APPROVED',
    subtotal: 48000.0,
    tax: 0,
    total: 48000.0,
    expectedDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    notes: 'Prime Grade Beef (Tibs & Kitfo) - Weekend rush preparation',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'poi-3',
        purchaseOrderId: 'po-102',
        inventoryId: 'ing-3',
        quantity: 80,
        receivedQty: 0,
        price: 450.0,
        subtotal: 36000.0,
        inventory: { id: 'ing-3', name: 'Beef Shank & Ribeye (Tibs Cut)', unit: 'kg' },
      },
      {
        id: 'poi-4',
        purchaseOrderId: 'po-102',
        inventoryId: 'ing-4',
        quantity: 30,
        receivedQty: 0,
        price: 400.0,
        subtotal: 12000.0,
        inventory: { id: 'ing-4', name: 'Lean Beef Top-Round (Kitfo Cut)', unit: 'kg' },
      },
    ],
  },
  {
    id: 'po-103',
    orderNumber: 'PO-2026-0044',
    supplierId: 'sup-3',
    supplier: {
      id: 'sup-3',
      name: 'Rift Valley Fresh Dairy & Butter',
      phone: '+251 933 789 012',
      contactPerson: 'Genet Alemu',
    },
    status: 'SUBMITTED',
    subtotal: 16800.0,
    tax: 0,
    total: 16800.0,
    expectedDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    notes: 'Pure Cow Clarified Butter (Niter Kibbeh) & Fresh Ayib Cheese',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'poi-5',
        purchaseOrderId: 'po-103',
        inventoryId: 'ing-5',
        quantity: 20,
        receivedQty: 0,
        price: 600.0,
        subtotal: 12000.0,
        inventory: { id: 'ing-5', name: 'Niter Kibbeh (Clarified Butter)', unit: 'kg' },
      },
      {
        id: 'poi-6',
        purchaseOrderId: 'po-103',
        inventoryId: 'ing-6',
        quantity: 40,
        receivedQty: 0,
        price: 120.0,
        subtotal: 4800.0,
        inventory: { id: 'ing-6', name: 'Ayib (Traditional Cottage Cheese)', unit: 'kg' },
      },
    ],
  },
  {
    id: 'po-104',
    orderNumber: 'PO-2026-0045',
    supplierId: 'sup-4',
    supplier: {
      id: 'sup-4',
      name: 'Ambo Beverage Distributors',
      phone: '+251 944 321 654',
      contactPerson: 'Kassahun Worku',
    },
    status: 'RECEIVED',
    subtotal: 14200.0,
    tax: 0,
    total: 14200.0,
    expectedDate: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    receivedDate: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    notes: 'Ambo Mineral Water (Glass Bottles) and St. George Beers',
    createdAt: new Date(Date.now() - 110 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'poi-7',
        purchaseOrderId: 'po-104',
        inventoryId: 'ing-11',
        quantity: 200,
        receivedQty: 200,
        price: 35.0,
        subtotal: 7000.0,
        inventory: { id: 'ing-11', name: 'Ambo Sparkling Mineral Water', unit: 'bottle' },
      },
      {
        id: 'poi-8',
        purchaseOrderId: 'po-104',
        inventoryId: 'ing-12',
        quantity: 180,
        receivedQty: 180,
        price: 40.0,
        subtotal: 7200.0,
        inventory: { id: 'ing-12', name: 'St. George Draft Bottles (500ml)', unit: 'bottle' },
      },
    ],
  },
];

export const INITIAL_MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'Ingredients',
    amount: 32500.0,
    description: 'Auto-recorded: PO #PO-2026-0042 received from Addis Agri-Wholesale (Teff Flour & Berbere)',
    reference: 'PO-2026-0042',
    date: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-2',
    category: 'Ingredients',
    amount: 14200.0,
    description: 'Auto-recorded: PO #PO-2026-0045 received from Ambo Beverage (Mineral Water & Beers)',
    reference: 'PO-2026-0045',
    date: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-3',
    category: 'Payroll',
    amount: 12500.0,
    description: 'Salary Payout: Sara Wolde (Head Waiter - October 2026)',
    reference: 'PAY-10492',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-4',
    category: 'Payroll',
    amount: 14000.0,
    description: 'Salary Payout: Yonas Kebede (Lead Line Cook - October 2026)',
    reference: 'PAY-10493',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-5',
    category: 'Rent',
    amount: 45000.0,
    description: 'Monthly Premises Lease - Bole Main Branch Building',
    reference: 'LEASE-OCT-26',
    date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-6',
    category: 'Utilities',
    amount: 6850.0,
    description: 'Commercial Electricity & Water Utility Bill (EEU / AAWSA)',
    reference: 'UTIL-AA-991',
    date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
];

const STORAGE_KEYS = {
  PURCHASE_ORDERS: 'rms_purchase_orders',
  EXPENSES: 'rms_expenses',
  INVENTORY: 'rms_inventory_items',
};

// 1. Purchase Orders Persistence
export function getStoredPurchaseOrders(): PurchaseOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored purchase orders:', e);
  }
  localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(INITIAL_MOCK_POS));
  return INITIAL_MOCK_POS;
}

export function saveStoredPurchaseOrders(pos: PurchaseOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
    window.dispatchEvent(new Event('rms_storage_change'));
  } catch (e) {
    console.warn('Failed to save purchase orders to localStorage:', e);
  }
}

// 2. Inventory Items Persistence
export function getStoredInventoryItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored inventory items:', e);
  }
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_MOCK_INVENTORY));
  return INITIAL_MOCK_INVENTORY;
}

export function saveStoredInventoryItems(items: InventoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
    window.dispatchEvent(new Event('rms_storage_change'));
  } catch (e) {
    console.warn('Failed to save inventory to localStorage:', e);
  }
}

// 3. Increment Inventory Stock from Received PO
export function incrementInventoryStockFromPO(po: PurchaseOrder): InventoryItem[] {
  const currentItems = getStoredInventoryItems();
  const updatedItems = [...currentItems];

  (po.items || []).forEach((item) => {
    const itemName = (item.inventory?.name || '').trim().toLowerCase();
    
    // Find matching inventory item by name or id
    const matchIdx = updatedItems.findIndex((inv) => {
      if (inv.id === item.inventoryId) return true;
      if (inv.name.trim().toLowerCase() === itemName) return true;
      // Partial matching (e.g. Teff Flour or Beef Shank)
      if (itemName && (inv.name.toLowerCase().includes(itemName) || itemName.includes(inv.name.toLowerCase()))) {
        return true;
      }
      return false;
    });

    if (matchIdx >= 0) {
      const existing = updatedItems[matchIdx];
      updatedItems[matchIdx] = {
        ...existing,
        quantity: Math.round((existing.quantity + Number(item.quantity)) * 100) / 100,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Create new inventory item if not already in catalog
      const newItem: InventoryItem = {
        id: `inv-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.inventory?.name || 'Procured Ingredient',
        description: `Delivered via PO ${po.orderNumber}`,
        sku: `ING-${(item.inventory?.name || 'ITEM').substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        category: 'General',
        quantity: Number(item.quantity),
        minQuantity: Math.max(10, Math.round(Number(item.quantity) * 0.2)),
        maxQuantity: Number(item.quantity) * 5,
        cost: Number(item.price),
        unit: item.inventory?.unit || 'kg',
        branchId: 'branch-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedItems.unshift(newItem);
    }
  });

  saveStoredInventoryItems(updatedItems);
  return updatedItems;
}

// 4. Expenses Persistence
export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored expenses:', e);
  }
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_MOCK_EXPENSES));
  return INITIAL_MOCK_EXPENSES;
}

export function saveStoredExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    window.dispatchEvent(new Event('rms_storage_change'));
  } catch (e) {
    console.warn('Failed to save expenses to localStorage:', e);
  }
}

// 5. Auto-record Expense when PO is Received
export function recordExpenseFromReceivedPO(po: PurchaseOrder, user?: any): Expense {
  const currentExpenses = getStoredExpenses();
  
  // Check if expense with this reference already exists
  const existingIdx = currentExpenses.findIndex(
    (e) => e.reference === po.orderNumber && e.category === 'Ingredients'
  );

  const itemsSummary = po.items && po.items.length > 0
    ? po.items.map((i) => `${i.inventory?.name || 'Item'} (${i.quantity} ${i.inventory?.unit || 'unit'})`).join(', ')
    : 'Kitchen Stock Procurement';

  const newExpense: Expense = {
    id: `exp-po-${po.id}-${Date.now()}`,
    category: 'Ingredients',
    amount: po.total,
    description: `Auto-recorded: PO #${po.orderNumber} received from ${po.supplier?.name || 'Supplier'} (${itemsSummary})`,
    reference: po.orderNumber,
    date: new Date().toISOString(),
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      id: user?.id || 'usr-1',
      firstName: user?.firstName || 'Solomon',
      lastName: user?.lastName || 'Kassa',
      email: user?.email || 'manager@rms.com',
    },
  };

  let updatedExpenses: Expense[];
  if (existingIdx >= 0) {
    updatedExpenses = [...currentExpenses];
    updatedExpenses[existingIdx] = newExpense;
  } else {
    // Put at the very beginning of the list
    updatedExpenses = [newExpense, ...currentExpenses];
  }

  saveStoredExpenses(updatedExpenses);
  return newExpense;
}
