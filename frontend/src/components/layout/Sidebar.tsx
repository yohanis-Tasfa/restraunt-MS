import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  ListOrdered,
  Users,
  UtensilsCrossed,
  Beef,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  Store,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  icon: any;
  path: string;
  badge?: number;
  roles?: string[]; // If undefined, accessible to all
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigationItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'POS', icon: ShoppingCart, path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { label: 'Orders', icon: ListOrdered, path: '/orders', badge: 12 },
    { label: 'Kitchen', icon: ChefHat, path: '/kitchen', badge: 6, roles: ['ADMIN', 'MANAGER', 'CHEF'] },
    { label: 'Tables', icon: Store, path: '/tables' },
    { label: 'Reservations', icon: ClipboardList, path: '/reservations', badge: 4 },
    { label: 'Menu', icon: UtensilsCrossed, path: '/menu', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Recipes', icon: Beef, path: '/recipes', roles: ['ADMIN', 'MANAGER', 'CHEF'] },
    { label: 'Inventory', icon: Package, path: '/inventory', badge: 1, roles: ['ADMIN', 'MANAGER'] },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Filter navigation items based on user role
  const canAccessItem = (item: NavItem) => {
    // ADMIN has access to everything
    if (user?.role?.name === 'ADMIN') return true;
    // If no roles specified, everyone can access
    if (!item.roles) return true;
    // Check if user's role is in the allowed roles
    return item.roles.includes(user?.role?.name || '');
  };

  const filteredItems = navigationItems.filter(canAccessItem);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-screen transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-bold">
              HR
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Habesha RMS</h1>
              <p className="text-xs text-gray-500">
                {user?.branch?.name || 'Bole Main'}
              </p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Overview
            </div>
            {filteredItems.slice(0, 1).map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
              Operations
            </div>
            {filteredItems.slice(1).map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
