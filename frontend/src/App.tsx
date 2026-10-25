import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CashierDashboardPage from './pages/CashierDashboardPage';
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
import PublicLandingPage from './pages/PublicLandingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

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

// Role-based dashboard component
function RoleBasedDashboard() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role?.name;

  // Cashiers get simplified dashboard
  if (userRole === 'Cashier') {
    return <CashierDashboardPage />;
  }

  // Kitchen Staff and Waiters should redirect to their main work page
  if (userRole === 'Kitchen Staff') {
    return <Navigate to="/admin/kitchen" replace />;
  }

  if (userRole === 'Waiter') {
    return <Navigate to="/admin/tables" replace />;
  }

  // Owner and Manager get full dashboard
  return <DashboardPage />;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes - NO authentication required */}
              <Route path="/" element={<PublicLandingPage />} />
              <Route path="/menu/table/:qrCode" element={<CustomerMenuPage />} />
              
              {/* Admin login route */}
              <Route 
                path="/admin/login" 
                element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />} 
              />
              
              {/* Protected admin routes with persistent layout */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <LayoutWrapper />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<RoleBasedDashboard />} />
                <Route 
                  path="pos" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Cashier']}>
                      <POSPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="kitchen" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Kitchen Staff']}>
                      <KitchenPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="tables" element={<TablesPage />} />
                <Route path="waiter-calls" element={<WaiterCallsPage />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route 
                  path="menu" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
                      <MenuManagementPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="recipes" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Kitchen Staff']}>
                      <RecipesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="inventory" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
                      <InventoryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="expenses" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
                      <ExpensesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="employees" 
                  element={
                    <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
                      <EmployeesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
              </Route>
              
              {/* Redirect old admin routes to new /admin/* structure */}
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/orders" element={<Navigate to="/admin/orders" replace />} />
              <Route path="/pos" element={<Navigate to="/admin/pos" replace />} />
              <Route path="/tables" element={<Navigate to="/admin/tables" replace />} />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </WebSocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
