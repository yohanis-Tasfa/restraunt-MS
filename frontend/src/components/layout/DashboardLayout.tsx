import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, ChevronDown, Moon, Sun, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useTipNotifications } from '../../hooks/useTipNotifications';
import { useGlobalNotifications } from '../../hooks/useGlobalNotifications';
import NotificationBellDropdown from '../notifications/NotificationBellDropdown';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Enable tip notifications globally for all logged-in users
  useTipNotifications();
  
  // Enable global real-time notifications (Order Ready & Waiter Calls with chimes + voice speech)
  useGlobalNotifications();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#07130e] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-[#091a13] border-b border-gray-200 dark:border-[#143225] h-14 transition-colors duration-200">
          <div className="flex items-center justify-between h-full px-4 gap-4">
            {/* Left Section: Toggle & Branch */}
            <div className="flex items-center gap-3">
              {/* Desktop/Tablet Sidebar Collapse Toggle */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-[#12281d] rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#12281d] rounded-lg transition-colors text-gray-600 dark:text-gray-300"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Branch Selector - Only branch name */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-[#143225] bg-white dark:bg-[#0c2219] hover:bg-gray-50 dark:hover:bg-[#12281d] rounded-lg cursor-pointer transition-colors text-gray-900 dark:text-gray-100">
                <span className="text-sm font-semibold">Bole Main</span>
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {/* Right Section: Actions & Icons */}
            <div className="flex items-center gap-2">
              {/* Dark / Light Mode Toggle Button */}
              <button 
                type="button"
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#12281d] rounded-lg transition-colors cursor-pointer" 
                title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Interactive Notification Bell Dropdown */}
              <NotificationBellDropdown />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#07130e] text-gray-900 dark:text-gray-100 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
