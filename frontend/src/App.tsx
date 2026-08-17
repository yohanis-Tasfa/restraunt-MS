import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import KitchenPage from './pages/KitchenPage';
import OrdersPage from './pages/OrdersPage';
import TablesPage from './pages/TablesPage';
import ReservationsPage from './pages/ReservationsPage';
import MenuManagementPage from './pages/MenuManagementPage';
import RecipesPage from './pages/RecipesPage';
import InventoryPage from './pages/InventoryPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import EmployeesPage from './pages/EmployeesPage';
import ProfilePage from './pages/ProfilePage';
import CustomerMenuPage from './pages/CustomerMenuPage';
import WaiterCallsPage from './pages/WaiterCallsPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { WebSocketProvider } from './contexts/WebSocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Layout wrapper component
function LayoutWrapper() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
            />
            
            {/* Public customer menu route - no authentication required */}
            <Route path="/menu/table/:qrCode" element={<CustomerMenuPage />} />
            
            {/* Protected routes with persistent layout */}
            <Route
              element={
                <ProtectedRoute>
                  <LayoutWrapper />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route 
                path="/pos" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Cashier']}>
                    <POSPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/kitchen" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Kitchen Staff']}>
                    <KitchenPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/waiter-calls" element={<WaiterCallsPage />} />
              <Route path="/reservations" element={<ReservationsPage />} />
              <Route 
                path="/menu" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}>
                    <MenuManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recipes" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Kitchen Staff']}>
                    <RecipesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/inventory" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager', 'Inventory Manager']}>
                    <InventoryPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/expenses" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}>
                    <ExpensesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}>
                    <ReportsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employees" 
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Manager']}>
                    <EmployeesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
