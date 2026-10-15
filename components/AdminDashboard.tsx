/**
 * GreenGrocer AI — AdminDashboard
 * Stat cards (revenue, orders, products, low-stock count) + hand-rolled SVG
 * charts (sales-by-category bar chart, stock-by-category donut) + top-5
 * products list + recent orders table + live inventory table with restock.
 * All charts are pure SVG — no chart libraries.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useMemo } from 'react';
import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import type { Product, Order, Category } from '../types';

interface AdminDashboardProps {
  /** Catalog (live-editable for restock). */
  products: Product[];
  /** Orders (used for revenue + recent orders + top products). */
  orders: Order[];
  /** Allow restock action to mutate product stock. */
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

/** Stable color per category for charts. */
const CATEGORY_COLORS: Record<string, string> = {
  Vegetables: '#16a34a',
  Fruits: '#f97316',
  Herbs: '#84cc16',
  'Organic Boxes': '#0ea5e9',
};

/** Color fallback for unknown categories. */
const colorFor = (c: string): string => CATEGORY_COLORS[c] ?? '#16a34a';

/** Dashboard with stat cards, two SVG charts, top products, and tables. */
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  setProducts,
}) => {
  // === Aggregate stats ===
  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStock = products.filter(p => p.stock < 30);
    return {
      revenue,
      lowStock,
      orderCount: orders.length,
      productCount: products.length,
    };
  }, [products, orders]);

  // === Sales by category (with product-derived fallback) ===
  const salesByCategory = useMemo(() => {
    const map = new Map<Category, number>();
    orders.forEach(o => {
      o.items.forEach(it => {
        map.set(
          it.category,
          (map.get(it.category) ?? 0) + it.price * it.quantity
        );
      });
    });
    if (map.size === 0) {
      products.forEach(p => {
        map.set(p.category, (map.get(p.category) ?? 0) + p.price * 10);
      });
    }
    return Array.from(map.entries()).map(([category, total]) => ({
      category,
      total,
    }));
  }, [products, orders]);

  // === Stock by category ===
  const stockByCategory = useMemo(() => {
    const map = new Map<Category, number>();
    products.forEach(p => map.set(p.category, (map.get(p.category) ?? 0) + p.stock));
    return Array.from(map.entries()).map(([category, total]) => ({
      category,
      total,
    }));
  }, [products]);

  // === Top products by units sold (with fallback) ===
  const topProducts = useMemo(() => {
    const counts = new Map<string, { product: Product; units: number }>();
    orders.forEach(o => {
      o.items.forEach(it => {
        const existing = counts.get(it.id);
        if (existing) existing.units += it.quantity;
        else counts.set(it.id, { product: it, units: it.quantity });
      });
    });
    if (counts.size === 0) {
      products.slice(0, 5).forEach(p => counts.set(p.id, { product: p, units: p.stock }));
    }
    return Array.from(counts.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [products, orders]);

  /** Restock a product by 50 units. */
  const handleRestock = (id: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, stock: p.stock + 50 } : p))
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Real-time store overview & AI inventory management
          </p>
        </div>
        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center">
          <span className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse" />
          System Operational
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={DollarSign}
          iconClass="bg-primary-50 text-primary-700"
          label="Total Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          trend="+12.5%"
          trendClass="text-primary-700 bg-primary-50"
        />
        <StatCard
          icon={ShoppingCart}
          iconClass="bg-blue-50 text-blue-600"
          label="Orders"
          value={stats.orderCount}
          trend="+3 this week"
          trendClass="text-blue-700 bg-blue-50"
        />
        <StatCard
          icon={Package}
          iconClass="bg-purple-50 text-purple-600"
          label="Products"
          value={stats.productCount}
          trend="6 categories"
          trendClass="text-purple-700 bg-purple-50"
        />
        <StatCard
          icon={AlertTriangle}
          iconClass="bg-orange-50 text-orange-600"
          label="Low Stock"
          value={stats.lowStock.length}
          trend={stats.lowStock.length > 0 ? 'Action needed' : 'All good'}
          trendClass={
            stats.lowStock.length > 0
              ? 'text-orange-700 bg-orange-50'
              : 'text-primary-700 bg-primary-50'
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Sales by Category</h3>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <SalesBarChart data={salesByCategory} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Stock by Category</h3>
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <StockDonutChart data={stockByCategory} />
        </div>
      </div>

      {/* Top products + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Top Products</h3>
          <ul className="space-y-3">
            {topProducts.map((entry, i) => (
              <li key={entry.product.id} className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {i + 1}
                </span>
                <img
                  src={entry.product.image}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {entry.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${entry.product.price.toFixed(2)} · {entry.product.category}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary-700">
                  {entry.units} <span className="text-xs text-gray-400 font-normal">u</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">
                      {o.id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(o.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {o.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ${o.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-primary-50 text-primary-700">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Live Inventory Management</h3>
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-left">Stock Level</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => {
                const pct = Math.min(100, (p.stock / 200) * 100);
                const isLow = p.stock < 30;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <img
                        src={p.image}
                        alt=""
                        className="w-8 h-8 rounded-md object-cover"
                      />
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isLow ? 'bg-orange-500' : 'bg-primary-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{p.stock}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isLow
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-primary-50 text-primary-700'
                        }`}
                      >
                        {isLow ? 'Low' : 'In stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRestock(p.id)}
                        className="text-xs font-medium text-primary-700 border border-primary-200 hover:border-primary-500 px-2 py-1 rounded-lg transition-colors"
                      >
                        Restock +50
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// === Stat Card ===
const StatCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  value: string | number;
  trend: string;
  trendClass: string;
}> = ({ icon: Icon, iconClass, label, value, trend, trendClass }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <span className={`p-2.5 rounded-xl ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${trendClass}`}
      >
        {trend}
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

// === Pure SVG Bar Chart ===
const SalesBarChart: React.FC<{ data: { category: Category; total: number }[] }> = ({
  data,
}) => {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">No data</p>;
  }
  const max = Math.max(...data.map(d => d.total), 1);
  const W = 480;
  const H = 220;
  const padL = 40;
  const padB = 30;
  const padT = 10;
  const padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padB - padT;
  const barW = (innerW / data.length) * 0.55;
  const step = innerW / data.length;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => t * max);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[400px] h-56"
        role="img"
        aria-label="Bar chart of sales by category"
      >
        {/* Gridlines + y-axis labels */}
        {ticks.map((t, i) => {
          const y = padT + innerH - (t / max) * innerH;
          return (
            <g key={i}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#9ca3af"
              >
                ${Math.round(t)}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const h = (d.total / max) * innerH;
          const x = padL + i * step + (step - barW) / 2;
          const y = padT + innerH - h;
          const fill = colorFor(d.category);
          return (
            <g key={d.category}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={fill}
                rx={4}
                className="transition-all"
              >
                <title>
                  {d.category}: ${d.total.toFixed(2)}
                </title>
              </rect>
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#374151"
                fontWeight="700"
              >
                ${Math.round(d.total)}
              </text>
              <text
                x={x + barW / 2}
                y={padT + innerH + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
              >
                {d.category}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// === Pure SVG Donut Chart ===
const StockDonutChart: React.FC<{ data: { category: Category; total: number }[] }> = ({
  data,
}) => {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">No data</p>;
  }
  const total = data.reduce((s, d) => s + d.total, 0);
  const r = 60;
  const cx = 80;
  const cy = 80;
  const strokeW = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg
        viewBox="0 0 160 160"
        className="w-40 h-40"
        role="img"
        aria-label="Donut chart of stock by category"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeW}
        />
        {data.map(d => {
          const frac = d.total / total;
          const dash = frac * circ;
          const seg = (
            <circle
              key={d.category}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={colorFor(d.category)}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
              className="transition-all"
            >
              <title>
                {d.category}: {d.total} units
              </title>
            </circle>
          );
          offset += dash;
          return seg;
        })}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#111827"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize="8"
          fill="#6b7280"
        >
          units
        </text>
      </svg>
      <ul className="flex-1 space-y-2 w-full">
        {data.map(d => (
          <li key={d.category} className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: colorFor(d.category) }}
              />
              <span className="text-gray-700">{d.category}</span>
            </span>
            <span className="font-bold text-gray-900">
              {d.total}{' '}
              <span className="text-xs text-gray-400 font-normal">
                ({((d.total / total) * 100).toFixed(0)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;
