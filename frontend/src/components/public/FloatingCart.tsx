import { ShoppingCart, X, Plus, Minus, PhoneCall } from 'lucide-react';
import { useState } from 'react';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: { name: string };
  variant?: {
    name: string;
    price: number;
  };
  addons?: Array<{
    name: string;
    price: number;
  }>;
  notes?: string;
  subtotal: number;
}

export interface FloatingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCallWaiter: () => void;
  tableNumber?: string;
}

export default function FloatingCart({ items, onUpdateQuantity, onRemoveItem, onCallWaiter, tableNumber }: FloatingCartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);

  const formatPrice = (price: number) => `${price.toFixed(2)} ETB`;

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-full shadow-2xl hover:shadow-green-600/50 transition-all duration-300 hover:scale-110 flex items-center gap-3"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {totalItems}
          </div>
        )}
        <span className="font-semibold">{formatPrice(totalPrice)}</span>
      </button>

      {/* Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Cart Panel */}
          <div className="relative w-full md:w-96 h-full md:h-auto md:max-h-[90vh] bg-gray-900 md:rounded-tl-2xl md:rounded-bl-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Your Order</h2>
                {tableNumber && (
                  <p className="text-sm text-gray-400">Table {tableNumber}</p>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700"
                >
                  <div className="flex gap-3">
                    {/* Image */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-600/20 to-yellow-600/20 flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                      {item.variant && (
                        <p className="text-xs text-gray-400">{item.variant.name}</p>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-xs text-gray-400">
                          + {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-500 italic">Note: {item.notes}</p>
                      )}

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 bg-gray-700 rounded p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-600 rounded"
                          >
                            <Minus className="w-3 h-3 text-white" />
                          </button>
                          <span className="px-2 text-sm font-semibold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-600 rounded"
                          >
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 space-y-3">
              {/* Total */}
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-green-400">{formatPrice(totalPrice)}</span>
              </div>

              {/* Call Waiter Button */}
              <button
                onClick={onCallWaiter}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Call Waiter to Place Order</span>
              </button>

              <p className="text-xs text-gray-400 text-center">
                A waiter will come to your table to confirm your order
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
