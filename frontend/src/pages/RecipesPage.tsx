import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import recipesApi, { type MenuItemWithRecipe, type RecipeItem, type MenuItemRecipe } from '../api/recipes';
import inventoryApi from '../api/inventory';
import { Plus, Search, Trash2, Edit2, ChefHat, Package, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);

  // Fetch all menu items with recipe info
  const { data: menuItemsData, isLoading: isLoadingItems, error: menuItemsError } = useQuery({
    queryKey: ['recipes-menu-items', searchTerm],
    queryFn: () => recipesApi.getAllMenuItems({ search: searchTerm || undefined }),
  });

  // Handle both wrapped and unwrapped API responses
  const menuItems = Array.isArray(menuItemsData?.data) 
    ? menuItemsData.data 
    : Array.isArray(menuItemsData) 
    ? menuItemsData 
    : [];

  // Fetch recipe details for selected menu item
  const { data: recipeData, isLoading: isLoadingRecipe, error: recipeError } = useQuery({
    queryKey: ['recipe-details', selectedMenuItem],
    queryFn: () => selectedMenuItem ? recipesApi.getByMenuItemId(selectedMenuItem) : null,
    enabled: !!selectedMenuItem,
  });

  // Handle both wrapped and unwrapped responses
  const recipe = (recipeData?.data || recipeData) as MenuItemRecipe | undefined;

  // Fetch inventory items for dropdown
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: () => inventoryApi.getAll({ limit: 1000 }),
  });

  // Inventory API returns {items: [...], total, page, limit}
  const inventoryItems = inventoryData?.items || [];

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item: MenuItemWithRecipe) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by has/no recipe
  const itemsWithRecipe = filteredMenuItems.filter((item: MenuItemWithRecipe) => item.hasRecipe);
  const itemsWithoutRecipe = filteredMenuItems.filter((item: MenuItemWithRecipe) => !item.hasRecipe);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ChefHat className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        </div>
        <p className="text-sm text-gray-600">
          Link menu items to inventory ingredients for automatic cost calculation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Menu Items List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Menu Items List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {isLoadingItems ? (
              <div className="p-8 text-center text-gray-500">Loading menu items...</div>
            ) : menuItemsError ? (
              <div className="p-4 text-center">
                <p className="text-red-600 font-medium mb-2">Error loading menu items</p>
                <p className="text-sm text-gray-600 mb-2">
                  {(menuItemsError as any)?.response?.data?.message || (menuItemsError as any)?.message || 'Unknown error'}
                </p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['recipes-menu-items'] })}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            ) : filteredMenuItems.length === 0 && searchTerm === '' ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No menu items found</p>
                <p className="text-sm text-gray-400">Create menu items first in the Menu page</p>
              </div>
            ) : (
              <>
                {/* Items with recipe */}
                {itemsWithRecipe.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        With Recipe ({itemsWithRecipe.length})
                      </p>
                    </div>
                    {itemsWithRecipe.map((item: MenuItemWithRecipe) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMenuItem(item.id)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                          selectedMenuItem === item.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-600">
                                {item.ingredientCount} ingredients
                              </span>
                              <span className="text-xs font-medium text-green-600">
                                {formatPercentage(item.profitPercentage)} profit
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Items without recipe */}
                {itemsWithoutRecipe.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        No Recipe ({itemsWithoutRecipe.length})
                      </p>
                    </div>
                    {itemsWithoutRecipe.map((item: MenuItemWithRecipe) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMenuItem(item.id)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                          selectedMenuItem === item.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category.name}</p>
                            <p className="text-xs text-orange-600 mt-1">No recipe defined</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredMenuItems.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No menu items found</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column - Recipe Details */}
        <div className="lg:col-span-2">
          {!selectedMenuItem ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a menu item</h3>
              <p className="text-gray-500">Choose a menu item from the list to view or edit its recipe</p>
            </div>
          ) : isLoadingRecipe ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading recipe...
            </div>
          ) : recipe ? (
            <RecipeDetails
              recipe={recipe}
              inventoryItems={inventoryItems}
              onAddIngredient={() => setShowAddIngredientModal(true)}
            />
          ) : null}
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {showAddIngredientModal && selectedMenuItem && (
        <AddIngredientModal
          menuItemId={selectedMenuItem}
          inventoryItems={inventoryItems}
          existingIngredients={recipe?.recipeItems || []}
          onClose={() => setShowAddIngredientModal(false)}
          onSuccess={() => {
            setShowAddIngredientModal(false);
            queryClient.invalidateQueries({ queryKey: ['recipe-details', selectedMenuItem] });
            queryClient.invalidateQueries({ queryKey: ['recipes-menu-items'] });
            toast.success('Ingredient added successfully');
          }}
        />
      )}
    </div>
  );
}

// Recipe Details Component
function RecipeDetails({
  recipe,
  inventoryItems,
  onAddIngredient,
}: {
  recipe: MenuItemRecipe;
  inventoryItems: any[];
  onAddIngredient: () => void;
}) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<RecipeItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: recipesApi.deleteRecipeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-details'] });
      queryClient.invalidateQueries({ queryKey: ['recipes-menu-items'] });
      toast.success('Ingredient removed');
    },
    onError: () => {
      toast.error('Failed to remove ingredient');
    },
  });

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Menu Item Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{recipe.menuItemName}</h2>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(recipe.menuItemPrice)}
          </span>
        </div>

        {/* Cost Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">Total Cost</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(recipe.totalCost)}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">Profit</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(recipe.profitMargin)}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-600 font-medium">Margin</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatPercentage(recipe.profitPercentage)}</p>
          </div>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
          <Button
            onClick={onAddIngredient}
            className="bg-green-600 hover:bg-green-700 gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient
          </Button>
        </div>

        {recipe.recipeItems.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No ingredients added yet</p>
            <Button
              onClick={onAddIngredient}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Ingredient
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recipe.recipeItems.map((item: RecipeItem) => {
              const itemCost = (item.inventory.cost || 0) * item.quantity;
              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.inventory.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(itemCost)}</p>
                      <p className="text-xs text-gray-500">
                        @ {formatCurrency(item.inventory.cost || 0)}/{item.inventory.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Remove this ingredient from the recipe?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <EditIngredientModal
          recipeItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            queryClient.invalidateQueries({ queryKey: ['recipe-details'] });
            queryClient.invalidateQueries({ queryKey: ['recipes-menu-items'] });
            toast.success('Ingredient updated');
          }}
        />
      )}
    </div>
  );
}

// Add Ingredient Modal
function AddIngredientModal({
  menuItemId,
  inventoryItems,
  existingIngredients,
  onClose,
  onSuccess,
}: {
  menuItemId: string;
  inventoryItems: any[];
  existingIngredients: RecipeItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('');

  // Filter out already added ingredients
  const existingIds = existingIngredients.map(item => item.inventoryId);
  const availableItems = inventoryItems.filter(item => !existingIds.includes(item.id));

  const selectedItem = inventoryItems.find(item => item.id === selectedInventoryId);

  const createMutation = useMutation({
    mutationFn: recipesApi.addRecipeItem,
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add ingredient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryId || !quantity || !unit) {
      toast.error('Please fill all fields');
      return;
    }
    createMutation.mutate({
      menuItemId,
      inventoryId: selectedInventoryId,
      quantity,
      unit,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Add Ingredient</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inventory Item *
            </label>
            <select
              value={selectedInventoryId}
              onChange={(e) => {
                setSelectedInventoryId(e.target.value);
                const item = inventoryItems.find(i => i.id === e.target.value);
                if (item) setUnit(item.unit);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select ingredient...</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="e.g., kg, g, pieces"
              required
            />
          </div>

          {selectedItem && selectedItem.cost && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Estimated cost:</span> Br{' '}
                {((selectedItem.cost || 0) * quantity).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Adding...' : 'Add Ingredient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Ingredient Modal
function EditIngredientModal({
  recipeItem,
  onClose,
  onSuccess,
}: {
  recipeItem: RecipeItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState<number>(recipeItem.quantity);
  const [unit, setUnit] = useState(recipeItem.unit);

  const updateMutation = useMutation({
    mutationFn: (data: { quantity: number; unit: string }) =>
      recipesApi.updateRecipeItem(recipeItem.id, data),
    onSuccess: () => {
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to update ingredient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ quantity, unit });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Edit Ingredient</h3>
          <p className="text-sm text-gray-500 mt-1">{recipeItem.inventory.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
