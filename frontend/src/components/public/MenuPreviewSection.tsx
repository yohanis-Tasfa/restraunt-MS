import { useState, useEffect } from 'react';
import { ArrowRight, Clock, Star, TrendingUp, ChevronLeft, ChevronRight, Receipt, Search, X } from 'lucide-react';
import { menuApi } from '../../api/menu';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import MenuItemModal from './MenuItemModal';
import FloatingCart, { type CartItem } from './FloatingCart';
import OrderTypeDialog from './OrderTypeDialog';
import BillRequestDialog from './BillRequestDialog';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';

// Simple UUID generator
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

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

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: {
    id: string;
    name: string;
  };
  isAvailable: boolean;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

const ITEMS_PER_PAGE = 8;

export default function MenuPreviewSection() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');
  const { theme } = useTheme();

  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Order type dialog state
  const [isOrderTypeDialogOpen, setIsOrderTypeDialogOpen] = useState(false);

  // Bill request state
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [checkOrderInterval, setCheckOrderInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();

    // Check if customer has an active order for bill requests
    if (tableNumber) {
      checkForActiveOrder();
    }

    // Cleanup interval on unmount
    return () => {
      if (checkOrderInterval) {
        clearInterval(checkOrderInterval);
      }
    };
  }, [tableNumber, checkOrderInterval]);

  // Filter items based on search and category
  useEffect(() => {
    let filtered = allItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category?.id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.name.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allItems, selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const cats = await menuApi.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const checkForActiveOrder = async () => {
    try {
      console.log('🔍 Checking for active order...');

      // Get customer session
      const sessionResponse = await fetch('/api/customer-sessions/by-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          guestCount: 1,
        }),
      });

      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        setSessionData(session);
        console.log('📋 Session data:', session);

        // Get table ID from session
        const tableId = session.tableId || session.table?.id;
        console.log('🏷️ Table ID:', tableId);

        if (!tableId) {
          console.error('❌ No table ID found in session');
          return;
        }

        // Check for unpaid orders on this table using tableId
        console.log(`🔎 Fetching orders for table: ${tableId}`);
        const ordersResponse = await apiClient.get(`/orders?tableId=${tableId}`);
        console.log('📦 Orders response:', ordersResponse.data);

        if (ordersResponse.data?.data && ordersResponse.data.data.length > 0) {
          console.log(`✅ Found ${ordersResponse.data.data.length} orders`);

          // Filter for unpaid orders with active status
          const unpaidOrders = ordersResponse.data.data.filter(
            (order: any) => {
              const isUnpaid = order.paymentStatus === 'UNPAID';
              const isActive = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'].includes(order.status);
              console.log(`Order ${order.orderNumber}: paymentStatus=${order.paymentStatus}, status=${order.status}, isUnpaid=${isUnpaid}, isActive=${isActive}`);
              return isUnpaid && isActive;
            }
          );

          console.log(`💰 Found ${unpaidOrders.length} unpaid active orders`);

          if (unpaidOrders.length > 0) {
            // Get the most recent unpaid order
            const order = unpaidOrders[0];
            setActiveOrder(order);
            console.log('🎯 Set active order:', order);

            // Stop polling once we find an order
            if (checkOrderInterval) {
              clearInterval(checkOrderInterval);
              setCheckOrderInterval(null);
              console.log('⏸️ Stopped polling - order found');
            }
          } else {
            console.log('⚠️ No unpaid active orders found');
          }
        } else {
          console.log('⚠️ No orders found for this table');
        }
      } else {
        console.error('❌ Failed to get session:', await sessionResponse.text());
      }
    } catch (error) {
      console.error('❌ Failed to check for active order:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const items = await menuApi.getMenuItems({ isAvailable: true });
      setAllItems(items);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      setAllItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to menu section
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddToOrder = (item: MenuItem) => {
    // Open modal for item customization
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (
    item: MenuItem,
    quantity: number,
    selectedVariant?: MenuVariant,
    selectedAddons?: MenuAddon[],
    notes?: string
  ) => {
    const basePrice = selectedVariant ? selectedVariant.price : item.price;
    const addonsPrice = selectedAddons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
    const itemPrice = basePrice + addonsPrice;
    const subtotal = itemPrice * quantity;

    const cartItem: CartItem = {
      id: generateId(),
      menuItemId: item.id,
      name: item.name,
      price: itemPrice,
      quantity,
      image: item.image,
      category: item.category,
      variant: selectedVariant ? { name: selectedVariant.name, price: selectedVariant.price } : undefined,
      addons: selectedAddons?.map(addon => ({ name: addon.name, price: addon.price })),
      notes,
      subtotal,
    };

    setCart([...cart, cartItem]);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === itemId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const handleCallWaiter = async () => {
    if (!tableNumber) {
      toast.error('Table number not found. Please scan the QR code from your table.');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty. Please add items before calling a waiter.');
      return;
    }

    // Show order type dialog
    setIsOrderTypeDialogOpen(true);
  };

  const handleOrderTypeSelected = async (orderType: "DINE_IN" | "TAKEAWAY") => {
    setIsOrderTypeDialogOpen(false);

    try {
      // First, create or get customer session for this table
      const sessionResponse = await fetch('/api/customer-sessions/by-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          guestCount: 1,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const session = await sessionResponse.json();

      // Prepare cart data for waiter
      const cartData = {
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category,
          variant: item.variant,
          addons: item.addons,
          notes: item.notes,
          subtotal: item.subtotal,
        })),
        totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: cart.reduce((sum, item) => sum + item.subtotal, 0),
        orderType,
        tableNumber,
      };

      // Call waiter with cart data
      const callResponse = await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          requestType: 'ORDER_READY',
          selectedItems: cartData,
        }),
      });

      if (!callResponse.ok) {
        throw new Error('Failed to notify waiter');
      }

      const call = await callResponse.json();

      toast.success(
        `Waiter has been notified! They will come to Table ${tableNumber} shortly to confirm your ${orderType === 'DINE_IN' ? 'dine-in' : 'takeaway'} order.`
      );

      // Clear cart and check for active order
      setCart([]);

      // Show a message to customer
      toast.success(
        `✅ Waiter notified!\n\n📱 Your waiter will come to Table ${tableNumber} to confirm your order.\n\n💡 After the waiter sends your order to the kitchen, you can request your bill.`,
        { duration: 6000 }
      );

      // Check for order after waiter has time to process (poll every 3 seconds)
      const interval = setInterval(() => {
        checkForActiveOrder();
      }, 3000);
      setCheckOrderInterval(interval);

      // Stop checking after 2 minutes
      setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          setCheckOrderInterval(null);
        }
      }, 120000);
    } catch (error) {
      console.error('Failed to call waiter:', error);
      toast.error('Failed to notify waiter. Please try again or call for assistance.');
    }
  };

  const handleRequestBill = () => {
    if (!activeOrder) {
      toast.error('No active order found');
      return;
    }

    // Debug logging
    console.log('📋 Active Order:', activeOrder);
    console.log('📋 Session Data:', sessionData);

    // Check if we have all required data
    if (!sessionData?.id) {
      toast.error('Session not found. Please refresh the page.');
      return;
    }

    const tableId = sessionData?.tableId || sessionData?.table?.id || activeOrder?.tableId;
    if (!tableId) {
      toast.error('Table information not found. Please refresh the page.');
      return;
    }

    // Try to get waiter from multiple sources
    const waiterId =
      sessionData?.table?.assignedWaiterId ||
      activeOrder?.table?.assignedWaiterId ||
      activeOrder?.createdById; // Fallback to the person who created the order

    console.log('🏷️ Table ID:', tableId);
    console.log('👤 Waiter ID:', waiterId);

    if (!waiterId) {
      toast.error('No staff member available. Please call for assistance.');
      return;
    }

    setIsBillDialogOpen(true);
  };

  const handleViewFullMenu = () => {
    // Scroll to top of menu section
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ETB`;
  };

  return (
    <section id="menu" className="py-20 relative overflow-hidden bg-[#030a07] text-white">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-40 right-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 max-w-2xl mx-auto space-y-2">
          {/* Main Title: Our Menu */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif italic font-black tracking-tight drop-shadow-2xl">
            <span className="text-white">Our </span>
            <span className="text-[#00e676] drop-shadow-[0_0_30px_rgba(0,230,118,0.55)]">Menu</span>
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl font-serif italic text-gray-300 tracking-wide">
            Delicious food, made with love
          </p>

          {/* Elegant Green Curved Accent Line */}
          <div className="flex justify-center pt-0.5">
            <svg className="w-56 sm:w-72 h-3.5 text-[#00e676] overflow-visible" viewBox="0 0 200 12" fill="none">
              <defs>
                <linearGradient id="menuWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00e676" stopOpacity="0" />
                  <stop offset="25%" stopColor="#00e676" stopOpacity="1" />
                  <stop offset="50%" stopColor="#69f0ae" stopOpacity="1" />
                  <stop offset="75%" stopColor="#00e676" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00e676" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 10 2 Q 100 11 190 2"
                stroke="url(#menuWaveGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(0,230,118,0.8)]"
              />
            </svg>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-10 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by dish name, ingredients, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-[#091712]/90 backdrop-blur-xl border border-[#1b3d2e] focus:border-[#00e676] text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00e676]/25 transition shadow-inner text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${selectedCategory === 'all'
                  ? 'bg-[#00e676] text-[#032314] shadow-[0_0_15px_rgba(0,230,118,0.35)]'
                  : 'bg-[#091712] border border-[#1b3d2e] text-gray-300 hover:border-[#00e676]/60 hover:text-[#00e676]'
                }`}
            >
              All Dishes
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${selectedCategory === category.id
                    ? 'bg-[#00e676] text-[#032314] shadow-[0_0_15px_rgba(0,230,118,0.35)]'
                    : 'bg-[#091712] border border-[#1b3d2e] text-gray-300 hover:border-[#00e676]/60 hover:text-[#00e676]'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Results Count */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Found <span className="text-[#00e676] font-bold">{filteredItems.length}</span> {filteredItems.length === 1 ? 'dish' : 'dishes'}
                {searchQuery && <> matching "<span className="text-white font-medium">{searchQuery}</span>"</>}
              </p>
            </div>
          )}
        </div>

        {/* Popular Items Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-3xl p-5 bg-[#091712]/80 border border-[#1b3d2e] animate-pulse">
                <div className="w-full h-56 sm:h-64 rounded-2xl mb-4 bg-gray-800/50" />
                <div className="h-6 rounded w-3/4 mb-2 bg-gray-800/50" />
                <div className="h-4 rounded w-full mb-2 bg-gray-800/50" />
                <div className="h-4 rounded w-2/3 bg-gray-800/50" />
              </div>
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No menu items available at the moment.
            </p>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              Please check back later or contact us for assistance.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-3xl overflow-hidden bg-[#091712]/90 backdrop-blur-md border border-[#1b3d2e] hover:border-[#00e676]/70 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-5px_rgba(0,230,118,0.25)] flex flex-col justify-between"
                >
                  <div>
                    {/* Image */}
                    <div className="relative h-56 sm:h-64 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#00e676]/20 to-black/60 flex items-center justify-center">
                          <span className="text-6xl">🍽️</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#091712] via-transparent to-transparent opacity-60" />

                      {/* Category Badge */}
                      {item.category && (
                        <div className="absolute top-3.5 left-3.5 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full border border-white/20">
                          <span className="text-xs font-semibold text-white">
                            {item.category.name}
                          </span>
                        </div>
                      )}
                      {/* Popular Badge */}
                      <div className="absolute top-3.5 right-3.5 px-3.5 py-1 bg-[#00e676] text-[#032314] rounded-full font-bold text-xs flex items-center gap-1 shadow-md">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Popular</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00e676] transition-colors duration-200">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed">
                        {item.description || 'Delicious Ethiopian dish prepared with authentic spices and fresh ingredients.'}
                      </p>

                      {/* Price and Rating */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xl font-extrabold text-[#00e676]">{formatPrice(item.price)}</span>
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold text-yellow-400">4.8</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    {/* Order Button */}
                    <button
                      onClick={() => handleAddToOrder(item)}
                      className="w-full py-3.5 px-4 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold text-sm sm:text-base rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-[0_0_25px_rgba(0,230,118,0.4)]"
                    >
                      <span>Add to Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 backdrop-blur-md border rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${theme === 'dark'
                    ? 'bg-black/40 text-white border-white/10 hover:bg-green-600/20 hover:border-green-500/50'
                    : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-green-100/70 hover:border-green-500/50'
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${currentPage === page
                        ? 'bg-green-600 text-white border-2 border-green-500'
                        : theme === 'dark'
                          ? 'bg-black/40 backdrop-blur-md text-gray-300 border border-white/10 hover:bg-green-600/20 hover:border-green-500/50'
                          : 'bg-white/60 backdrop-blur-md text-gray-700 border border-gray-200 hover:bg-green-100/70 hover:border-green-500/50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 backdrop-blur-md border rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${theme === 'dark'
                    ? 'bg-black/40 text-white border-white/10 hover:bg-green-600/20 hover:border-green-500/50'
                    : 'bg-white/60 text-gray-900 border-gray-200 hover:bg-green-100/70 hover:border-green-500/50'
                    }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* Menu Item Modal */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Order Type Dialog */}
      <OrderTypeDialog
        open={isOrderTypeDialogOpen}
        onClose={() => setIsOrderTypeDialogOpen(false)}
        onSelectType={handleOrderTypeSelected}
      />

      {/* Bill Request Dialog */}
      {activeOrder && sessionData && (
        <BillRequestDialog
          open={isBillDialogOpen}
          onOpenChange={setIsBillDialogOpen}
          order={activeOrder}
          sessionId={sessionData.id}
          tableNumber={tableNumber || ''}
          tableId={sessionData.tableId || sessionData.table?.id || activeOrder.tableId}
          waiterId={
            sessionData.table?.assignedWaiterId ||
            activeOrder.table?.assignedWaiterId ||
            activeOrder.createdById ||
            ''
          }
        />
      )}

      {/* Floating Request Bill Button */}
      {activeOrder && tableNumber && (
        <button
          onClick={handleRequestBill}
          className="fixed bottom-24 right-6 z-50 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-2 border-2 border-blue-500/50 animate-bounce"
        >
          <Receipt className="w-5 h-5" />
          <span className="font-semibold">Request Bill</span>
        </button>
      )}

      {/* Waiting for Order Message - Shows after calling waiter but before order is ready */}
      {!activeOrder && tableNumber && cart.length === 0 && (
        <div className="fixed bottom-24 right-6 z-50 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-2xl border-2 border-green-500/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div>
              <p className="font-semibold text-sm">Waiting for Order</p>
              <p className="text-xs opacity-90">Bill request available after order is sent to kitchen</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart */}
      <FloatingCart
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCallWaiter={handleCallWaiter}
        tableNumber={tableNumber || undefined}
      />
    </section>
  );
}
