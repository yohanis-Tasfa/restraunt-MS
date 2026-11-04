import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { menuApi, type MenuCategory, type MenuItem } from '../api/menu';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LogOut, ShoppingCart, User, Bell } from 'lucide-react';
import MenuSection from '../components/pos/MenuSection';
import CartSection from '../components/pos/CartSection';
import CheckoutDialog from '../components/pos/CheckoutDialog';
import ActiveCallsPanel from '../components/pos/ActiveCallsPanel';
import { useActiveCalls } from '../hooks/useWaiterCalls';
import toast from 'react-hot-toast';

// Active Calls Indicator Component
function ActiveCallsIndicator() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { calls } = useActiveCalls(false);

  if (calls.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsPanelOpen(true)}
        className="relative bg-green-600 hover:bg-green-700 text-white"
        size="sm"
      >
        <Bell className="w-4 h-4 mr-2" />
        Active Calls
        <Badge className="ml-2 bg-white text-green-700 hover:bg-white">
          {calls.length}
        </Badge>
      </Button>
      
      <ActiveCallsPanel 
        open={isPanelOpen} 
        onOpenChange={setIsPanelOpen}
      />
    </>
  );
}

export default function POSPage() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { items, getItemCount, addItem, clearCart } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPrefillData, setCheckoutPrefillData] = useState<{
    tableNumber?: string;
    orderType?: any;
    callId?: string;
  } | undefined>(undefined);

  // Load customer cart when navigating from waiter calls
  useEffect(() => {
    const state = location.state as any;
    if (state?.customerCart && state.customerCart.items.length > 0) {
      console.log('📦 Loading customer cart from state:', state);
      
      // Clear existing cart
      clearCart();
      
      // Set prefill data for checkout including callId
      const prefill = {
        tableNumber: state.tableNumber,
        orderType: state.orderType || 'DINE_IN',
        callId: state.callId, // Pass the callId so we can complete the call
      };
      console.log('🎯 Setting prefill data:', prefill);
      setCheckoutPrefillData(prefill);
      
      // Load customer's cart items with proper structure
      state.customerCart.items.forEach((item: any) => {
        addItem({
          menuItemId: item.menuItemId || item.id || `item-${Date.now()}`,
          menuItem: {
            id: item.menuItemId || item.id || `item-${Date.now()}`,
            name: item.name,
            price: Number(item.price || 0),
            image: item.image,
            categoryId: item.category?.id || item.categoryId || '',
            isAvailable: true,
          },
          unitPrice: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          addons: item.addons?.map((addon: any) => ({
            addonId: addon.id || `addon-${Date.now()}`,
            addon: {
              id: addon.id || `addon-${Date.now()}`,
              name: addon.name,
              price: Number(addon.price || 0),
              isAvailable: true,
            },
            quantity: 1,
            price: Number(addon.price || 0),
          })) || [],
          variantId: item.variant?.id,
          variant: item.variant ? {
            id: item.variant.id || `variant-${Date.now()}`,
            name: item.variant.name,
            price: Number(item.variant.price || 0),
            isAvailable: true,
          } : undefined,
          specialInstructions: item.notes || item.specialInstructions,
        });
      });
      
      toast.success(`Loaded ${state.customerCart.items.length} items from Table ${state.tableNumber}`);

      // Auto-open checkout modal so waiter can immediately submit order
      if (state.autoOpenCheckout) {
        setIsCheckoutOpen(true);
      }
      
      // Clear navigation state so it doesn't reload on refresh
      window.history.replaceState({}, document.title);
    } else if (state?.tableNumber) {
      setCheckoutPrefillData({
        tableNumber: state.tableNumber,
        orderType: 'DINE_IN',
      });
      toast.success(`Table ${state.tableNumber} selected for POS order`);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, clearCart, addItem]);

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

  const handleCheckoutClose = (wasSuccessful: boolean) => {
    setIsCheckoutOpen(false);
    // Clear prefill data after successful checkout to prevent reuse
    if (wasSuccessful) {
      setCheckoutPrefillData(undefined);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#07130e] text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-[#091a13] border-b border-gray-200 dark:border-[#143225] px-4 py-3 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-bold shadow">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">POS System</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.branch?.name || 'Main Branch'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Calls Indicator */}
            <ActiveCallsIndicator />
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#0c2219] border border-transparent dark:border-[#143225] rounded-lg">
              <User className="w-4 h-4 text-gray-600 dark:text-[#00e676]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="dark:border-[#143225] dark:text-gray-200 dark:hover:bg-[#12281d] cursor-pointer">
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Menu */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-[#07130e]">
          {/* Category Tabs */}
          <div className="bg-white dark:bg-[#091a13] border-b border-gray-200 dark:border-[#143225] px-4 py-3">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start overflow-x-auto bg-gray-100 dark:bg-[#071a12] border border-gray-200 dark:border-[#143225] p-1">
                <TabsTrigger value="all" className="dark:data-[state=active]:bg-[#123627] dark:data-[state=active]:text-[#00e676] dark:text-gray-300">All Items</TabsTrigger>
                {categories.map((category: MenuCategory) => (
                  <TabsTrigger key={category.id} value={category.id} className="dark:data-[state=active]:bg-[#123627] dark:data-[state=active]:text-[#00e676] dark:text-gray-300">
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#07130e]">
            <MenuSection
              items={menuItems}
              isLoading={itemsLoading || categoriesLoading}
            />
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 bg-white dark:bg-[#091a13] border-l border-gray-200 dark:border-[#143225] flex flex-col shadow-lg">
          <CartSection onCheckout={handleCheckout} />
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutOpen}
        onOpenChange={(open) => {
          if (!open) handleCheckoutClose(false);
        }}
        prefillData={checkoutPrefillData}
        onSuccess={() => {
          setCheckoutPrefillData(undefined); // Clear prefill data after successful order
        }}
      />
    </div>
  );
}
