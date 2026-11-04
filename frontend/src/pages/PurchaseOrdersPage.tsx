import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ShoppingCart,
  Plus,
  Search,
  PackageCheck,
  Clock,
  CheckCircle2,
  CheckCircle,
  Truck,
  Building2,
  Calendar,
  X,
  DollarSign,
  Trash2,
} from 'lucide-react';
import purchaseOrdersApi, {
  type PurchaseOrder,
  type POStatus,
} from '../api/purchaseOrders';
import suppliersApi, { type Supplier } from '../api/suppliers';
import inventoryApi from '../api/inventory';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  PREDEFINED_INGREDIENTS,
  getStoredPurchaseOrders,
  saveStoredPurchaseOrders,
  recordExpenseFromReceivedPO,
  incrementInventoryStockFromPO,
  type PredefinedIngredient,
} from '../utils/mockPersistence';

interface FormItem {
  id: string;
  inventoryId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  isCustom?: boolean;
}

export default function PurchaseOrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Persistent orders from localStorage
  const [ordersList, setOrdersList] = useState<PurchaseOrder[]>(() => getStoredPurchaseOrders());

  // Modals
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<PurchaseOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New PO Form State
  const [newPoSupplierId, setNewPoSupplierId] = useState('');
  const [newPoNotes, setNewPoNotes] = useState('');
  const [newPoExpectedDate, setNewPoExpectedDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  });

  const [formItems, setFormItems] = useState<FormItem[]>([
    {
      id: 'row-1',
      inventoryId: 'ing-1',
      name: 'Teff Flour Grade-1 (White)',
      quantity: 50,
      price: 130,
      unit: 'kg',
      isCustom: false,
    },
  ]);

  // Sync with storage events (e.g. across tabs or routes)
  useEffect(() => {
    const handleStorageChange = () => {
      setOrdersList(getStoredPurchaseOrders());
    };
    window.addEventListener('rms_storage_change', handleStorageChange);
    return () => window.removeEventListener('rms_storage_change', handleStorageChange);
  }, []);

  // Fetch real purchase orders from backend if available
  const { data: posData, isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders', selectedStatus],
    queryFn: async () => {
      try {
        const res = await purchaseOrdersApi.getAll({
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        });
        if (res?.data && res.data.length > 0) {
          return res.data;
        }
        return null;
      } catch {
        return null;
      }
    },
  });

  // Fetch suppliers list
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
  });

  // Effective suppliers list
  const suppliers: Supplier[] =
    suppliersData && suppliersData.length > 0
      ? suppliersData
      : [
        {
          id: 'sup-1',
          name: 'Addis Agri-Wholesale & Grain Trading',
          phone: '+251 911 234 567',
          contactPerson: 'Mulugeta Tadesse',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sup-2',
          name: 'Abyssinia Premium Butchery Co.',
          phone: '+251 922 456 789',
          contactPerson: 'Dawit Bekele',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sup-3',
          name: 'Rift Valley Fresh Dairy & Butter',
          phone: '+251 933 789 012',
          contactPerson: 'Genet Alemu',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sup-4',
          name: 'Ambo Beverage Distributors',
          phone: '+251 944 321 654',
          contactPerson: 'Kassahun Worku',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

  // Fetch inventory items for ingredient options
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-dropdown'],
    queryFn: () => inventoryApi.getAll({ limit: 100 }),
  });

  const availableIngredients: PredefinedIngredient[] =
    inventoryData?.items && inventoryData.items.length > 0
      ? inventoryData.items.map((inv: any) => ({
        id: inv.id,
        name: inv.name,
        unit: inv.unit || 'unit',
        defaultPrice: inv.costPrice || 100,
        category: inv.category || 'General',
      }))
      : PREDEFINED_INGREDIENTS;

  // Effective orders list
  const activeOrders = posData && posData.length > 0 ? posData : ordersList;

  const filteredOrders = activeOrders
    .filter((order) => {
      if (selectedStatus !== 'ALL' && order.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNum = order.orderNumber.toLowerCase().includes(q);
        const matchesSup = order.supplier?.name.toLowerCase().includes(q);
        const matchesNotes = order.notes?.toLowerCase().includes(q);
        const matchesItem = order.items?.some((i) =>
          i.inventory?.name.toLowerCase().includes(q)
        );
        if (!matchesNum && !matchesSup && !matchesNotes && !matchesItem) return false;
      }
      return true;
    });

  // Summary Metrics
  const totalProcuredAmount = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = activeOrders.filter((o) => o.status === 'SUBMITTED');
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.total, 0);
  const approvedOrders = activeOrders.filter((o) => o.status === 'APPROVED');
  const approvedAmount = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  const receivedOrders = activeOrders.filter((o) => o.status === 'RECEIVED');
  const receivedAmount = receivedOrders.reduce((sum, o) => sum + o.total, 0);

  // Form Item Handlers
  const handleAddItemRow = () => {
    const nextId = `row-${Date.now()}-${formItems.length + 1}`;
    setFormItems((prev) => [
      ...prev,
      {
        id: nextId,
        inventoryId: availableIngredients[0]?.id || 'ing-1',
        name: availableIngredients[0]?.name || 'Teff Flour Grade-1 (White)',
        quantity: 10,
        price: availableIngredients[0]?.defaultPrice || 100,
        unit: availableIngredients[0]?.unit || 'kg',
        isCustom: false,
      },
    ]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (formItems.length <= 1) {
      toast.error('Order must contain at least one item');
      return;
    }
    setFormItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleIngredientChange = (rowId: string, ingredientId: string) => {
    if (ingredientId === '__custom__') {
      setFormItems((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
              ...row,
              inventoryId: '__custom__',
              name: '',
              unit: 'kg',
              price: 100,
              isCustom: true,
            }
            : row
        )
      );
      return;
    }

    const matched = availableIngredients.find((i) => i.id === ingredientId);
    if (!matched) return;

    setFormItems((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
            ...row,
            inventoryId: matched.id,
            name: matched.name,
            unit: matched.unit,
            price: matched.defaultPrice,
            isCustom: false,
          }
          : row
      )
    );
  };

  const handleFieldChange = (
    rowId: string,
    field: 'name' | 'quantity' | 'price' | 'unit',
    value: any
  ) => {
    setFormItems((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const estimatedTotal = formItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );

  // 1. Create Purchase Order (with status: 'SUBMITTED' or 'APPROVED')
  const handleSavePurchaseOrder = async (targetStatus: 'SUBMITTED' | 'APPROVED') => {
    if (!newPoSupplierId) {
      toast.error('Please select a supplier');
      return;
    }
    for (const it of formItems) {
      if (!it.name.trim()) {
        toast.error('Please specify an item name for all order rows');
        return;
      }
      if (it.quantity <= 0) {
        toast.error('Quantity must be greater than zero');
        return;
      }
      if (it.price < 0) {
        toast.error('Price cannot be negative');
        return;
      }
    }

    const selectedSup = suppliers.find((s) => s.id === newPoSupplierId) || suppliers[0];
    const subtotal = estimatedTotal;
    const poNumber = `PO-2026-00${ordersList.length + 43}`;

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber: poNumber,
      supplierId: selectedSup.id,
      supplier: {
        id: selectedSup.id,
        name: selectedSup.name,
        phone: selectedSup.phone,
        contactPerson: selectedSup.contactPerson,
      },
      status: targetStatus,
      subtotal,
      tax: 0,
      total: subtotal,
      notes: newPoNotes || 'Kitchen Restocking Procurement Order',
      expectedDate: newPoExpectedDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: formItems.map((item, idx) => ({
        id: `poi-${Date.now()}-${idx}`,
        purchaseOrderId: `po-${Date.now()}`,
        inventoryId: item.inventoryId === '__custom__' ? `cust-${idx}` : item.inventoryId,
        quantity: Number(item.quantity),
        receivedQty: 0,
        price: Number(item.price),
        subtotal: Number(item.quantity) * Number(item.price),
        inventory: {
          id: item.inventoryId,
          name: item.name,
          unit: item.unit,
        },
      })),
    };

    const updated = [newOrder, ...ordersList];
    setOrdersList(updated);
    saveStoredPurchaseOrders(updated);

    if (targetStatus === 'APPROVED') {
      toast.success(`Purchase Order ${poNumber} created and Approved!`);
    } else {
      toast.success(`Purchase Order ${poNumber} submitted for approval.`);
    }

    setIsCreateModalOpen(false);
    setNewPoNotes('');
    setFormItems([
      {
        id: 'row-1',
        inventoryId: availableIngredients[0]?.id || 'ing-1',
        name: availableIngredients[0]?.name || 'Teff Flour Grade-1 (White)',
        quantity: 50,
        price: availableIngredients[0]?.defaultPrice || 130,
        unit: availableIngredients[0]?.unit || 'kg',
        isCustom: false,
      },
    ]);

    // Backend sync attempt
    try {
      await purchaseOrdersApi.create({
        supplierId: selectedSup.id,
        items: formItems.map((item) => ({
          inventoryId: item.inventoryId === '__custom__' ? 'ing-1' : item.inventoryId,
          quantity: item.quantity,
          price: item.price,
        })),
        notes: newPoNotes,
      });
      refetch();
    } catch {
      // Offline/local persistence active
    }
  };

  // 2. Approve Purchase Order
  const handleConfirmApproval = async () => {
    if (!approvingOrder) return;
    setIsSubmitting(true);

    const targetId = approvingOrder.id;
    const targetOrderNumber = approvingOrder.orderNumber;

    const updated = ordersList.map((po) =>
      po.id === targetId ? { ...po, status: 'APPROVED' as POStatus, updatedAt: new Date().toISOString() } : po
    );
    setOrdersList(updated);
    saveStoredPurchaseOrders(updated);

    toast.success(`Purchase Order ${targetOrderNumber} approved! Ready for supplier shipment.`);
    setApprovingOrder(null);
    setIsSubmitting(false);

    try {
      await purchaseOrdersApi.updateStatus(targetId, 'APPROVED');
      refetch();
    } catch {
      // Local state preserved
    }
  };

  // 3. Receive Goods & Auto-Log Expense
  const handleConfirmReceive = async () => {
    if (!receivingOrder) return;
    setIsSubmitting(true);

    const targetId = receivingOrder.id;
    const targetTotal = receivingOrder.total;
    const targetOrderNum = receivingOrder.orderNumber;
    const nowIso = new Date().toISOString();

    // 1. Update PO status to RECEIVED with receivedDate
    const updated = ordersList.map((po) =>
      po.id === targetId
        ? {
          ...po,
          status: 'RECEIVED' as POStatus,
          receivedDate: nowIso,
          updatedAt: nowIso,
          items: po.items?.map((it) => ({ ...it, receivedQty: it.quantity })),
        }
        : po
    );
    setOrdersList(updated);
    saveStoredPurchaseOrders(updated);

    // 2. Increment stock in Inventory (rms_inventory_items)
    incrementInventoryStockFromPO(receivingOrder);

    // 3. Auto-record expense into localStorage (rms_expenses)
    recordExpenseFromReceivedPO(receivingOrder, user);

    toast.success(
      `Shipment for ${targetOrderNum} received!\nStock incremented in Inventory & Br ${targetTotal.toLocaleString()} logged to Expenses.`,
      { duration: 4000 }
    );

    setReceivingOrder(null);
    setIsSubmitting(false);

    // 3. Sync to backend API if active
    try {
      const itemsPayload = (receivingOrder.items || []).map((item) => ({
        itemId: item.id,
        receivedQty: item.quantity,
      }));
      await purchaseOrdersApi.receiveGoods(targetId, itemsPayload);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch {
      // Local persistence intact
    }
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Received
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50">
            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Approved
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Submitted
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#143225]">
            Draft
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Purchase Orders & Procurement
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Order raw ingredients from suppliers, approve orders, receive stock, and track expenses.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#091a13] rounded-xl border border-gray-200 dark:border-[#143225] shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Procured</span>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-[#00e676] tracking-tight">
            Br {totalProcuredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{activeOrders.length} total purchase orders</p>
        </div>

        <div className="bg-white dark:bg-[#091a13] rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Pending Approval</span>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-400 tracking-tight">
            Br {pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">{pendingOrders.length} orders awaiting manager approval</p>
        </div>

        <div className="bg-white dark:bg-[#091a13] rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">Approved (In Transit)</span>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-400 tracking-tight">
            Br {approvedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">{approvedOrders.length} orders ready to receive</p>
        </div>

        <div className="bg-white dark:bg-[#091a13] rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-[#00e676]">Received & Expensed</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-[#00e676]">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-[#00e676] tracking-tight">
            Br {receivedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">{receivedOrders.length} received into inventory & P&L</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#091a13] rounded-xl border border-gray-200 dark:border-[#143225] shadow-2xs overflow-hidden">
        {/* Compact In-Table Toolbar */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-[#143225] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#091a13]">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PO #, supplier, items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50 dark:bg-[#071a12] text-gray-900 dark:text-white hover:bg-white dark:hover:bg-[#0a2016] transition-colors"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-[#071a12] font-medium text-gray-700 dark:text-gray-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted (Pending Approval)</option>
              <option value="APPROVED">Approved (Awaiting Delivery)</option>
              <option value="RECEIVED">Received & Expensed</option>
              <option value="DRAFT">Draft</option>
            </select>

            {(selectedStatus !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSearchTerm('');
                }}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 hover:bg-gray-100 dark:hover:bg-[#0c2219] rounded-md transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {filteredOrders.length} orders
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 dark:bg-[#071a12] border-b border-gray-200 dark:border-[#143225] text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">PO Number & Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Ingredients Ordered</th>
                <th className="py-3 px-4 text-right">Total (Br)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143225] text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No purchase orders match your filter criteria
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/80 dark:hover:bg-[#0c2f21]/30 transition-colors">
                    {/* PO Number & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{po.orderNumber}</div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(po.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{po.supplier?.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        {po.supplier?.phone || po.supplier?.contactPerson || 'Verified Supplier'}
                      </div>
                    </td>

                    {/* Ingredients Ordered */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {po.items?.map((item) => (
                          <div key={item.id} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-medium text-gray-900 dark:text-gray-200">{item.inventory?.name || 'Item'}</span>
                            <span className="text-gray-400 dark:text-gray-500 font-mono text-[11px]">
                              ({item.quantity} {item.inventory?.unit || 'unit'} @ Br {item.price})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-black text-gray-900 dark:text-[#00e676] text-sm sm:text-base">
                      Br {po.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">{getStatusBadge(po.status)}</td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {po.status === 'SUBMITTED' || po.status === 'DRAFT' ? (
                        <button
                          onClick={() => setApprovingOrder(po)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-102"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve PO</span>
                        </button>
                      ) : po.status === 'APPROVED' ? (
                        <button
                          onClick={() => setReceivingOrder(po)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-102"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive Goods</span>
                        </button>
                      ) : po.status === 'RECEIVED' ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Received</span>
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            {po.receivedDate ? format(new Date(po.receivedDate), 'MMM dd, HH:mm') : 'Logged in Expenses'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Approve PO Modal */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#143225] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-blue-700 dark:bg-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-sm">Approve Purchase Order</h3>
              </div>
              <button
                onClick={() => setApprovingOrder(null)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 dark:hover:bg-blue-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50 dark:bg-[#092233] border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-950 dark:text-blue-200 text-sm">PO #{approvingOrder.orderNumber}</span>
                  <span className="font-mono font-black text-blue-900 dark:text-[#00e676] text-base">
                    Br {approvingOrder.total.toLocaleString()}
                  </span>
                </div>
                <p className="text-blue-800 dark:text-blue-300">
                  Supplier: <strong className="text-blue-950 dark:text-white">{approvingOrder.supplier?.name}</strong>
                </p>
                {approvingOrder.notes && (
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] italic">Note: {approvingOrder.notes}</p>
                )}
              </div>

              <div>
                <span className="font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-[10px]">
                  Items to be Approved:
                </span>
                <div className="mt-1 bg-gray-50 dark:bg-[#071a12] rounded-lg p-2.5 border border-gray-200 dark:border-[#143225] space-y-1.5 max-h-40 overflow-y-auto">
                  {approvingOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {item.inventory?.name} ({item.quantity} {item.inventory?.unit})
                      </span>
                      <span className="font-mono font-bold text-gray-900 dark:text-[#00e676]">Br {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#091a13] border-t border-gray-200 dark:border-[#143225] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setApprovingOrder(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmApproval}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Receive Shipment Modal */}
      {receivingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-[#143225] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-700 dark:bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm">Receive Shipment - PO #{receivingOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setReceivingOrder(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 dark:hover:bg-emerald-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50 dark:bg-[#072417] border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">PO #{receivingOrder.orderNumber}</span>
                  <span className="font-mono font-black text-emerald-900 dark:text-[#00e676] text-base">
                    Br {receivingOrder.total.toLocaleString()}
                  </span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300">
                  Supplier: <strong className="text-emerald-950 dark:text-white">{receivingOrder.supplier?.name}</strong>
                </p>
              </div>

              {/* Items Arriving */}
              <div className="space-y-1.5">
                <span className="font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-[10px]">
                  Delivered Items to Stock:
                </span>
                <div className="bg-gray-50 dark:bg-[#071a12] rounded-lg p-3 border border-gray-200 dark:border-[#143225] space-y-2 max-h-52 overflow-y-auto">
                  {receivingOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{item.inventory?.name}</span>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500">
                          {item.quantity} {item.inventory?.unit} @ Br {item.price}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-gray-900 dark:text-[#00e676]">Br {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#091a13] border-t border-gray-200 dark:border-[#143225] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceivingOrder(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReceive}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Confirm Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Create New Purchase Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-[#143225] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gray-900 dark:bg-black/80 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Create New Purchase Order</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Supplier & Expected Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Select Supplier *</label>
                  <select
                    value={newPoSupplierId}
                    onChange={(e) => setNewPoSupplierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white font-medium"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone || 'Supplier'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={newPoExpectedDate}
                    onChange={(e) => setNewPoExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Order Items Header & Add Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Order Items & Quantities *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-[#0c2219] hover:bg-emerald-100 dark:hover:bg-[#123627] text-emerald-700 dark:text-[#00e676] border border-emerald-300 dark:border-[#143225] rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-gray-200 dark:border-[#143225] bg-gray-50/70 dark:bg-[#071a12] space-y-2 hover:border-gray-300 dark:hover:border-[#1a4a35] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 w-5">#{idx + 1}</span>

                        {/* Ingredient Selector */}
                        <div className="flex-1">
                          {!item.isCustom ? (
                            <select
                              value={item.inventoryId}
                              onChange={(e) => handleIngredientChange(item.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-[#143225] rounded-lg bg-white dark:bg-[#091a13] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                            >
                              <optgroup label="Standard Ingredients">
                                {availableIngredients.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.unit})
                                  </option>
                                ))}
                              </optgroup>
                              <option value="__custom__">+ Custom Ingredient (Type Name)...</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="Enter ingredient name..."
                                value={item.name}
                                onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-[#143225] rounded-lg bg-white dark:bg-[#091a13] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleIngredientChange(item.id, availableIngredients[0]?.id || 'ing-1')}
                                className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline whitespace-nowrap cursor-pointer"
                              >
                                Select list
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Row Button */}
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Quantity, Unit, Price, and Subtotal */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              handleFieldChange(item.id, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-[#143225] rounded-lg bg-white dark:bg-[#091a13] text-gray-900 dark:text-white font-mono font-bold text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Unit</label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleFieldChange(item.id, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-[#143225] rounded-lg bg-white dark:bg-[#091a13] text-gray-900 dark:text-white font-medium"
                          >
                            <option value="kg">kg</option>
                            <option value="L">L</option>
                            <option value="bottle">bottle</option>
                            <option value="pcs">pcs</option>
                            <option value="box">box</option>
                            <option value="crate">crate</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Unit Price (Br)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.price || ''}
                            onChange={(e) =>
                              handleFieldChange(item.id, 'price', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-[#143225] rounded-lg bg-white dark:bg-[#091a13] text-gray-900 dark:text-[#00e676] font-mono font-bold text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Subtotal</label>
                          <div className="px-2 py-1.5 bg-gray-100 dark:bg-[#0c2219] rounded-lg text-xs font-mono font-black text-gray-900 dark:text-[#00e676] text-right truncate">
                            Br {((item.quantity || 0) * (item.price || 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Procurement Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Urgent restocking for holiday weekend"
                  value={newPoNotes}
                  onChange={(e) => setNewPoNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-[#071a12] text-gray-900 dark:text-white"
                />
              </div>

              {/* Live Total */}
              <div className="p-3 bg-emerald-50 dark:bg-[#072417] rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex justify-between items-center">
                <span className="font-bold text-emerald-950 dark:text-emerald-200">Estimated Order Total:</span>
                <span className="text-base font-black text-emerald-950 dark:text-[#00e676] font-mono">
                  Br {estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-[#091a13] border-t border-gray-200 dark:border-[#143225] flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePurchaseOrder('SUBMITTED')}
                className="px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Save as Pending Approval
              </button>
              <button
                type="button"
                onClick={() => handleSavePurchaseOrder('APPROVED')}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Approve & Issue PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
