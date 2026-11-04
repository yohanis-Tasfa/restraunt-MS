import { useCartStore } from '../../store/cartStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';

interface CartSectionProps {
  onCheckout: () => void;
}

export default function CartSection({ onCheckout }: CartSectionProps) {
  const { items, updateQuantity, removeItem, getItemCount, getSubtotal, getTax, getTotal } =
    useCartStore();

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#091a13]">
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200 dark:border-[#143225] bg-white dark:bg-[#091a13]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600 dark:text-[#00e676]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Order</h2>
          </div>
          {itemCount > 0 && (
            <Badge variant="default" className="bg-green-600 dark:bg-[#00e676] dark:text-[#032314] font-bold">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-[#091a13]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#0c2219] flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Cart is empty</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Add items from the menu to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-[#071a12] rounded-xl p-3 border border-gray-200 dark:border-[#143225]"
              >
                {/* Item Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{item.menuItem.name}</h4>
                    {item.variant && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Variant: {item.variant.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Addons */}
                {item.addons.length > 0 && (
                  <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                    {item.addons.map((addon) => (
                      <div key={addon.addonId}>
                        + {addon.addon.name} (×{addon.quantity})
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity Controls & Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 dark:border-[#143225] dark:text-gray-200 dark:hover:bg-[#12281d] cursor-pointer"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-semibold w-8 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 dark:border-[#143225] dark:text-gray-200 dark:hover:bg-[#12281d] cursor-pointer"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-[#00e676]">
                    {item.subtotal.toFixed(2)} ብር
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 dark:border-[#143225] p-4 space-y-3 bg-gray-50/50 dark:bg-[#07150f]">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-semibold text-gray-900 dark:text-white">{subtotal.toFixed(2)} ብር</span>
          </div>

          {/* Tax */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tax (15%)</span>
            <span className="font-semibold text-gray-900 dark:text-white">{tax.toFixed(2)} ብር</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-lg border-t border-gray-200 dark:border-[#143225] pt-3">
            <span className="font-bold text-gray-900 dark:text-white">Total</span>
            <span className="font-bold text-green-600 dark:text-[#00e676]">{total.toFixed(2)} ብር</span>
          </div>

          {/* Checkout Button */}
          <Button className="w-full bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold shadow-md cursor-pointer" size="lg" onClick={onCheckout}>
            <CreditCard className="w-5 h-5 mr-1" />
            Proceed to Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
