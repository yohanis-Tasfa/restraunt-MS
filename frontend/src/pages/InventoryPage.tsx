import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Package, AlertTriangle, Calendar, TrendingDown, Edit2, Trash2, MoreVertical, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import inventoryApi from '../api/inventory';
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput } from '../api/inventory';
import { useAuthStore } from '../store/authStore';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'all' | 'low-stock' | 'expiring'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Queries
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory', user?.branch?.id, selectedCategory, searchTerm, view],
    queryFn: () => inventoryApi.getAll({
      branchId: user?.branch?.id,
      category: selectedCategory || undefined,
      search: searchTerm || undefined,
      lowStock: view === 'low-stock',
      expiring: view === 'expiring',
    }),
    enabled: !!user?.branch?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ['inventory-categories', user?.branch?.id],
    queryFn: () => inventoryApi.getCategories(user?.branch?.id),
    enabled: !!user?.branch?.id,
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['inventory-low-stock', user?.branch?.id],
    queryFn: async () => {
      const data = await inventoryApi.getLowStock(user?.branch?.id);
      console.log('Low stock items response:', data);
      return data;
    },
    enabled: !!user?.branch?.id,
  });

  const { data: expiringItems } = useQuery({
    queryKey: ['inventory-expiring', user?.branch?.id],
    queryFn: async () => {
      const data = await inventoryApi.getExpiring(user?.branch?.id, 7);
      console.log('Expiring items response:', data);
      return data;
    },
    enabled: !!user?.branch?.id,
  });

  const items = inventoryData?.items || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-expiring'] });
      toast.success('Inventory item created');
      setIsAddModalOpen(false);
    },
    onError: () => toast.error('Failed to create item'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryInput }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-expiring'] });
      toast.success('Inventory item updated');
      setIsEditModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => toast.error('Failed to update item'),
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-expiring'] });
      toast.success('Inventory item deleted');
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const addMovementMutation = useMutation({
    mutationFn: inventoryApi.addMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-expiring'] });
      toast.success('Stock movement recorded');
      setIsMovementModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => toast.error('Failed to record movement'),
  });

  const handleDelete = (item: InventoryItem) => {
    if (window.confirm(`Delete "${item.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.minQuantity) {
      return { label: 'Low Stock', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
    }
    if (item.maxQuantity && item.quantity >= item.maxQuantity * 0.9) {
      return { label: 'Overstocked', color: 'text-yellow-600 bg-yellow-50', icon: TrendingDown };
    }
    return { label: 'Normal', color: 'text-green-600 bg-green-50', icon: Package };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your stock levels</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {Array.isArray(lowStockItems) ? lowStockItems.length : 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">
                {Array.isArray(expiringItems) ? expiringItems.length : 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* View Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setView('low-stock')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'low-stock'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low Stock
            </button>

            <button
              onClick={() => setView('expiring')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'expiring'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expiring
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Inventory List */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No inventory items</h3>
            <p className="text-gray-500 mb-6">Start by adding your first inventory item</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="w-5 h-5" />
              Add First Item
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const status = getStockStatus(item);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.sku || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.category || '—'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-2xl font-bold ${
                          item.quantity <= item.minQuantity ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ETB {item.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsMovementModalOpen(true);
                            }}
                            className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg"
                            title="Record Movement"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <ItemModal
          isOpen={isAddModalOpen || isEditModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSubmit={(data) => {
            if (selectedItem) {
              updateMutation.mutate({ id: selectedItem.id, data });
            } else {
              createMutation.mutate({ ...data, branchId: user?.branch?.id! });
            }
          }}
          categories={categories || []}
        />
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && selectedItem && (
        <MovementModal
          isOpen={isMovementModalOpen}
          onClose={() => {
            setIsMovementModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSubmit={(data) => addMovementMutation.mutate(data)}
        />
      )}
    </div>
  );
}

// Item Modal Component
interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSubmit: (data: Omit<CreateInventoryInput, 'branchId'>) => void;
  categories: string[];
}

function ItemModal({ isOpen, onClose, item, onSubmit, categories }: ItemModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    sku: item?.sku || '',
    category: item?.category || '',
    unit: item?.unit || 'kg',
    quantity: item?.quantity || 0,
    minQuantity: item?.minQuantity || 0,
    maxQuantity: item?.maxQuantity || undefined,
    cost: item?.cost || 0,
    expiryDate: item?.expiryDate ? item.expiryDate.split('T')[0] : '',
    batchNumber: item?.batchNumber || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      maxQuantity: formData.maxQuantity || undefined,
      expiryDate: formData.expiryDate || undefined,
      batchNumber: formData.batchNumber || undefined,
    };
    
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {item ? 'Edit Item' : 'Add New Item'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                list="categories"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="L">Liter (L)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.maxQuantity || ''}
                onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              {item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Movement Modal Component
interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  onSubmit: (data: { 
    inventoryId: string; 
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER'; 
    quantity: number; 
    reference?: string; 
    notes?: string;
    costPerUnit?: number;
    totalCost?: number;
    supplier?: string;
    paymentMethod?: string;
  }) => void;
}

function MovementModal({ isOpen, onClose, item, onSubmit }: MovementModalProps) {
  const [formData, setFormData] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER',
    quantity: 0,
    reference: '',
    notes: '',
    costPerUnit: 0,
    totalCost: 0,
    supplier: '',
    paymentMethod: 'Cash',
  });

  // Auto-calculate total cost
  const handleQuantityChange = (quantity: number) => {
    setFormData({
      ...formData,
      quantity,
      totalCost: quantity * formData.costPerUnit,
    });
  };

  const handleCostPerUnitChange = (costPerUnit: number) => {
    setFormData({
      ...formData,
      costPerUnit,
      totalCost: formData.quantity * costPerUnit,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      inventoryId: item.id,
      type: formData.type,
      quantity: formData.quantity,
      reference: formData.reference || undefined,
      notes: formData.notes || undefined,
      costPerUnit: formData.type === 'IN' && formData.costPerUnit > 0 ? formData.costPerUnit : undefined,
      totalCost: formData.type === 'IN' && formData.totalCost > 0 ? formData.totalCost : undefined,
      supplier: formData.type === 'IN' && formData.supplier ? formData.supplier : undefined,
      paymentMethod: formData.type === 'IN' && formData.paymentMethod ? formData.paymentMethod : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Record Stock Movement</h2>
          <p className="text-sm text-gray-600 mt-1">
            Item: <span className="font-medium">{item.name}</span> (Current: {item.quantity} {item.unit})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="IN">Stock In (Add)</option>
              <option value="OUT">Stock Out (Deduct)</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="WASTE">Waste/Spoilage</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity ({item.unit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Cost Fields - Only for Stock In */}
          {formData.type === 'IN' && (
            <>
              <div className="border-t border-gray-200 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost per {item.unit}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPerUnit}
                      onChange={(e) => handleCostPerUnitChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Cost (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalCost}
                      onChange={(e) => setFormData({ ...formData, totalCost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., ABC Market"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="Card">Card</option>
                    <option value="CBE Birr">CBE Birr</option>
                    <option value="Telebirr">Telebirr</option>
                    <option value="M-Pesa">M-Pesa</option>
                  </select>
                </div>

                {formData.totalCost > 0 && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      💰 <strong>Expense will be auto-created:</strong> {formData.totalCost.toLocaleString()} ETB
                      <br />
                      <span className="text-xs">Category: Ingredients | Status: Paid</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              placeholder="e.g., Invoice #123, Transfer from Branch A"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>New quantity will be:</strong>{' '}
              {formData.type === 'IN'
                ? item.quantity + formData.quantity
                : formData.type === 'OUT' || formData.type === 'WASTE'
                ? item.quantity - formData.quantity
                : 'Adjusted'}{' '}
              {item.unit}
            </p>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Record Movement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
