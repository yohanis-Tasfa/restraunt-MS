import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { customerSessionApi, waiterCallApi, type CustomerSession } from '../api/customer-session';
import { menuApi, type MenuItem, type MenuCategory } from '../api/menu';
import { useCustomerCartStore } from '../store/customerCartStore';
import { 
  ShoppingCart, 
  Users, 
  Loader2,
  AlertCircle,
  Plus, 
  Minus, 
  Trash2, 
  Bell, 
  X, 
  Search,
  Sparkles,
  ArrowRight,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import MenuItemModal from '../components/public/MenuItemModal';
import LiveOrderStatusTracker, { type ActiveOrderData } from '../components/public/LiveOrderStatusTracker';
import BillRequestDialog from '../components/public/BillRequestDialog';

interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  variant?: { name: string; price: number };
  addons?: Array<{ name: string; price: number }>;
  notes?: string;
  subtotal: number;
}

export default function CustomerMenuPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Modal customization state
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Active Order & Bill Dialog state
  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);

  // Customer cart store
  const setCustomerCart = useCustomerCartStore((state) => state.setCustomerCart);

  // Validate QR code and create/get session
  const { isLoading: isLoadingSession, error: sessionError, data: sessionData, refetch: refetchSession } = useQuery<CustomerSession | { noSession: boolean }>({
    queryKey: ['customer-session', qrCode],
    queryFn: async (): Promise<CustomerSession | { noSession: boolean }> => {
      if (!qrCode) {
        throw new Error('Invalid QR code');
      }

      try {
        const existingSession = await customerSessionApi.getSessionByQRCode(qrCode);
        return existingSession;
      } catch (error: any) {
        if (error.response?.status === 404 || error.message?.includes('not found')) {
          return { noSession: true };
        }
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Update session state when data changes
  useEffect(() => {
    if (sessionData && !('noSession' in sessionData)) {
      setSession(sessionData as CustomerSession);
      setShowGuestModal(false);
    } else if (sessionData && 'noSession' in sessionData) {
      setSession(null);
      setShowGuestModal(true);
    }
  }, [sessionData]);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (count: number) =>
      customerSessionApi.createSession({
        qrCodeData: qrCode!,
        guestCount: count,
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
  const { data: menuItemsData, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => menuApi.getMenuItems({ isAvailable: true }),
    enabled: !!session,
  });

  const categories = categoriesData || [];
  const menuItems = menuItemsData || [];

  // Poll for active order for this table
  useEffect(() => {
    if (!session?.table?.id) return;

    const fetchActiveOrder = async () => {
      try {
        const res = await fetch(`/api/customer-sessions/table/${session.table.id}/active-order`);
        if (res.ok) {
          const json = await res.json();
          setActiveOrder(json.data || null);
        }
      } catch (err) {
        console.error('Failed to poll active order:', err);
      }
    };

    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 8000);
    return () => clearInterval(interval);
  }, [session?.table?.id]);

  // Filter menu items by category and search
  const filteredItems = menuItems.filter((item: MenuItem) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const handleOpenItemModal = (item: MenuItem) => {
    setSelectedItemForModal(item);
    setIsItemModalOpen(true);
  };

  const handleAddToCartWithCustomization = (
    item: MenuItem,
    quantity: number,
    selectedVariant?: any,
    selectedAddons?: any[],
    notes?: string
  ) => {
    let itemPrice = selectedVariant ? selectedVariant.price : item.price;
    if (selectedAddons && selectedAddons.length > 0) {
      itemPrice += selectedAddons.reduce((sum, a) => sum + a.price, 0);
    }
    const subtotal = itemPrice * quantity;

    const newCartItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      menuItem: item,
      quantity,
      variant: selectedVariant ? { name: selectedVariant.name, price: selectedVariant.price } : undefined,
      addons: selectedAddons?.map(a => ({ name: a.name, price: a.price })),
      notes,
      subtotal,
    };

    setCart([...cart, newCartItem]);
    toast.success(`Added ${quantity}× ${item.name} to cart`);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(
      cart
        .map((ci) => {
          if (ci.id === cartItemId) {
            const newQuantity = ci.quantity + delta;
            if (newQuantity <= 0) return null;
            const singlePrice = ci.subtotal / ci.quantity;
            return {
              ...ci,
              quantity: newQuantity,
              subtotal: singlePrice * newQuantity,
            };
          }
          return ci;
        })
        .filter((ci) => ci !== null) as CartItem[]
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter((ci) => ci.id !== cartItemId));
    toast.success('Removed item from cart');
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

  // Submit cart order to waiter
  const handleCallWaiterWithCart = async () => {
    if (!session) return;
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const itemsPayload = cart.map((ci) => ({
        menuItemId: ci.menuItem.id,
        name: ci.menuItem.name,
        price: ci.subtotal / ci.quantity,
        quantity: ci.quantity,
        subtotal: ci.subtotal,
        image: ci.menuItem.image,
        variant: ci.variant?.name,
        addons: ci.addons?.map(a => a.name),
        notes: ci.notes,
      }));

      const cartData = {
        sessionId: session.id,
        tableId: session.table.id,
        tableNumber: session.table.number,
        items: itemsPayload,
        total: cartTotal,
        totalItems: cartItemCount,
        orderType: 'DINE_IN',
        guestCount: session.guestCount,
      };

      // Set in store for instant POS fallback
      setCustomerCart(session.id, cartData);

      // Create waiter call with full rich payload
      await waiterCallApi.createCall({
        sessionId: session.id,
        requestType: 'ORDER_READY',
        selectedItems: cartData,
      });

      setIsCartOpen(false);
      setCart([]);
      toast.success(
        `Waiter has been called! They are coming to Table ${session.table.number} to confirm your order and send it to the kitchen.`,
        { duration: 6000 }
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to notify waiter. Please try again.');
    }
  };

  // Loading state
  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040c08] text-white">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 animate-spin text-[#00e676] mx-auto" />
          <p className="text-sm font-medium text-white/80">Connecting to Table...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionError && !showGuestModal && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040c08] text-white p-4">
        <div className="p-8 max-w-md w-full text-center bg-[#042417] border border-red-500/40 rounded-3xl shadow-2xl space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold font-serif text-white">Unable to Load Table</h2>
          <p className="text-sm text-white/70">
            {sessionError.message || 'Please make sure you have scanned a valid table QR code.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button 
              onClick={() => refetchSession()}
              className="bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl"
            >
              Retry
            </Button>
            <Link to="/" className="text-xs text-[#00e676] hover:underline pt-2">
              Browse Public Menu Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guest count modal
  if (showGuestModal && !session && !isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040c08] text-white p-4">
        <div className="p-8 max-w-md w-full text-center bg-[#042417] border border-[#145d3e] rounded-3xl shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-[#00e676]/15 border border-[#00e676]/40 rounded-2xl flex items-center justify-center mx-auto text-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.3)]">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-serif italic font-bold text-white">Welcome!</h2>
            <p className="text-sm text-white/70 mt-1">How many guests are dining at this table?</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                type="button"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-12 h-12 rounded-xl bg-[#083a26] border border-[#145d3e] hover:border-[#00e676] text-white flex items-center justify-center text-xl font-bold cursor-pointer transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-4xl font-extrabold text-[#00e676] w-16 text-center font-mono">
                {guestCount}
              </span>
              <button
                type="button"
                onClick={() => setGuestCount(guestCount + 1)}
                className="w-12 h-12 rounded-xl bg-[#083a26] border border-[#145d3e] hover:border-[#00e676] text-white flex items-center justify-center text-xl font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <Button
              onClick={handleStartSession}
              disabled={createSessionMutation.isPending}
              className="w-full bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.3)] text-base cursor-pointer"
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
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#040c08] text-white pb-24 selection:bg-[#00e676] selection:text-black">
      {/* Sticky Table Header */}
      <header className="sticky top-0 z-40 bg-[#042417]/95 backdrop-blur-xl border-b border-[#0e442d] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/?table=${session.table.number}`} className="flex flex-col leading-none hover:opacity-85 transition-opacity flex-shrink-0" title="Back to Restaurant Landing Page">
              <span className="font-serif italic font-black text-lg text-white">Yoni</span>
              <span className="text-[9px] uppercase font-bold text-[#00e676] tracking-wider">Restaurant</span>
            </Link>
            <span className="h-6 w-px bg-white/20 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-[#00e676] truncate">
                  Table {session.table.number}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#083a26] border border-[#145d3e] text-white/80 font-semibold flex-shrink-0">
                  {session.guestCount} {session.guestCount === 1 ? 'Guest' : 'Guests'}
                </span>
              </div>
              {session.table.assignedWaiter && (
                <p className="text-[11px] text-white/60 truncate">
                  Waiter: <span className="text-white font-medium">{session.table.assignedWaiter.firstName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Direct Button to Restaurant Landing Page */}
            <Link
              to={`/?table=${session.table.number}`}
              className="px-3 py-2 rounded-xl bg-[#083a26] hover:bg-[#0c4d33] border border-[#145d3e] hover:border-[#00e676]/60 text-white hover:text-[#00e676] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Visit Restaurant Landing Page, Story & About"
            >
              <Home className="w-4 h-4 text-[#00e676]" />
              <span className="hidden sm:inline">Restaurant Home</span>
            </Link>

            {/* Call Waiter General Button */}
            <button
              onClick={() => setIsCallWaiterOpen(true)}
              className="p-2.5 rounded-xl bg-[#083a26] border border-[#145d3e] hover:border-[#00e676] text-[#00e676] transition-colors cursor-pointer"
              title="Call Waiter"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{cartTotal > 0 ? `${cartTotal.toFixed(0)} ETB` : 'Cart'}</span>
              {cartItemCount > 0 && (
                <span className="bg-[#032314] text-[#00e676] text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#083a26] border border-[#145d3e] focus:border-[#00e676] text-white text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00e676]"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="max-w-6xl mx-auto px-4 pb-3 overflow-x-auto no-scrollbar flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#00e676] text-[#032314] shadow-[0_0_12px_rgba(0,230,118,0.4)]'
                : 'bg-[#083a26] text-white/80 border border-[#145d3e] hover:border-white/30'
            }`}
          >
            All Dishes
          </button>
          {categories.map((cat: MenuCategory) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#00e676] text-[#032314] shadow-[0_0_12px_rgba(0,230,118,0.4)]'
                  : 'bg-[#083a26] text-white/80 border border-[#145d3e] hover:border-white/30'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Dishes Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoadingMenu ? (
          <div className="text-center py-16 text-white/60 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00e676]" />
            <p className="text-sm">Loading delicious food...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[#042417] border border-[#145d3e] rounded-3xl p-8 max-w-md mx-auto">
            <p className="text-4xl mb-2">🍽️</p>
            <h3 className="text-lg font-bold text-white mb-1">No dishes found</h3>
            <p className="text-xs text-white/60">Try searching for another dish or choose a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredItems.map((item: MenuItem) => (
              <div
                key={item.id}
                onClick={() => handleOpenItemModal(item)}
                className="group bg-[#042417] border border-[#145d3e] hover:border-[#00e676]/70 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col"
              >
                <div className="relative h-40 overflow-hidden bg-black/40">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                  {item.category && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 backdrop-blur-md text-white border border-white/20">
                      {item.category.name}
                    </span>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-[#00e676] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-extrabold text-[#00e676]">
                      {item.price.toFixed(2)} ETB
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItemModal(item);
                      }}
                      className="px-3 py-1.5 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Restaurant Heritage & Story Section link */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#042417] via-[#083a26] to-[#031d13] border border-[#145d3e] text-center space-y-3 shadow-2xl">
          <p className="text-[11px] uppercase tracking-widest font-extrabold text-[#00e676]">
            Authentic Ethiopian Fine Dining
          </p>
          <h3 className="text-xl sm:text-2xl font-serif font-black text-white italic">
            Experience the Heritage of Yoni Restaurant
          </h3>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto leading-relaxed">
            Discover our culinary story, chef philosophy, dining atmosphere, and operating hours.
          </p>
          <div className="pt-2">
            <Link
              to={`/?table=${session.table.number}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-extrabold text-xs sm:text-sm transition-all shadow-[0_4px_20px_rgba(0,230,118,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Explore Restaurant Home & Story</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <MenuItemModal
          item={selectedItemForModal}
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setSelectedItemForModal(null);
          }}
          onAddToCart={(item, qty, variant, addons, notes) =>
            handleAddToCartWithCustomization(item, qty, variant, addons, notes)
          }
        />
      )}

      {/* Cart Drawer */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] p-0 bg-[#042417] text-white border border-[#145d3e] overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b border-[#0e442d]">
            <DialogTitle className="flex items-center justify-between text-lg font-bold text-white">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00e676]" />
                Your Cart • Table {session.table.number}
              </span>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-white/60 space-y-2">
                <ShoppingCart className="w-12 h-12 mx-auto text-white/20" />
                <p className="text-sm font-medium">Your cart is empty</p>
                <p className="text-xs text-white/40">Select dishes from the menu to get started</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.map((ci) => (
                  <div
                    key={ci.id}
                    className="p-3 rounded-xl bg-[#083a26] border border-[#145d3e] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {ci.menuItem.name}
                      </p>
                      {ci.variant && (
                        <p className="text-[11px] text-[#00e676]">Size/Type: {ci.variant.name}</p>
                      )}
                      {ci.addons && ci.addons.length > 0 && (
                        <p className="text-[10px] text-white/60 truncate">
                          Addons: {ci.addons.map(a => a.name).join(', ')}
                        </p>
                      )}
                      {ci.notes && (
                        <p className="text-[10px] text-amber-300 italic">Note: {ci.notes}</p>
                      )}
                      <p className="text-xs font-extrabold text-[#00e676] mt-0.5">
                        {ci.subtotal.toFixed(2)} ETB
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(ci.id, -1)}
                        className="w-7 h-7 rounded-lg bg-[#042417] border border-[#145d3e] flex items-center justify-center text-white cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{ci.quantity}</span>
                      <button
                        onClick={() => updateQuantity(ci.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#042417] border border-[#145d3e] flex items-center justify-center text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(ci.id)}
                        className="p-1 text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-[#0e442d] bg-[#031d13] space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white/80">Total Amount</span>
                <span className="text-xl font-extrabold text-[#00e676]">
                  {cartTotal.toFixed(2)} ETB
                </span>
              </div>

              <Button
                onClick={handleCallWaiterWithCart}
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.4)] text-sm cursor-pointer"
              >
                <Bell className="w-4 h-4 mr-2" />
                Call Waiter to Place Order
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Call Waiter Modal */}
      <Dialog open={isCallWaiterOpen} onOpenChange={setIsCallWaiterOpen}>
        <DialogContent className="sm:max-w-md bg-[#042417] text-white border border-[#145d3e]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Bell className="w-5 h-5 text-[#00e676]" />
              Need Assistance? • Table {session.table.number}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/70">
              Your waiter will be notified immediately to assist your table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-3">
            <button
              onClick={async () => {
                await waiterCallApi.createCall({
                  sessionId: session.id,
                  requestType: 'ASSISTANCE',
                  selectedItems: { notes: 'Customer requested waiter assistance' },
                });
                setIsCallWaiterOpen(false);
                toast.success('Waiter called! Someone will be with you shortly.');
              }}
              className="w-full p-3.5 rounded-xl bg-[#083a26] border border-[#145d3e] hover:border-[#00e676] text-left transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-white">Call Waiter</p>
                <p className="text-xs text-white/60">Water, napkins, questions, or help</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#00e676]" />
            </button>

            <button
              onClick={() => {
                setIsCallWaiterOpen(false);
                setIsBillDialogOpen(true);
              }}
              className="w-full p-3.5 rounded-xl bg-[#083a26] border border-[#145d3e] hover:border-[#00e676] text-left transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-white">Request Bill & Pay</p>
                <p className="text-xs text-white/60">Ready to pay cash, Telebirr, CBE, or card</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#00e676]" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Order Status Tracker */}
      {activeOrder && (
        <LiveOrderStatusTracker
          order={activeOrder}
          tableNumber={session.table.number}
          onRequestBill={() => setIsBillDialogOpen(true)}
          onOrderCancelled={() => setActiveOrder(null)}
        />
      )}

      {/* Bill Request Dialog */}
      {activeOrder && (
        <BillRequestDialog
          open={isBillDialogOpen}
          onOpenChange={setIsBillDialogOpen}
          order={activeOrder}
          sessionId={session.id}
          tableNumber={session.table.number}
          tableId={session.table.id}
          waiterId={session.table.assignedWaiterId || ''}
        />
      )}
    </div>
  );
}
