/**
 * GreenGrocer AI — ProductGrid
 * Filterable, sortable product grid with a left sidebar (categories, search,
 * sort, seasonal/organic toggles, price slider), result count, and an empty
 * state. A mobile drawer hosts the same sidebar on small screens.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X, Frown, Leaf, Sun } from 'lucide-react';
import type { Product, FilterState, SortOption, Category } from '../types';
import { CATEGORIES } from '../constants';
import ProductCard from './ProductCard';

interface ProductGridProps {
  /** The pool of products to filter & display. */
  products: Product[];
  /** Add a product to the cart. */
  onAdd: (product: Product) => void;
  /** Open the product detail modal. */
  onSelect: (product: Product) => void;
  /** Active filters. */
  filterState: FilterState;
  /** Filter setter. */
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  /** Compact mode hides the sidebar (used on Home for featured grid). */
  compact?: boolean;
}

/** Sort options surfaced in the dropdown. */
const SORT_LABELS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name: A → Z' },
];

/** Upper bound of the price slider. */
const MAX_PRICE = 50;

/** Heuristic for "organic" used by both the filter and the card. */
const isOrganicProduct = (p: Product): boolean =>
  (p as Product & { isOrganic?: boolean }).isOrganic === true ||
  (p.tags?.some(t => t.toLowerCase() === 'organic') ?? false);

/** Normalize a CATEGORIES entry to its name (string | { name }). */
const categoryName = (cat: unknown): Category => {
  if (typeof cat === 'string') return cat as Category;
  if (cat && typeof cat === 'object' && 'name' in cat) {
    return (cat as { name: Category }).name;
  }
  return 'Vegetables' as Category;
};

/** Main grid component. */
const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAdd,
  onSelect,
  filterState,
  setFilterState,
  compact = false,
}) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleCategory = (cat: Category) => {
    setFilterState(prev => {
      const has = prev.categories.includes(cat);
      return {
        ...prev,
        categories: has
          ? prev.categories.filter(c => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const filtered = useMemo(() => {
    const list = products.filter(p => {
      // Categories
      if (
        filterState.categories.length > 0 &&
        !filterState.categories.includes(p.category)
      )
        return false;
      // Search
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Toggles
      if (filterState.seasonalOnly && !p.seasonal) return false;
      if (filterState.organicOnly && !isOrganicProduct(p)) return false;
      // Price
      if (p.price > filterState.maxPrice) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      switch (filterState.sortOption) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [products, filterState]);

  const clearFilters = () => {
    setFilterState({
      categories: [],
      searchQuery: '',
      sortOption: 'featured',
      seasonalOnly: false,
      organicOnly: false,
      maxPrice: MAX_PRICE,
    });
  };

  /** Reusable sidebar content. */
  const Sidebar = (
    <aside className="space-y-6">
      {/* Search */}
      <div>
        <label
          htmlFor="grid-search"
          className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
        >
          Search
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="grid-search"
            type="text"
            value={filterState.searchQuery}
            onChange={e =>
              setFilterState(prev => ({ ...prev, searchQuery: e.target.value }))
            }
            placeholder="Tomatoes, kale..."
            aria-label="Search products"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Categories
        </p>
        <ul className="space-y-1.5">
          {CATEGORIES.map(cat => {
            const name = categoryName(cat);
            const checked = filterState.categories.includes(name);
            const count = products.filter(p => p.category === name).length;
            return (
              <li key={name}>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-primary-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(name)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="flex-1">{name}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sort */}
      <div>
        <label
          htmlFor="grid-sort"
          className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
        >
          Sort by
        </label>
        <select
          id="grid-sort"
          value={filterState.sortOption}
          onChange={e =>
            setFilterState(prev => ({
              ...prev,
              sortOption: e.target.value as SortOption,
            }))
          }
          aria-label="Sort products"
          className="w-full px-3 py-2 text-sm bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        >
          {SORT_LABELS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div>
        <p className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          Filters
        </p>
        <div className="space-y-2">
          <ToggleRow
            checked={filterState.seasonalOnly}
            onChange={v => setFilterState(prev => ({ ...prev, seasonalOnly: v }))}
            icon={<Sun className="w-4 h-4 text-secondary-500" />}
            label="Seasonal only"
          />
          <ToggleRow
            checked={filterState.organicOnly}
            onChange={v => setFilterState(prev => ({ ...prev, organicOnly: v }))}
            icon={<Leaf className="w-4 h-4 text-primary-600" />}
            label="Organic only"
          />
        </div>
      </div>

      {/* Price slider */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label
            htmlFor="grid-price"
            className="text-xs font-bold text-gray-700 uppercase tracking-wider"
          >
            Max Price
          </label>
          <span className="text-sm font-bold text-primary-700">
            ${filterState.maxPrice.toFixed(2)}
          </span>
        </div>
        <input
          id="grid-price"
          type="range"
          min={1}
          max={MAX_PRICE}
          step={1}
          value={filterState.maxPrice}
          onChange={e =>
            setFilterState(prev => ({ ...prev, maxPrice: Number(e.target.value) }))
          }
          aria-label="Maximum price"
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>$1</span>
          <span>${MAX_PRICE}</span>
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-700 border border-gray-200 hover:border-primary-500 rounded-lg transition-colors"
      >
        Clear all filters
      </button>
    </aside>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      {/* Sidebar (desktop) */}
      {!compact && (
        <div className="hidden lg:block">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            {Sidebar}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div>
        {!compact && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-bold text-gray-900">{filtered.length}</span> of{' '}
              {products.length} products
            </p>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-primary-500 hover:text-primary-700 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="inline-flex p-3 bg-gray-50 rounded-full mb-4">
              <Frown className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-bold text-gray-900">No products match your filters.</p>
            <p className="text-sm text-gray-500 mt-1">
              Try clearing some filters or searching for something else.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <X className="w-4 h-4" /> Reset filters
            </button>
          </div>
        ) : (
          <div
            className={`grid ${
              compact
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            } gap-4 sm:gap-6`}
          >
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onAdd={onAdd} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {!compact && showMobileFilters && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="w-80 max-w-[85%] bg-white p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {Sidebar}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-6 w-full px-3 py-2 text-sm font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Internal switch-style toggle row. */
const ToggleRow: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ checked, onChange, icon, label }) => (
  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-primary-700">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
    <span className="flex items-center gap-1.5">
      {icon}
      {label}
    </span>
  </label>
);

export default ProductGrid;
