import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import AIChat from './components/AIChat';
import AdminDashboard from './components/AdminDashboard';
import CartDrawer from './components/CartDrawer';
import { PRODUCTS } from './constants';
import { Product, CartItem, ViewState } from './types';
import { GreenGrocerAgent } from './services/geminiService';
import { Bot } from 'lucide-react';

const App = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  
  // Initialize Agent
  const agent = useMemo(() => new GreenGrocerAgent(), []);

  // Tool Handlers for the Agent
  const toolHandlers = {
    onSearch: (query: string) => {
      const q = query.toLowerCase();
      // Basic fuzzy search simulation
      return products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.tags.some(t => t.includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    },
    onAddToCart: (productId: string, quantity: number) => {
      // Find product by fuzzy ID or exact ID
      const product = products.find(p => p.id === productId || p.name.toLowerCase() === productId.toLowerCase());
      
      if (!product) return false;
      if (product.stock < quantity) return false;
      
      addToCart(product, quantity);
      return true;
    },
    onGetRecipes: (ingredients: string[]) => {
       // In a real app, this might query a recipe DB. 
       return `[System] Found available ingredients in store matching: ${ingredients.join(', ')}. Please suggest a recipe using these.`;
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    // Optional: Auto open cart or show toast
    // setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
       <Navbar 
         cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
         onCartClick={() => setIsCartOpen(true)}
         onNavigate={setView}
       />

       <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {view === 'HOME' && (
           <div className="animate-in fade-in duration-500">
             <header className="mb-8">
               <h1 className="text-3xl font-bold text-gray-900">Fresh from the Farm</h1>
               <p className="text-gray-500 mt-2">Hand-picked organic produce delivered to your door.</p>
             </header>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {products.map(product => (
                 <ProductCard key={product.id} product={product} onAdd={(p) => addToCart(p)} />
               ))}
             </div>
           </div>
         )}

         {view === 'ADMIN' && (
           <AdminDashboard products={products} setProducts={setProducts} />
         )}
       </main>
       
       <CartDrawer 
         isOpen={isCartOpen} 
         onClose={() => setIsCartOpen(false)} 
         cart={cart}
         onRemove={removeFromCart}
         onUpdateQty={updateQuantity}
       />

       {/* Chat Bubble Trigger */}
       {!isChatOpen && (
         <button 
           onClick={() => setIsChatOpen(true)}
           className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 hover:scale-105 transition-all z-40 flex items-center gap-2 group"
         >
           <Bot className="w-6 h-6" />
           <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium pl-1">Ask Sprout</span>
         </button>
       )}

       <AIChat 
         isOpen={isChatOpen} 
         onClose={() => setIsChatOpen(false)}
         cart={cart}
         agent={agent}
         toolHandlers={toolHandlers}
       />
    </div>
  );
};

export default App;