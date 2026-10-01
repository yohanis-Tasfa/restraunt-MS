import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Image */}
        <div className="relative h-64 overflow-hidden rounded-t-2xl">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-600/20 to-yellow-600/20 flex items-center justify-center">
              <span className="text-8xl">🍽️</span>
            </div>
          )}
          {item.category && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full border border-white/20">
              <span className="text-sm font-semibold text-white">{item.category.name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Price */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">{item.name}</h2>
            <p className="text-gray-400 text-sm mb-3">
              {item.description || 'Delicious Ethiopian dish prepared with authentic spices and fresh ingredients.'}
            </p>
            <p className="text-2xl font-bold text-green-400">{formatPrice(item.price)}</p>
          </div>

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Size Options</h3>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={!variant.isAvailable}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                    } ${!variant.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-semibold">{variant.name}</div>
                    <div className="text-sm">{formatPrice(variant.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Add-ons</h3>
              <div className="space-y-2">
                {item.addons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    disabled={!addon.isAvailable}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                      selectedAddons.find((a) => a.id === addon.id)
                        ? 'bg-green-600/20 border-green-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                    } ${!addon.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedAddons.find((a) => a.id === addon.id) ? 'bg-green-600 border-green-500' : 'border-gray-600'
                      }`}>
                        {selectedAddons.find((a) => a.id === addon.id) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="font-medium">{addon.name}</span>
                    </div>
                    <span className="text-green-400">+{formatPrice(addon.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Special Instructions</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests? (e.g., no onions, extra spicy)"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
              rows={3}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-700 p-1">
              <button
                onClick={decrementQuantity}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <span className="px-4 text-lg font-semibold text-white">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart · {formatPrice(calculateTotal())}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
