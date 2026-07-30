import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { menuApi, type MenuCategory, type MenuItem } from '../api/menu';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LogOut, ShoppingCart, User } from 'lucide-react';
import MenuSection from '../components/pos/MenuSection';
import CartSection from '../components/pos/CartSection';
import CheckoutDialog from '../components/pos/CheckoutDialog';

export default function POSPage() {
  const { user, logout } = useAuthStore();
  const { items, getItemCount } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch menu categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories', user?.restaurant?.id],
    queryFn: () => menuApi.getCategories(user?.restaurant?.id),
    enabled: !!user?.restaurant?.id,
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', user?.restaurant?.id, user?.branch?.id, selectedCategory],
    queryFn: () =>
      menuApi.getMenuItems({
        restaurantId: user?.restaurant?.id,
        branchId: user?.branch?.id,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        isAvailable: true,
      }),
    enabled: !!user?.restaurant?.id,
  });

  const handleLogout = () => {
    logout();
  };

  const handleCheckout = () => {
    if (items.length > 0) {
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-bold shadow">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">POS System</h1>
                <p className="text-xs text-gray-500">
                  {user?.branch?.name || 'Main Branch'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Tabs */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">All Items</TabsTrigger>
                {categories.map((category: MenuCategory) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <MenuSection
              items={menuItems}
              isLoading={itemsLoading || categoriesLoading}
            />
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <CartSection onCheckout={handleCheckout} />
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
      />
    </div>
  );
}
