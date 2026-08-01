import { useState } from 'react';
import Sidebar from './Sidebar';
import { Bell, Plus, Menu, ChevronDown, Moon, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-14">
          <div className="flex items-center justify-between h-full px-4 gap-4">
            {/* Left Section: Toggle & Branch */}
            <div className="flex items-center gap-3">
              {/* Desktop/Tablet Sidebar Collapse Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-5 h-5 text-gray-600" />
                ) : (
                  <PanelLeftClose className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {/* Branch Selector - Only branch name */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-900 font-semibold">Bole Main</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Right Section: Actions & Icons */}
            <div className="flex items-center gap-2">
              {/* New Order Button */}
              <Button className="gap-2 bg-green-600 hover:bg-green-700 h-9">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New order</span>
              </Button>

              {/* Dark Mode Toggle */}
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Dark mode">
                <Moon className="w-5 h-5" />
              </button>

              {/* Notification Bell */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
