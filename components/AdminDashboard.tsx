import React from 'react';
import { Product } from '../types';
import { BarChart3, TrendingUp, Package, Users, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, setProducts }) => {
  const lowStockProducts = products.filter(p => p.stock < 30);
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const handleRestock = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock + 50 } : p));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-500 mt-1">Real-time store overview & AI inventory management</p>
        </div>
        <div className="flex space-x-3">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            System Operational
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12.5%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Inventory Value</h3>
          <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            {lowStockProducts.length > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">Action Needed</span>
            )}
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Low Stock Items</h3>
          <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Active Agents</h3>
          <p className="text-2xl font-bold text-gray-900">4</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900">Live Inventory Management</h3>
          <button className="text-sm text-primary-600 font-medium hover:text-primary-700">Download Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                    <img src={product.image} alt="" className="w-8 h-8 rounded-md object-cover mr-3" />
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{product.category}</td>
                  <td className="px-6 py-4 font-medium">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-100 rounded-full mr-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${product.stock < 30 ? 'bg-red-500' : 'bg-primary-500'}`} 
                          style={{ width: `${Math.min(100, (product.stock / 200) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-500">{product.stock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.stock < 20 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.stock < 20 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleRestock(product.id)}
                      className="text-primary-600 hover:text-primary-700 font-medium text-xs border border-primary-200 hover:border-primary-500 px-3 py-1 rounded-lg transition-colors"
                    >
                      Restock +50
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;