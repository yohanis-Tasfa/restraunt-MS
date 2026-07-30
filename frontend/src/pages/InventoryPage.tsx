import DashboardLayout from '../components/layout/DashboardLayout';

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventory Management</h3>
            <p className="text-gray-500">Coming soon - Stock levels, purchase orders, and suppliers</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
