import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Upload, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  X
} from 'lucide-react';
import { menuApi } from '../api/menu';
import type { 
  MenuCategory, 
  MenuItem, 
  CreateMenuItemInput, 
  UpdateMenuItemInput 
} from '../api/menu';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

type ViewMode = 'grid' | 'list';

export default function MenuManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingCategories, setIsCreatingCategories] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', user?.restaurant.id],
    queryFn: () => menuApi.getCategories(user?.restaurant.id),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menuItems', user?.restaurant.id, selectedCategory],
    queryFn: () =>
      menuApi.getMenuItems({
        restaurantId: user?.restaurant.id,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMenuItemInput) => {
      console.log('Creating menu item with data:', data);
      return menuApi.createMenuItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Menu item created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Failed to create menu item:', error);
      toast.error(error.response?.data?.message || 'Failed to create menu item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemInput }) =>
      menuApi.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Menu item updated successfully');
      setEditingItem(null);
    },
    onError: () => {
      toast.error('Failed to update menu item');
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      menuApi.toggleMenuItemAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Availability updated');
    },
    onError: () => {
      toast.error('Failed to update availability');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      toast.success('Menu item deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete menu item');
    },
  });

  // Create sample categories
  const createSampleCategories = async () => {
    if (!user?.restaurant.id) {
      toast.error('Restaurant ID not found');
      return;
    }

    setIsCreatingCategories(true);
    const sampleCategories = [
      { name: 'Traditional', description: 'Traditional Ethiopian dishes', restaurantId: user.restaurant.id, isActive: true },
      { name: 'Grill', description: 'Grilled meats and vegetables', restaurantId: user.restaurant.id, isActive: true },
      { name: 'Vegan', description: 'Plant-based dishes', restaurantId: user.restaurant.id, isActive: true },
      { name: 'Coffee', description: 'Ethiopian coffee and beverages', restaurantId: user.restaurant.id, isActive: true },
      { name: 'Drinks', description: 'Fresh juices and beverages', restaurantId: user.restaurant.id, isActive: true },
      { name: 'Desserts', description: 'Sweet treats', restaurantId: user.restaurant.id, isActive: true },
    ];

    try {
      for (const category of sampleCategories) {
        await menuApi.createCategory(category);
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Sample categories created!');
    } catch (error) {
      toast.error('Failed to create categories');
      console.error(error);
    } finally {
      setIsCreatingCategories(false);
    }
  };

  // Handle CSV/JSON import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension !== 'csv' && fileExtension !== 'json') {
      toast.error('Please upload a CSV or JSON file');
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let items: any[] = [];

        if (fileExtension === 'json') {
          // Parse JSON
          const parsed = JSON.parse(content);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // Parse CSV
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          
          items = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const item: any = {};
            headers.forEach((header, index) => {
              item[header] = values[index];
            });
            return item;
          });
        }

        // Validate and import items
        let successCount = 0;
        let errorCount = 0;

        for (const item of items) {
          try {
            // Find category by name if categoryId not provided
            let categoryId = item.categoryId;
            if (!categoryId && item.category) {
              const category = categories.find(c => 
                c.name.toLowerCase() === item.category.toLowerCase()
              );
              categoryId = category?.id;
            }

            if (!categoryId) {
              console.warn('Skipping item without category:', item.name);
              errorCount++;
              continue;
            }

            await menuApi.createMenuItem({
              name: item.name || item.Name,
              description: item.description || item.Description || '',
              price: parseFloat(item.price || item.Price || 0),
              categoryId: categoryId,
              preparationTime: parseInt(item.preparationTime || item.PrepTime || 0),
              isAvailable: item.isAvailable !== 'false',
              image: item.image || item.Image || '',
              isVegetarian: item.isVegetarian === 'true',
              isSpicy: item.isSpicy === 'true',
            });
            successCount++;
          } catch (error) {
            console.error('Error importing item:', item, error);
            errorCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ['menuItems'] });
        
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        } else {
          toast.error('Failed to import items');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to parse file. Check the format.');
      } finally {
        setIsImporting(false);
        // Reset file input
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const activeItems = items.filter(item => item.isAvailable).length;
  const lowStockItems = 0; // Placeholder - would need inventory integration
  const outOfStockItems = items.filter(item => !item.isAvailable).length;

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
        <p className="text-gray-600 mt-1">Manage categories, dishes, pricing and availability.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
          <div className="text-sm text-gray-600 mt-1">{categories.length} categories</div>
          <div className="text-xs text-gray-500 mt-1">Total items</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{activeItems}</div>
          <div className="text-xs text-gray-500 mt-1">Active</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
          <div className="text-xs text-gray-500 mt-1">Low stock</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          <div className="text-xs text-gray-500 mt-1">Out of stock</div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white pr-8"
            >
              <option value="all">All Categories ({items.length})</option>
              {categories.map((cat) => {
                const categoryItemCount = items.filter(item => item.categoryId === cat.id).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({categoryItemCount})
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <label className={`flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{isImporting ? 'Importing...' : 'Import'}</span>
              <input
                type="file"
                className="hidden"
                accept=".csv,.json"
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Item
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading menu items...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No categories found</p>
          <p className="text-sm text-gray-500 mb-4">Create categories first to organize your menu items</p>
          <button
            onClick={createSampleCategories}
            disabled={isCreatingCategories}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {isCreatingCategories ? 'Creating...' : 'Create Sample Categories'}
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No menu items found</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 text-green-500 hover:text-green-600 font-medium"
          >
            Create your first menu item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditingItem(item)}
              onDelete={() => handleDelete(item.id, item.name)}
              onToggleAvailability={() =>
                toggleAvailabilityMutation.mutate({
                  id: item.id,
                  isAvailable: !item.isAvailable,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <MenuItemModal
          categories={categories}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={(data) => createMutation.mutate(data)}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <MenuItemModal
          item={editingItem}
          categories={categories}
          onClose={() => setEditingItem(null)}
          onSave={(data) =>
            updateMutation.mutate({ id: editingItem.id, data })
          }
        />
      )}
    </div>
  );
}

// Menu Item Card Component
function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all group">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-100 to-orange-50 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.error('Image failed to load:', item.image);
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Fallback icon if no image or image fails */}
        {!item.image && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">🍽️</div>
          </div>
        )}
        
        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit dish
                </button>
                <button
                  onClick={() => {
                    onToggleAvailability();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  {item.isAvailable ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Mark unavailable
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Mark available
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Availability Badge */}
        {!item.isAvailable && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name with Emoji */}
        <h3 className="font-semibold text-gray-900 text-base mb-1 flex items-center gap-1">
          {item.name}
          {item.isVegetarian && <span className="text-base">🌱</span>}
          {item.isSpicy && <span className="text-base">🌶️</span>}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Category Tag */}
        <div className="mb-3">
          {item.category && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {item.category.name}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="text-lg font-bold text-green-600">
          Br {item.price.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

// Menu Item Modal Component
function MenuItemModal({
  item,
  categories,
  onClose,
  onSave,
}: {
  item?: MenuItem;
  categories: MenuCategory[];
  onClose: () => void;
  onSave: (data: CreateMenuItemInput) => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    categoryId: item?.categoryId || categories[0]?.id || '',
    preparationTime: item?.preparationTime || 0,
    isAvailable: item?.isAvailable ?? true,
    image: item?.image || '',
    isVegetarian: item?.isVegetarian || false,
    isSpicy: item?.isSpicy || false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(item?.image || '');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description: string; restaurantId: string; isActive: boolean }) =>
      menuApi.createCategory(data),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      setFormData({ ...formData, categoryId: newCategory.id });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCategoryForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
      setDeletingCategoryId(null);
      // Reset to first category if deleted was selected
      if (formData.categoryId === deletingCategoryId) {
        setFormData({ ...formData, categoryId: categories[0]?.id || '' });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete category');
      setDeletingCategoryId(null);
    },
  });

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!user?.restaurant.id) {
      toast.error('Restaurant ID not found');
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim(),
      restaurantId: user.restaurant.id,
      isActive: true,
    });
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (window.confirm(`Delete category "${categoryName}"? Items in this category will need to be reassigned.`)) {
      setDeletingCategoryId(categoryId);
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setImageFile(file);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setIsUploading(true);
    const uploadFormData = new FormData(); // Renamed to avoid shadowing
    uploadFormData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const result = await response.json();
      
      if (result.success) {
        setFormData(prev => ({ ...prev, image: result.data.url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(result.message || 'Failed to upload image');
        setImageFile(null);
        setImagePreview('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setImageFile(null);
      setImagePreview('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    onSave(formData);
  };

  // Sample Ethiopian food images
  const sampleImages = [
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">
          {item ? 'Edit Menu Item' : 'Add New Menu Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dish Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Doro Wat"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              
              {/* Custom Dropdown with Delete Icons and Add Button */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-left flex items-center justify-between bg-white"
                  >
                    <span className={formData.categoryId ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.categoryId
                        ? categories.find(c => c.id === formData.categoryId)?.name
                        : 'Select category'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showCategoryDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowCategoryDropdown(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                        {/* Select category option */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, categoryId: '' });
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-gray-500 hover:bg-gray-50 text-sm border-b border-gray-100"
                        >
                          Select category
                        </button>
                        
                        {/* Category options with delete icons */}
                        {categories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 group ${
                              formData.categoryId === cat.id ? 'bg-green-50' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, categoryId: cat.id });
                                setShowCategoryDropdown(false);
                              }}
                              className="flex-1 text-left text-sm text-gray-900"
                            >
                              {cat.name}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(cat.id, cat.name);
                              }}
                              disabled={deletingCategoryId === cat.id}
                              className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                              title="Delete category"
                            >
                              {deletingCategoryId === cat.id ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(true)}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 whitespace-nowrap text-sm"
                  title="Add new category"
                >
                  + New
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the dish..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (Birr) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.preparationTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preparationTime: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dish Image
            </label>
            
            {/* Upload Method Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  uploadMethod === 'file'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Upload File
              </button>
            </div>

            {/* URL Input */}
            {uploadMethod === 'url' && (
              <>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {sampleImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: img });
                        setImagePreview(img);
                      }}
                      className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-500 flex-shrink-0 transition-colors"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* File Upload */}
            {uploadMethod === 'file' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
                          <p className="text-sm text-gray-500">Uploading to Cloudinary...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, JPEG, GIF, WEBP (MAX. 5MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleImageFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {imageFile && (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-medium">Selected:</span>
                    <span>{imageFile.name}</span>
                    <span className="text-gray-400">({(imageFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                      setFormData({ ...formData, image: '' });
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) =>
                  setFormData({ ...formData, isAvailable: e.target.checked })
                }
                className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
              />
              <label htmlFor="isAvailable" className="text-sm text-gray-700">
                Available
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVegetarian"
                checked={formData.isVegetarian}
                onChange={(e) =>
                  setFormData({ ...formData, isVegetarian: e.target.checked })
                }
                className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
              />
              <label htmlFor="isVegetarian" className="text-sm text-gray-700">
                Vegetarian 🌱
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSpicy"
                checked={formData.isSpicy}
                onChange={(e) =>
                  setFormData({ ...formData, isSpicy: e.target.checked })
                }
                className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
              />
              <label htmlFor="isSpicy" className="text-sm text-gray-700">
                Spicy 🌶️
              </label>
            </div>
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
              {item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>

        {/* Add Category Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add New Category</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="hot drinks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                  className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

