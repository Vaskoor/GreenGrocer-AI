import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home, ShoppingCart, Sprout, User } from "lucide-react";
import type { ViewState } from "../types";

interface MobileBottomNavProps {
  currentView: ViewState;
  cartCount: number;
  onNavigate: (view: ViewState) => void;
  onCartClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  cartCount,
  onNavigate,
  onCartClick,
}) => {
  const items = [
    { icon: Home, label: "Market", view: "HOME" as ViewState },
    { icon: ShoppingCart, label: "Cart", view: null, onClick: onCartClick, badge: cartCount },
    { icon: Sprout, label: "Recipes", view: "RECIPES" as ViewState },
    { icon: User, label: "Admin", view: "ADMIN" as ViewState },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-gray-100 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="flex items-stretch justify-around">
        {items.map((item, i) => {
          const isActive = item.view && currentView === item.view;
          const Icon = item.icon;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => item.onClick ? item.onClick() : onNavigate(item.view!)}
              className={"relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors " + (
                isActive ? "text-green-700" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-0 h-0.5 w-8 rounded-full bg-green-600"
                />
              )}
              <AnimatePresence>
                {item.badge && item.badge > 0 ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-2 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                  >
                    {item.badge}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
