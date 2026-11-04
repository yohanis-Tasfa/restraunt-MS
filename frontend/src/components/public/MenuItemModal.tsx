import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Utensils, Check } from 'lucide-react';

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
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

interface MenuItemModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, selectedVariant?: MenuVariant, selectedAddons?: MenuAddon[], notes?: string) => void;
}

export default function MenuItemModal({ item, isOpen, onClose, onAddToCart }: MenuItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | undefined>();
  const [selectedAddons, setSelectedAddons] = useState<MenuAddon[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setQuantity(1);
      setSelectedVariant(undefined);
      setSelectedAddons([]);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const incrementQuantity = () => setQuantity(quantity + 1);
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const toggleAddon = (addon: MenuAddon) => {
    if (selectedAddons.find((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const calculateTotal = () => {
    let total = selectedVariant ? selectedVariant.price : item.price;
    selectedAddons.forEach((addon) => {
      total += addon.price;
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(item, quantity, selectedVariant, selectedAddons, notes);
    onClose();
  };

  const formatPrice = (price: number) => `${price.toFixed(2)} ETB`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Image */}
        <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden rounded-t-2xl">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-600/20 to-yellow-600/20 flex items-center justify-center text-white/40">
              <Utensils className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
          )}
          {item.category && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-xs font-semibold text-white">{item.category.name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Title and Price */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5">{item.name}</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-2 leading-relaxed">
              {item.description || 'Delicious Ethiopian dish prepared with authentic spices and fresh ingredients.'}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-green-400">{formatPrice(item.price)}</p>
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Size Options</h3>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={!variant.isAvailable}
                    className={`p-2.5 sm:p-3 rounded-lg border-2 transition-all cursor-pointer ${selectedVariant?.id === variant.id
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                      } ${!variant.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-semibold text-xs sm:text-sm">{variant.name}</div>
                    <div className="text-xs text-green-300 sm:text-sm">{formatPrice(variant.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Add-ons</h3>
              <div className="space-y-1.5 sm:space-y-2">
                {item.addons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    disabled={!addon.isAvailable}
                    className={`w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all flex items-center justify-between cursor-pointer ${selectedAddons.find((a) => a.id === addon.id)
                        ? 'bg-green-600/20 border-green-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                      } ${!addon.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center ${selectedAddons.find((a) => a.id === addon.id) ? 'bg-green-600 border-green-500' : 'border-gray-600'
                        }`}>
                        {selectedAddons.find((a) => a.id === addon.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-xs sm:text-sm">{addon.name}</span>
                    </div>
                    <span className="text-green-400 text-xs sm:text-sm font-semibold">+{formatPrice(addon.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">Special Instructions</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests? (e.g., no onions, extra spicy)"
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs sm:text-sm placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
              rows={2}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 pt-1">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between sm:justify-center gap-2 bg-gray-800 rounded-xl border border-gray-700 p-1 sm:p-1.5">
              <button
                onClick={decrementQuantity}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              <span className="px-4 text-base sm:text-lg font-bold text-white">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add to Cart · {formatPrice(calculateTotal())}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
