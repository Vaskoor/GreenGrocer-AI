/**
 * GreenGrocer AI — Navbar
 * Sticky top navigation with brand, view tabs, search input, cart badge
 * with count, and a responsive mobile drawer.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useState } from 'react';
import { ShoppingCart, Menu, Search, Sprout, X } from 'lucide-react';
import type { ViewState } from '../types';

interface NavbarProps {
  /** Total item count across the cart. */
  cartCount: number;
  /** Current view so the active nav tab can be highlighted. */
  currentView: ViewState;
  /** Click handler for the cart button. */
  onCartClick: () => void;
  /** Navigate to a different view. */
  onNavigate: (view: ViewState) => void;
  /** Submit a search query. */
  onSearch: (query: string) => void;
}

/** Navigation tabs (Market maps to HOME; Shop is a sub-view of Market). */
const NAV_ITEMS: { label: string; view: ViewState; alsoActive?: ViewState[] }[] = [
  { label: 'Market', view: 'HOME', alsoActive: ['SHOP'] },
  { label: 'Recipes', view: 'RECIPES' },
  { label: 'Orders', view: 'ORDERS' },
  { label: 'Admin', view: 'ADMIN' },
];

/**
 * Sticky, blurred navbar with desktop tabs and a slide-down mobile drawer.
 */
const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  currentView,
  onCartClick,
  onNavigate,
  onSearch,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      setSearchValue('');
      setMobileOpen(false);
    }
  };

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    currentView === item.view || (item.alsoActive?.includes(currentView) ?? false);

  return (
    <nav className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('HOME')}
            className="flex-shrink-0 flex items-center gap-2"
            aria-label="GreenGrocer AI home"
          >
            <span className="p-1.5 bg-primary-600 rounded-lg">
              <Sprout className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold text-gray-900 tracking-tight hidden sm:inline">
              GreenGrocer <span className="text-primary-600">AI</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const active = isActive(item);
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Search + cart + mobile toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleSubmit} className="hidden sm:flex items-center relative">
              <Search
                className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Search produce..."
                aria-label="Search products"
                className="pl-9 pr-3 py-2 w-40 lg:w-56 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:bg-white transition"
              />
            </form>

            <button
              onClick={onCartClick}
              aria-label={`Cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              className="relative p-2 text-gray-600 hover:text-primary-700 hover:bg-gray-50 rounded-lg transition"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-secondary-500 rounded-full ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            <form onSubmit={handleSubmit} className="sm:hidden relative mb-2">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Search produce..."
                aria-label="Search products"
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </form>
            {NAV_ITEMS.map(item => {
              const active = isActive(item);
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    onNavigate(item.view);
                    setMobileOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
