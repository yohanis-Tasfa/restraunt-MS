import type { MenuItem } from '../../api/menu';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useCartStore } from '../../store/cartStore';
import { Plus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuSectionProps {
  items: MenuItem[];
  isLoading: boolean;
}

export default function MenuSection({ items, isLoading }: MenuSectionProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      toast.error(`${item.name} is currently unavailable`);
      return;
    }

    addItem({
      menuItemId: item.id,
      menuItem: item as any, // Type cast to match cartStore's local MenuItem type
      quantity: 1,
      unitPrice: item.price,
      addons: [],
    });

    toast.success(`Added ${item.name} to cart`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#0c2219] flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No items available</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">No menu items found in this category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card
          key={item.id}
          className="group hover:shadow-lg dark:hover:shadow-[0_8px_20px_rgba(0,230,118,0.15)] border-gray-200 dark:border-[#143225] dark:bg-[#091a13] transition-all overflow-hidden flex flex-col"
        >
          {/* Item Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-black/40 dark:to-black/80 relative overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                <Plus className="w-12 h-12" />
              </div>
            )}

            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive">Unavailable</Badge>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="p-3.5 flex flex-col flex-1 bg-white dark:bg-[#091a13]">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-1 line-clamp-1" title={item.name}>
              {item.name}
            </h3>
            
            {item.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-3 mt-auto pt-1">
              <span className="text-base sm:text-lg font-extrabold text-green-600 dark:text-[#00e676]">
                {item.price.toFixed(2)} ብር
              </span>
              
              {item.preparationTime && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <span>{item.preparationTime}m</span>
                </div>
              )}
            </div>

            <Button
              size="sm"
              className="w-full bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold shadow-sm cursor-pointer"
              onClick={() => handleAddToCart(item)}
              disabled={!item.isAvailable}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
