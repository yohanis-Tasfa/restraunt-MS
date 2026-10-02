import { useState, useEffect } from 'react';
import { ArrowRight, Clock, Star, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { menuApi } from '../../api/menu';
import { useSearchParams } from 'react-router-dom';
import MenuItemModal from './MenuItemModal';
import FloatingCart, { type CartItem } from './FloatingCart';
import OrderTypeDialog from './OrderTypeDialog';
import toast from 'react-hot-toast';

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
  
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Order type dialog state
  const [isOrderTypeDialogOpen, setIsOrderTypeDialogOpen] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

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
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = allItems.slice(startIndex, endIndex);

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

      // Keep cart for waiter to see, don't clear it
    } catch (error) {
      console.error('Failed to call waiter:', error);
      toast.error('Failed to notify waiter. Please try again or call for assistance.');
    }
  };

  const handleViewFullMenu = () => {
    // Scroll to top of menu section
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} ETB`;
  };

  return (
    <section id="menu" className="py-12 bg-black relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-40 right-20 w-96 h-96 bg-green-500 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-yellow-500 rounded-full blur-3xl" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/50 backdrop-blur-sm border border-green-700/50 rounded-full mb-4">
            <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">OUR MENU</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-2xl">
            Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500">Delicious Menu</span>
          </h2>
          <p className="text-lg text-gray-300 drop-shadow-md">
            From traditional Ethiopian dishes to modern fusion cuisine, discover flavors that tell a story
          </p>
        </div>

        {/* Popular Items Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 animate-pulse">
                <div className="w-full h-48 bg-gray-700/50 rounded-xl mb-4" />
                <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-700/50 rounded w-full mb-2" />
                <div className="h-4 bg-gray-700/50 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-400 text-lg">No menu items available at the moment.</p>
            <p className="text-gray-500 text-sm mt-2">Please check back later or contact us for assistance.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-black/40 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/10"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-600/20 to-yellow-600/20 flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                      </div>
                    )}
                    {/* Category Badge */}
                    {item.category && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/20">
                        <span className="text-xs font-semibold text-white">{item.category.name}</span>
                      </div>
                    )}
                    {/* Popular Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-green-600/90 backdrop-blur-sm rounded-full border border-green-500/50 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-white" />
                      <span className="text-xs font-semibold text-white">Popular</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300 drop-shadow-md">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2 group-hover:text-gray-300 transition-colors">
                      {item.description || 'Delicious Ethiopian dish prepared with authentic spices and fresh ingredients.'}
                    </p>

                    {/* Price and Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-green-400">{formatPrice(item.price)}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-600/20 rounded-full border border-yellow-600/30">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-400">4.8</span>
                      </div>
                    </div>

                    {/* Order Button */}
                    <button 
                      onClick={() => handleAddToOrder(item)}
                      className="w-full px-4 py-2 bg-green-600/20 backdrop-blur-sm text-green-400 border border-green-600/30 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105"
                    >
                      <span>Add to Cart</span>
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
                  className="px-4 py-2 bg-black/40 backdrop-blur-md text-white border border-white/10 rounded-lg font-semibold hover:bg-green-600/20 hover:border-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                      className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                        currentPage === page
                          ? 'bg-green-600 text-white border-2 border-green-500'
                          : 'bg-black/40 backdrop-blur-md text-gray-300 border border-white/10 hover:bg-green-600/20 hover:border-green-500/50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-black/40 backdrop-blur-md text-white border border-white/10 rounded-lg font-semibold hover:bg-green-600/20 hover:border-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
