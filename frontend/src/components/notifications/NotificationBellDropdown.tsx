import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChefHat,
  PhoneCall,
  Clock,
  ArrowRight,
  X,
  PackagePlus,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore, type AppNotification } from '../../store/notificationStore';

export default function NotificationBellDropdown() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'calls' | 'orders' | 'bills'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    soundEnabled,
    voiceEnabled,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleSound,
    toggleVoice,
  } = useNotificationStore();

  const userRole = user?.role?.name || '';
  const isManagerOrAdmin = ['Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);
  const isCashier = userRole === 'Cashier';
  const isWaiter = userRole === 'Waiter';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // STRICT RBAC: Filter notifications so user sees ONLY notifications allowed for their role
  const canUserSeeNotification = (notif: AppNotification) => {
    if (['Super Admin', 'Owner'].includes(userRole)) return true;

    if (notif.targetRoles && notif.targetRoles.length > 0) {
      return notif.targetRoles.includes(userRole);
    }

    switch (notif.type) {
      case 'INGREDIENT_REQUEST':
        // STRICT: ONLY Managers and Admin/Owner! NEVER Waiter, NEVER Cashier!
        return isManagerOrAdmin;

      case 'WAITER_CALL':
        return ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);

      case 'ORDER_READY':
        return ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);

      case 'BILL_REQUEST':
        return ['Cashier', 'Manager', 'Admin', 'Owner', 'Super Admin', 'Waiter'].includes(userRole);

      case 'TIP':
        return ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);

      default:
        return false;
    }
  };

  // Only notifications visible to the logged-in role
  const visibleNotifications = notifications.filter(canUserSeeNotification);
  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length;

  // Tab counts
  const reqCount = visibleNotifications.filter((n) => n.type === 'INGREDIENT_REQUEST').length;
  const callsCount = visibleNotifications.filter((n) => n.type === 'WAITER_CALL').length;
  const ordersCount = visibleNotifications.filter((n) => n.type === 'ORDER_READY' || n.type === 'BILL_REQUEST').length;
  const billsCount = visibleNotifications.filter((n) => n.type === 'BILL_REQUEST').length;

  // Filter based on active tab
  const filteredNotifications = visibleNotifications.filter((notif) => {
    if (activeTab === 'requests') return notif.type === 'INGREDIENT_REQUEST';
    if (activeTab === 'calls') return notif.type === 'WAITER_CALL';
    if (activeTab === 'orders') return notif.type === 'ORDER_READY' || notif.type === 'BILL_REQUEST';
    if (activeTab === 'bills') return notif.type === 'BILL_REQUEST';
    return true;
  });

  // Handle clicking an item: mark as read and navigate
  const handleItemClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'INGREDIENT_REQUEST') {
      navigate('/admin/ingredient-requests');
    } else if (notification.type === 'WAITER_CALL') {
      navigate('/admin/waiter-calls');
    } else if (notification.type === 'ORDER_READY') {
      navigate('/admin/orders');
    } else if (notification.type === 'BILL_REQUEST') {
      navigate('/admin/bill-requests');
    }
  };

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 45) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-blue-50 dark:bg-[#123627] text-blue-600 dark:text-[#00e676] ring-2 ring-blue-500/20 dark:ring-[#00e676]/30'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#12281d]'
        }`}
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`} />

        {/* Dynamic Badge Counter (counts ONLY role-allowed unread notifications!) */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#091a13] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#143225] text-gray-900 dark:text-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-[#143225] bg-gray-50/50 dark:bg-[#07150f]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {/* Sound & Voice Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleSound}
                  title={soundEnabled ? 'Chime sound: ON (Click to mute)' : 'Chime sound: MUTED (Click to unmute)'}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    soundEnabled ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#12281d]' : 'text-red-500 bg-red-50 dark:bg-red-950/40 hover:bg-red-100'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleVoice}
                  title={voiceEnabled ? 'Voice alert: ON (Click to mute)' : 'Voice alert: MUTED (Click to unmute)'}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    voiceEnabled ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#12281d]' : 'text-red-500 bg-red-50 dark:bg-red-950/40 hover:bg-red-100'
                  }`}
                >
                  {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-[#00e676] hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-[#12281d] px-2 py-1 rounded-md font-medium transition-colors ml-1 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
              </div>
            </div>

            {/* Role-Specific Quick Filter Tabs */}
            <div className="flex gap-1.5 mt-3 bg-gray-100/80 dark:bg-[#0c2219] p-1 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'all' ? 'bg-white dark:bg-[#123627] text-gray-900 dark:text-white shadow-sm font-semibold' : 'hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All ({visibleNotifications.length})
              </button>

              {/* Kitchen Requisitions Tab: ONLY visible to Manager / Admin / Owner */}
              {isManagerOrAdmin && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'requests' ? 'bg-white dark:bg-[#123627] text-amber-800 dark:text-amber-400 shadow-sm font-semibold' : 'hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Kitchen ({reqCount})
                </button>
              )}

              {/* Calls Tab (Waiters & Managers) */}
              {!isCashier && (
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'calls' ? 'bg-white dark:bg-[#123627] text-amber-700 dark:text-amber-300 shadow-sm font-semibold' : 'hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Calls ({callsCount})
                </button>
              )}

              {/* Bills Tab (Cashiers) */}
              {isCashier && (
                <button
                  onClick={() => setActiveTab('bills')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'bills' ? 'bg-white dark:bg-[#123627] text-emerald-700 dark:text-[#00e676] shadow-sm font-semibold' : 'hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Bills ({billsCount})
                </button>
              )}

              {/* Orders Tab */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders' ? 'bg-white dark:bg-[#123627] text-green-700 dark:text-[#00e676] shadow-sm font-semibold' : 'hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Orders ({ordersCount})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-[#143225]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#12281d] rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 dark:text-gray-500">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">No notifications</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {activeTab === 'all'
                    ? "You're all caught up with your tasks!"
                    : activeTab === 'requests'
                    ? 'No pending kitchen ingredient requisitions.'
                    : activeTab === 'calls'
                    ? 'No waiter calls in queue.'
                    : 'No order alerts in queue.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isIngredientRequest = item.type === 'INGREDIENT_REQUEST';
                const isWaiterCall = item.type === 'WAITER_CALL';
                const isOrderReady = item.type === 'ORDER_READY';
                const isBillRequest = item.type === 'BILL_REQUEST';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#0c2f21]/50 cursor-pointer transition-colors flex gap-3 items-start ${
                      !item.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'bg-white dark:bg-[#091a13]'
                    }`}
                  >
                    {/* Unread Accent Indicator */}
                    {!item.isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-[#00e676]" />
                    )}

                    {/* Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isIngredientRequest
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                          : isWaiterCall
                          ? item.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#00e676]'
                            : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                          : isBillRequest
                          ? item.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#00e676]'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#00e676]'
                          : isOrderReady
                          ? item.status === 'SERVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#00e676]'
                            : 'bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-[#00e676]'
                          : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isIngredientRequest ? (
                        <PackagePlus className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      ) : isWaiterCall ? (
                        item.status === 'COMPLETED' ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-[#00e676]" />
                        ) : (
                          <PhoneCall className="w-4 h-4" />
                        )
                      ) : isBillRequest ? (
                        item.status === 'COMPLETED' ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-[#00e676]" />
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-700 dark:text-[#00e676]" />
                        )
                      ) : isOrderReady ? (
                        item.status === 'SERVED' ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-[#00e676]" />
                        ) : (
                          <ChefHat className="w-4 h-4" />
                        )
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate flex-wrap">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          {item.status === 'SERVED' && (
                            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-[#00e676] border border-emerald-300 dark:border-emerald-700 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 shadow-2xs">
                              <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-[#00e676] stroke-[3]" /> Served
                            </span>
                          )}
                          {item.status === 'COMPLETED' && (
                            <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-blue-600" /> Completed
                            </span>
                          )}
                          {item.status === 'CANCELLED' && (
                            <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          )}
                          {item.status === 'READY' && !item.isRead && (
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded-full animate-pulse">
                              Ready
                            </span>
                          )}
                          {item.priority === 'urgent' && item.status !== 'SERVED' && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                              Urgent
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        <span className="text-[11px] font-medium text-blue-600 dark:text-[#00e676] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>
                            {isIngredientRequest
                              ? 'Review Requisition'
                              : isWaiterCall
                              ? item.status === 'COMPLETED'
                                ? 'View Call History'
                                : 'Go to Waiter Calls'
                              : isBillRequest
                              ? item.status === 'COMPLETED'
                                ? 'View Bill'
                                : 'Process Bill'
                              : isOrderReady
                              ? item.status === 'SERVED'
                                ? 'View Served Order'
                                : 'Serve Order'
                              : 'Open'}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </span>

                        {item.tableNumber && (
                          <span className="text-[10px] font-semibold bg-gray-100 dark:bg-[#12281d] text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                            T{item.tableNumber.replace(/^T/i, '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#143225] rounded-lg transition-all absolute right-2 top-2"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {visibleNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 dark:border-[#143225] bg-gray-50/50 dark:bg-[#07150f] flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {visibleNotifications.length} total alerts
              </span>
              <button
                onClick={clearAll}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
