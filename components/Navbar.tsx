import React from 'react';
import { ShoppingCart, Menu, Search, Sprout } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => onNavigate('HOME')}>
            <Sprout className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">GreenGrocer AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            <button onClick={() => onNavigate('HOME')} className="text-gray-600 hover:text-primary-600 font-medium transition">Market</button>
            <button className="text-gray-600 hover:text-primary-600 font-medium transition">Recipes</button>
            <button onClick={() => onNavigate('ADMIN')} className="text-gray-600 hover:text-primary-600 font-medium transition">Admin</button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Search className="h-5 w-5" />
            </button>
            
            <button 
              onClick={onCartClick}
              className="relative p-2 text-gray-600 hover:text-primary-600 transition"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-secondary-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="md:hidden">
              <Menu className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;