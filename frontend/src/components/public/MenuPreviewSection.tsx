import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Clock, Star, TrendingUp, ChevronLeft, ChevronRight, Receipt, Search, X, Filter, ChevronDown, Utensils } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Slide & scroll states
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

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
  const checkOrderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();

    // Check if customer has an active order for bill requests & live tracking
    if (tableNumber) {
      checkForActiveOrder();
      // Poll active order status every 8 seconds for real-time kitchen & service updates
      const pollTimer = setInterval(() => {
        checkForActiveOrder();
      }, 8000);

      return () => {
        clearInterval(pollTimer);
        if (checkOrderIntervalRef.current) {
          clearInterval(checkOrderIntervalRef.current);
          checkOrderIntervalRef.current = null;
        }
      };
    }
  }, [tableNumber]);

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
  }, [allItems, selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const cats = await menuApi.getCategories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const checkForActiveOrder = async () => {
    if (!tableNumber) return;
    try {
      // Fetch public active order status for this table (no 401 redirect)
      const res = await fetch(`/api/customer-sessions/by-table/${encodeURIComponent(tableNumber)}/active-order`);
      if (res.ok) {
        const json = await res.json();
        const order = json.data;

        if (order) {
          setActiveOrder(order);
          // Set session data if not already set
          if (order.table) {
            setSessionData((prev: any) => prev || {
              id: order.sessionId || `session-${order.table.id}`,
              tableId: order.table.id,
              table: order.table,
            });
          }
        } else {
          setActiveOrder(null);
        }
      }
    } catch (error) {
      console.error('Failed to check for active order:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const items = await menuApi.getMenuItems({ isAvailable: true });
      setAllItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      setAllItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Split filteredItems into slides of 8 items (2 rows x 4 columns = 2x4 per slide)
  const slides: MenuItem[][] = [];
  for (let i = 0; i < filteredItems.length; i += ITEMS_PER_PAGE) {
    slides.push(filteredItems.slice(i, i + ITEMS_PER_PAGE));
  }
  const totalSlides = Math.max(1, slides.length);

  // Horizontal scroll buttons
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Jump to specific slide
  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        left: slideIndex * container.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  // Track scroll position to update arrow states & active dot indicator (ooo)
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);

    if (clientWidth > 0 && totalSlides > 1) {
      const newSlide = Math.min(
        totalSlides - 1,
        Math.max(0, Math.round(scrollLeft / clientWidth))
      );
      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    }
  };

  // Mouse drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.3;
    if (Math.abs(walk) > 6) {
      hasDragged.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Reset scroll when category or search changes
  useEffect(() => {
    setCurrentSlide(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      setCanScrollLeft(false);
      setCanScrollRight(filteredItems.length > ITEMS_PER_PAGE);
    }
  }, [filteredItems, selectedCategory]);

  const handleAddToOrder = (item: MenuItem) => {
    if (hasDragged.current) return;
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
        `Waiter notified! Your waiter will come to Table ${tableNumber} to confirm your order. After the waiter sends your order to the kitchen, you can request your bill.`,
        { duration: 6000 }
      );

      // Check for order after waiter has time to process (poll every 5 seconds)
      if (checkOrderIntervalRef.current) {
        clearInterval(checkOrderIntervalRef.current);
      }
      checkOrderIntervalRef.current = setInterval(() => {
        checkForActiveOrder();
      }, 5000);

      // Stop checking after 2 minutes
      setTimeout(() => {
        if (checkOrderIntervalRef.current) {
          clearInterval(checkOrderIntervalRef.current);
          checkOrderIntervalRef.current = null;
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

    if (!sessionData?.id) {
      toast.error('Session not found. Please refresh the page.');
      return;
    }

    const tableId = sessionData?.tableId || sessionData?.table?.id || activeOrder?.tableId;
    if (!tableId) {
      toast.error('Table information not found. Please refresh the page.');
      return;
    }

    const waiterId =
      sessionData?.table?.assignedWaiterId ||
      activeOrder?.table?.assignedWaiterId ||
      activeOrder?.createdById;

    if (!waiterId) {
      toast.error('No staff member available. Please call for assistance.');
      return;
    }

    setIsBillDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ETB`;
  };

  return (
    <section id="menu" className="py-12 sm:py-16 scroll-mt-20 relative overflow-hidden bg-base-200 text-base-content border-t border-base-300 dark:border-[#12281d] transition-colors duration-300">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-6 max-w-2xl mx-auto space-y-1.5">
          {/* Main Title: Our Menu */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif italic font-black tracking-tight drop-shadow-sm dark:drop-shadow-2xl">
            <span className="text-base-content">Our </span>
            <span className="text-[#00c853] dark:text-[#00e676] drop-shadow-[0_0_30px_rgba(0,230,118,0.4)]">Menu</span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base font-serif italic text-base-content/75 tracking-wide">
            Delicious food, made with love
          </p>

          {/* Elegant Green Curved Accent Line */}
          <div className="flex justify-center pt-0.5">
            <svg className="w-48 sm:w-60 h-3 text-[#00e676] overflow-visible" viewBox="0 0 200 12" fill="none">
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

        {/* Search and Category Filter Dropdown (Side-by-Side) */}
        <div className="mb-6">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by dish name, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-base-100 border border-base-300 dark:border-[#1b3d2e] focus:border-[#00e676] text-base-content placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00e676]/25 transition shadow-sm text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-base-content rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative w-full sm:w-56 flex-shrink-0">
              <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#00c853] dark:text-[#00e676] pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter dishes by category"
                className="w-full appearance-none pl-10 pr-9 py-2.5 bg-base-100 border border-base-300 dark:border-[#1b3d2e] focus:border-[#00e676] text-base-content font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00e676]/25 transition shadow-sm text-sm cursor-pointer"
              >
                <option value="all">All Categories</option>
                {(Array.isArray(categories) ? categories : []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Dish Items Content - Restored 8-Item Horizontal Slider */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-max items-start content-start gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl p-3.5 bg-base-100 border border-base-300 dark:border-[#1b3d2e] animate-pulse space-y-2.5">
                <div className="w-full h-36 sm:h-40 rounded-xl bg-base-200" />
                <div className="h-5 rounded w-3/4 bg-base-200" />
                <div className="h-4 rounded w-1/2 bg-base-200" />
                <div className="h-9 rounded-xl w-full bg-base-200" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <Utensils className="w-12 h-12 mb-3 mx-auto text-base-content/40" />
            <p className="text-base text-base-content/70">
              No menu items available at the moment.
            </p>
            <p className="text-xs mt-1.5 text-base-content/50">
              Please check back later or contact us for assistance.
            </p>
          </div>
        ) : (
          <div className="relative group/carousel px-1">
            {/* Left Floating Arrow Button */}
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous slide"
                className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-base-100/95 dark:bg-[#091712]/95 border border-base-300 dark:border-white/15 text-base-content hover:text-[#032314] hover:bg-[#00e676] hover:border-[#00e676] shadow-lg backdrop-blur-md transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Floating Arrow Button */}
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Next slide"
                className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-base-100/95 dark:bg-[#091712]/95 border border-base-300 dark:border-white/15 text-base-content hover:text-[#032314] hover:bg-[#00e676] hover:border-[#00e676] shadow-lg backdrop-blur-md transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Horizontally scrollable container for 2x4 slides (8 items per slide) */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="flex items-start gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 no-scrollbar cursor-grab active:cursor-grabbing select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {slides.map((slideItems, slideIdx) => (
                <div
                  key={slideIdx}
                  className="w-full flex-shrink-0 snap-start grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-max content-start items-start gap-2.5 sm:gap-4 md:gap-5"
                >
                  {slideItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-base-100 border border-base-300 dark:border-[#1b3d2e] hover:border-[#00e676]/70 transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-lg dark:shadow-none hover:dark:shadow-[0_12px_24px_-4px_rgba(0,230,118,0.25)] flex flex-col h-auto"
                    >
                      {/* Image */}
                      <div className="relative h-28 xs:h-32 sm:h-40 md:h-44 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            draggable={false}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#00e676]/20 to-gray-200 dark:to-black/60 flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <Utensils className="w-8 h-8 sm:w-10 sm:h-10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-[#091712] via-transparent to-transparent opacity-60 pointer-events-none" />

                        {/* Category Badge */}
                        {item.category && (
                          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-full border border-white/20">
                            <span className="text-[9px] sm:text-[11px] font-semibold text-white">
                              {item.category.name}
                            </span>
                          </div>
                        )}
                        {/* Popular Badge */}
                        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 px-1.5 sm:px-2.5 py-0.5 bg-[#00e676] text-[#032314] rounded-full font-bold text-[9px] sm:text-[11px] flex items-center gap-1 shadow-md">
                          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden xs:inline">Popular</span>
                        </div>
                      </div>

                      {/* Content: Title, Amount & Add to Order tightly grouped as one compact box */}
                      <div className="p-2 sm:p-3 sm:p-3.5 space-y-1.5 sm:space-y-2">
                        {/* Title */}
                        <h3
                          className="text-xs sm:text-base md:text-lg font-bold text-base-content group-hover:text-[#00c853] dark:group-hover:text-[#00e676] transition-colors duration-200 line-clamp-1"
                          title={item.name}
                        >
                          {item.name}
                        </h3>

                        {/* Price & Rating */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-base md:text-lg font-extrabold text-[#00a844] dark:text-[#00e676] leading-none">
                            {formatPrice(item.price)}
                          </span>
                          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 fill-yellow-400" />
                            <span className="text-[10px] sm:text-[11px] font-bold text-yellow-600 dark:text-yellow-400">4.8</span>
                          </div>
                        </div>

                        {/* Order Button */}
                        <button
                          onClick={() => handleAddToOrder(item)}
                          className="w-full py-1.5 sm:py-2.5 px-2 sm:px-3 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-sm hover:shadow-[0_0_16px_rgba(0,230,118,0.4)] active:scale-[0.98]"
                        >
                          <span className="hidden xs:inline">Add to Order</span>
                          <span className="xs:hidden">Add</span>
                          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom Dots Indicator (ooo) */}
            {totalSlides > 1 && (
              <div className="mt-6 sm:mt-7 flex items-center justify-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`transition-all duration-300 cursor-pointer ${currentSlide === index
                      ? 'w-7 h-2 rounded-full bg-[#00e676] shadow-[0_0_10px_#00e676]'
                      : 'w-2 h-2 rounded-full bg-base-300 dark:bg-white/25 hover:bg-[#00e676]/60'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
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
