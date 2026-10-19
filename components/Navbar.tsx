import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, Menu, Search, Sprout, X } from "lucide-react";
import type { ViewState } from "../types";

interface NavbarProps {
  cartCount: number;
  currentView: ViewState;
  onCartClick: () => void;
  onNavigate: (view: ViewState) => void;
  onSearch: (query: string) => void;
}

const NAV_ITEMS: { label: string; view: ViewState; alsoActive?: ViewState[] }[] = [
  { label: "Market", view: "HOME", alsoActive: ["SHOP"] },
  { label: "Recipes", view: "RECIPES" },
  { label: "Orders", view: "ORDERS" },
  { label: "Admin", view: "ADMIN" },
];

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  currentView,
  onCartClick,
  onNavigate,
  onSearch,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      setSearchValue("");
      setMobileOpen(false);
    }
  };

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    currentView === item.view || (item.alsoActive?.includes(currentView) ?? false);

  return (
    <nav className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Brand */}
          <button
            onClick={() => { onNavigate("HOME"); setMobileOpen(false); }}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight hidden sm:inline">
              GreenGrocer
            </span>
          </button>

          {/* Desktop nav tabs */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.view)}
                className={"relative rounded-lg px-3 py-2 text-sm font-medium transition-colors " + (
                  isActive(item)
                    ? "text-green-700 bg-green-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {item.label}
                {isActive(item) && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-green-600"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Search + cart + mobile toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleSubmit} className="hidden sm:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search produce…"
                className="w-32 md:w-48 rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100 transition-all"
                aria-label="Search products"
              />
            </form>

            {/* Cart button with bounce animation */}
            <motion.button
              onClick={onCartClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-green-50 hover:bg-green-100 transition-colors"
              aria-label="Open cart"
              whileTap={{ scale: 0.9 }}
            >
              <ShoppingCart className="h-5 w-5 text-green-700" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white shadow-md"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {/* Mobile search */}
              <form onSubmit={handleSubmit} className="flex items-center relative mb-3">
                <Search className="absolute left-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search produce…"
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm focus:border-green-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                  aria-label="Search products"
                />
              </form>
              {/* Mobile nav items */}
              {NAV_ITEMS.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { onNavigate(item.view); setMobileOpen(false); }}
                  className={"w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors " + (
                    isActive(item)
                      ? "text-green-700 bg-green-50"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
