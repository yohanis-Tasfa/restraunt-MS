import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { customerSessionApi, waiterCallApi, type CustomerSession } from '../api/customer-session';
import { menuApi, type MenuItem, type MenuCategory } from '../api/menu';
import { useCustomerCartStore } from '../store/customerCartStore';
import { 
  ShoppingCart, 
  Phone, 
  Users, 
  Loader2,
  AlertCircle,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Bell,
  X,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  subtotal: number;
}

export default function CustomerMenuPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [showGuestModal, setShowGuestModal] = useState(true);
  
  // Customer cart store
  const setCustomerCart = useCustomerCartStore((state) => state.setCustomerCart);

  // Validate QR code and create/get session
  const { isLoading: isLoadingSession, error: sessionError, data: sessionData } = useQuery<CustomerSession | { noSession: boolean }>({
    queryKey: ['customer-session', qrCode],
    queryFn: async (): Promise<CustomerSession | { noSession: boolean }> => {
      if (!qrCode) {
        throw new Error('Invalid QR code');
      }

      try {
        // Try to get existing active session
        const existingSession = await customerSessionApi.getSessionByQRCode(qrCode);
        return existingSession;
      } catch (error: any) {
        // If no session exists (404), return a placeholder
        if (error.response?.status === 404) {
          return { noSession: true }; // Placeholder to indicate no session exists
        }
        // For any other error, throw it
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: { noSession: true } as CustomerSession | { noSession: boolean }, // Provide placeholder data while loading
  });

  // Update session state when data changes
  useEffect(() => {
    if (sessionData && !('noSession' in sessionData)) {
      setSession(sessionData as CustomerSession);
      setShowGuestModal(false);
    } else if (sessionData && 'noSession' in sessionData) {
      // No session exists yet, show guest modal
      setSession(null);
      setShowGuestModal(true);
    }
  }, [sessionData]);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (guestCount: number) =>
      customerSessionApi.createSession({
        qrCodeData: qrCode!,
        guestCount,
      }),
    onSuccess: (data) => {
      setSession(data);
      setShowGuestModal(false);
      toast.success(`Welcome to Table ${data.table.number}!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start session');
    },
  });

  // Fetch menu categories
  const { data: categoriesData } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () => menuApi.getCategories(),
    enabled: !!session,
  });

  // Fetch menu items
  const { data: menuItemsData } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => menuApi.getMenuItems({ isAvailable: true }),
    enabled: !!session,
  });

  const categories = categoriesData || [];
  const menuItems = menuItemsData || [];

  // Filter menu items by category and search
  const filteredItems = menuItems.filter((item: MenuItem) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart functions
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((ci) => ci.menuItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1, subtotal: (ci.quantity + 1) * item.price }
            : ci
        )
      );
    } else {
      setCart([...cart, { menuItem: item, quantity: 1, subtotal: item.price }]);
    }
    toast.success('Added to cart');
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(
      cart
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQuantity = ci.quantity + delta;
            if (newQuantity <= 0) return null;
            return {
              ...ci,
              quantity: newQuantity,
              subtotal: newQuantity * ci.menuItem.price,
            };
          }
          return ci;
        })
        .filter((ci) => ci !== null) as CartItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((ci) => ci.menuItem.id !== itemId));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleStartSession = () => {
    if (guestCount < 1) {
      toast.error('Please enter number of guests');
      return;
    }
    createSessionMutation.mutate(guestCount);
  };

  // Loading state
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionError && sessionError.message !== 'Invalid QR code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Menu</h2>
          <p className="text-gray-600 mb-4">
            {sessionError.message || 'Something went wrong. Please try again.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Card>
      </div>
    );
  }

  if (sessionError && sessionError.message === 'Invalid QR code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid QR Code</h2>
          <p className="text-gray-600 mb-4">
            This QR code is not valid. Please scan a valid table QR code.
          </p>
        </Card>
      </div>
    );
  }

  // Guest count modal
  if (showGuestModal && !session && !isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">How many guests are dining today?</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center text-lg font-semibold"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestCount(guestCount + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleStartSession}
              disabled={createSessionMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Session...
                </>
              ) : (
                'Start Browsing Menu'
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Table {session.table.number}
              </h1>
              <p className="text-sm text-gray-600">
                {session.guestCount} {session.guestCount === 1 ? 'Guest' : 'Guests'}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-[140px] z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items
          </button>
          {categories.map((category: MenuCategory) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item: MenuItem) => (
              <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <button
          onClick={() => setIsCallWaiterOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110"
        >
          <Bell className="w-6 h-6" />
        </button>
      </div>

      {/* Cart Drawer */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                    Your Cart
                  </span>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </DialogTitle>
                <DialogDescription>
                  {cart.length === 0
                    ? 'Your cart is empty'
                    : `${cartItemCount} item${cartItemCount !== 1 ? 's' : ''} in cart`}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No items in cart yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Browse the menu and add items to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Item Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.menuItem.image ? (
                          <img
                            src={item.menuItem.image}
                            alt={item.menuItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {item.menuItem.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.menuItem.price.toFixed(2)} ETB each
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, -1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.menuItem.id, 1)}
                            className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.menuItem.id)}
                            className="ml-auto text-red-500 hover:text-red-600 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {item.subtotal.toFixed(2)} ETB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Total and Actions */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    {cartTotal.toFixed(2)} ETB
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCallWaiterOpen(true);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Call Waiter to Order
                  </Button>
                  
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">
                      Your waiter will help you complete the order and payment at the table
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Waiter Modal */}
      <Dialog open={isCallWaiterOpen} onOpenChange={setIsCallWaiterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              Call Waiter
            </DialogTitle>
            <DialogDescription>
              {session.table.assignedWaiter
                ? `Your waiter ${session.table.assignedWaiter.firstName} will be notified`
                : 'A waiter will be notified of your request'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <CallWaiterButton
              icon={<Bell className="w-6 h-6" />}
              title="Need Assistance"
              description="General help or questions"
              requestType="ASSISTANCE"
              session={session}
              cart={cart}
              onSuccess={() => setIsCallWaiterOpen(false)}
            />
            <CallWaiterButton
              icon={<ShoppingCart className="w-6 h-6" />}
              title="Ready to Order"
              description={
                cart.length > 0
                  ? `${cartItemCount} item${cartItemCount !== 1 ? 's' : ''} in cart`
                  : 'No items in cart yet'
              }
              requestType="ORDER_READY"
              session={session}
              cart={cart}
              onSuccess={() => setIsCallWaiterOpen(false)}
              disabled={cart.length === 0}
            />
            <CallWaiterButton
              icon={<CreditCard className="w-6 h-6" />}
              title="Request Bill"
              description="Ready to pay and leave"
              requestType="BILL_REQUEST"
              session={session}
              cart={cart}
              onSuccess={() => setIsCallWaiterOpen(false)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallWaiterOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Call Waiter Button Component
function CallWaiterButton({
  icon,
  title,
  description,
  requestType,
  session,
  cart,
  onSuccess,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  requestType: 'ASSISTANCE' | 'ORDER_READY' | 'BILL_REQUEST' | 'OTHER';
  session: CustomerSession;
  cart: CartItem[];
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const setCustomerCart = useCustomerCartStore((state) => state.setCustomerCart);

  const handleCall = async () => {
    setIsLoading(true);
    try {
      // Prepare selected items data
      const selectedItems = cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        subtotal: item.subtotal,
      }));

      // Save cart to store for POS access (if ORDER_READY)
      if (requestType === 'ORDER_READY' && cart.length > 0) {
        const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        setCustomerCart(session.id, {
          sessionId: session.id,
          tableId: session.table.id,
          tableNumber: session.table.number,
          items: cart.map((item) => ({
            menuItemId: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            image: item.menuItem.image,
          })),
          total: cartTotal,
          guestCount: session.guestCount,
          timestamp: Date.now(),
        });
      }

      await waiterCallApi.createCall({
        sessionId: session.id,
        requestType,
        selectedItems: selectedItems.length > 0 ? selectedItems : undefined,
      });

      toast.success(`Waiter called successfully! They'll be with you shortly.`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to call waiter');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCall}
      disabled={disabled || isLoading}
      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
        disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-3 rounded-full ${
            disabled ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
          }`}
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <ChevronRight
          className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
        />
      </div>
    </button>
  );
}

// Menu Item Card Component with 3D effect
function MenuItemCard({ item, onAddToCart }: { item: MenuItem; onAddToCart: (item: MenuItem) => void }) {
  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-white/80 backdrop-blur-sm">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {item.isVegetarian && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              🥬 Veg
            </span>
          )}
          {item.isSpicy && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              🌶️ Spicy
            </span>
          )}
        </div>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-green-600">
            {item.price.toFixed(2)} ETB
          </span>
          <Button
            size="sm"
            onClick={() => onAddToCart(item)}
            disabled={!item.isAvailable}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
