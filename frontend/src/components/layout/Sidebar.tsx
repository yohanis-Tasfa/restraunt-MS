import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import logo from '../../assets/image.png';
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
  Wallet,
  BarChart3,
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
  isCollapsed?: boolean;
}

export default function Sidebar({ isOpen, onClose, isCollapsed = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Overview Section Items
  const overviewItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'POS', icon: ShoppingCart, path: '/pos', roles: ['Super Admin', 'Admin', 'Manager', 'Cashier'] },
    { label: 'Orders', icon: ListOrdered, path: '/orders' },
    { label: 'Kitchen', icon: ChefHat, path: '/kitchen', roles: ['Super Admin', 'Admin', 'Manager', 'Kitchen Staff'] },
  ];

  // Operations Section Items
  const operationsItems: NavItem[] = [
    { label: 'Tables', icon: Store, path: '/tables' },
    { label: 'Reservations', icon: ClipboardList, path: '/reservations' },
    { label: 'Menu', icon: UtensilsCrossed, path: '/menu', roles: ['Super Admin', 'Admin', 'Manager'] },
    { label: 'Recipes', icon: Beef, path: '/recipes', roles: ['Super Admin', 'Admin', 'Manager', 'Kitchen Staff'] },
    { label: 'Inventory', icon: Package, path: '/inventory', roles: ['Super Admin', 'Admin', 'Manager', 'Inventory Manager'] },
  ];

  // Business Section Items
  const businessItems: NavItem[] = [
    { label: 'Expenses', icon: Wallet, path: '/expenses', roles: ['Super Admin', 'Admin', 'Manager'] },
    { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['Super Admin', 'Admin', 'Manager'] },
    { label: 'Employees', icon: Users, path: '/employees', roles: ['Super Admin', 'Admin', 'Manager'] },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Filter navigation items based on user role
  const canAccessItem = (item: NavItem) => {
    // Super Admin and Admin have access to everything
    if (user?.role?.name === 'Super Admin' || user?.role?.name === 'Admin') return true;
    // If no roles specified, everyone can access
    if (!item.roles) return true;
    // Check if user's role is in the allowed roles
    return item.roles.includes(user?.role?.name || '');
  };

  const filteredOverviewItems = overviewItems.filter(canAccessItem);
  const filteredOperationsItems = operationsItems.filter(canAccessItem);
  const filteredBusinessItems = businessItems.filter(canAccessItem);

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
          'fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop/Tablet: collapse to icon-only
          isCollapsed ? 'lg:w-16' : 'w-56'
        )}
      >
        {/* Logo - Horizontal layout with text on right */}
        <div className={cn(
          'p-3 border-b border-gray-200 flex items-center',
          isCollapsed ? 'lg:justify-center' : 'justify-between'
        )}>
          <div className={cn(
            'flex items-center gap-3',
            isCollapsed && 'lg:gap-0'
          )}>
            <img 
              src={logo} 
              alt="Yoni Restaurant Logo" 
              className={cn(
                "rounded-lg object-cover flex-shrink-0",
                isCollapsed ? "w-10 h-10" : "w-12 h-12"
              )}
            />
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-gray-900 text-sm">Yoni Restaurant</h1>
                <p className="text-xs text-gray-500">
                  {user?.branch?.name || 'Main Branch'}
                </p>
              </div>
            )}
          </div>
          {/* Close button for mobile */}
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {/* Overview Section */}
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Overview
              </div>
            )}
            {filteredOverviewItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                  isActive(item.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50',
                  isCollapsed && 'lg:justify-center lg:px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <span className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}

            {/* Operations Section */}
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                Operations
              </div>
            )}
            {filteredOperationsItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                  isActive(item.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50',
                  isCollapsed && 'lg:justify-center lg:px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <span className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}

            {/* Business Section */}
            {filteredBusinessItems.length > 0 && !isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                Business
              </div>
            )}
            {filteredBusinessItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                  isActive(item.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50',
                  isCollapsed && 'lg:justify-center lg:px-2'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <span className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => handleNavigate('/profile')}
            className={cn(
              'w-full flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors',
              isActive('/profile') && 'bg-green-50',
              isCollapsed && 'lg:justify-center lg:gap-0'
            )}
            title={isCollapsed ? `${user?.firstName} ${user?.lastName}` : undefined}
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role?.name}</p>
              </div>
            )}
          </button>
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </div>
    </>
  );
}
