/**
 * GreenGrocer AI — App.tsx
 * Root application component: view routing, global cart/filter/order state,
 * Sprout agent wiring, and overlay (cart drawer, product modal, checkout,
 * chat) orchestration.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 *
 * @packageDocumentation
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Bot } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard from './components/AdminDashboard';
import AIChat from './components/AIChat';
import MobileBottomNav from './components/MobileBottomNav';
import { PRODUCTS, SAMPLE_ORDERS, SAMPLE_RECIPES } from './constants';
import { GreenGrocerAgent } from './services/geminiService';
import type {
  Product,
  CartItem,
  Order,
  Recipe,
  FilterState,
  ViewState,
} from './types';

/** Default catalog filters used by Shop view and Home featured grid. */
const DEFAULT_FILTERS: FilterState = {
  categories: [],
  search: '',
  sort: 'featured',
  seasonalOnly: false,
  organicOnly: false,
  maxPrice: 50,
};

/**
 * Root App component — owns global UI state and wires the agent's tool
 * handlers to the cart/orders and the static catalog/recipe data.
 */
const App: React.FC = () => {
  // === Global UI state ===
  const [view, setView] = useState<ViewState>('HOME');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // === Agent (singleton) ===
  const agent = useMemo(() => new GreenGrocerAgent(), []);

  // === Cart handlers ===
  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock)) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }, []);

  // === Navigation helper — some "views" open overlays instead ===
  const navigateTo = useCallback((next: ViewState) => {
    if (next === 'CART') {
      setIsCartOpen(true);
    } else if (next === 'CHECKOUT') {
      setIsCheckoutOpen(true);
    } else {
      setView(next);
      if (next === 'HOME' || next === 'SHOP') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);

  // === Product selection ===
  const openProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  // === Checkout — produces a new Order, clears the cart ===
  const placeOrder = useCallback((address: string): Order => {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = subtotal >= 50 ? 0 : 4.99;
    const tax = +(subtotal * 0.085).toFixed(2);
    const newOrder: Order = {
      id: `GG-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      shipping,
      tax,
      total: +(subtotal + shipping + tax).toFixed(2),
      status: 'Processing',
      address,
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    return newOrder;
  }, [cart]);

  // === Tool handlers for the Sprout agent ===
  const toolHandlers = useMemo(
    () => ({
      onSearch: (query: string) => {
        const q = query.toLowerCase().trim();
        if (!q) return products;
        return products.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.tags?.some(t => t.toLowerCase().includes(q))
        );
      },
      onAddToCart: (productId: string, quantity: number) => {
        const product = products.find(
          p => p.id === productId || p.name.toLowerCase() === productId.toLowerCase()
        );
        if (!product) return false;
        if (product.stock < quantity) return false;
        addToCart(product, quantity);
        return true;
      },
      onRemoveFromCart: (productId: string) => {
        const exists = cart.some(i => i.id === productId);
        if (!exists) return false;
        removeFromCart(productId);
        return true;
      },
      onUpdateCartQuantity: (productId: string, quantity: number) => {
        updateCartQuantity(productId, quantity);
      },
      onGetCartSummary: () => {
        const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return {
          items: cart,
          subtotal,
          count: cart.reduce((n, i) => n + i.quantity, 0),
        };
      },
      onGetRecipes: (_ingredients: string[]) => {
        return SAMPLE_RECIPES;
      },
      onRecommendSeasonal: () => {
        return products.filter(p => p.seasonal);
      },
      onPlanMeals: (_days: number, _budget?: number, _dietary?: string) => {
        return SAMPLE_RECIPES;
      },
      onGetNutritionInfo: (productName: string) => {
        const p = products.find(p =>
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        return p?.nutrition ?? null;
      },
      onTrackOrder: (orderId: string) => {
        return (
          orders.find(o => o.id.toLowerCase() === orderId.toLowerCase()) ?? null
        );
      },
    }),
    [products, cart, orders, addToCart, removeFromCart, updateCartQuantity]
  );

  // === Escape closes overlays in priority order ===
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isCheckoutOpen) setIsCheckoutOpen(false);
      else if (selectedProduct) setSelectedProduct(null);
      else if (isCartOpen) setIsCartOpen(false);
      else if (isChatOpen) setIsChatOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isCheckoutOpen, selectedProduct, isCartOpen, isChatOpen]);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // === Featured: top-rated 8 for Home view ===
  const featuredProducts = useMemo(
    () => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8),
    [products]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 antialiased">
      <Navbar
        cartCount={cartCount}
        currentView={view}
        onCartClick={() => setIsCartOpen(true)}
        onNavigate={navigateTo}
        onSearch={q => {
          setFilterState(prev => ({ ...prev, search: q }));
          setView('SHOP');
        }}
      />

      <main className="flex-grow w-full">
        {view === 'HOME' && (
          <>
            <Hero
              onShopClick={() => navigateTo('SHOP')}
              onChatClick={() => setIsChatOpen(true)}
            />
            <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-primary-600 font-semibold text-xs uppercase tracking-wider mb-1">
                    Curated for you
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Featured Fresh Picks
                  </h2>
                </div>
                <button
                  onClick={() => navigateTo('SHOP')}
                  className="hidden sm:inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View all →
                </button>
              </div>
              <ProductGrid
                products={featuredProducts}
                onAdd={addToCart}
                onSelect={openProduct}
                filterState={filterState}
                setFilterState={setFilterState}
                compact
              />
            </section>
          </>
        )}

        {view === 'SHOP' && (
          <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">The Market</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Fresh produce, organic boxes, and herbs — hand-picked daily.
              </p>
            </header>
            <ProductGrid
              products={products}
              onAdd={addToCart}
              onSelect={openProduct}
              filterState={filterState}
              setFilterState={setFilterState}
            />
          </section>
        )}

        {view === 'RECIPES' && (
          <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Seasonal Recipes</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Inspiration built from in-season produce.
              </p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SAMPLE_RECIPES.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        )}

        {view === 'ORDERS' && (
          <section className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Order History</h2>
              <p className="text-gray-500 mt-1 text-sm">Track and review your past orders.</p>
            </header>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-gray-500">No orders yet.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map(order => (
                  <li
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-bold text-gray-900">Order {order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-700">
                        {order.status}
                      </span>
                    </div>
                    <ul className="text-sm text-gray-700 divide-y divide-gray-50">
                      {order.items.map(it => (
                        <li key={it.id} className="py-2 flex justify-between">
                          <span>
                            {it.quantity}× {it.name}
                          </span>
                          <span>${(it.price * it.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {view === 'ADMIN' && (
          <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminDashboard
              products={products}
              orders={orders}
              setProducts={setProducts}
            />
          </section>
        )}
      </main>

      <Footer onNavigate={navigateTo} />

      {/* === Overlays === */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        onUpdateQty={(id, delta) =>
          updateCartQuantity(
            id,
            Math.max(0, (cart.find(i => i.id === id)?.quantity ?? 0) + delta)
          )
        }
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={closeProduct}
          onAdd={(p, qty) => {
            addToCart(p, qty);
            closeProduct();
            setIsCartOpen(true);
          }}
        />
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onPlaceOrder={placeOrder}
      />

      {/* === Floating Ask Sprout === */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          aria-label="Open Sprout AI assistant"
          className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 hover:scale-105 transition-all z-30 flex items-center gap-2 group"
        >
          <Bot className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium pl-1">
            Ask Sprout
          </span>
        </button>
      )}

      <AIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        agent={agent}
        toolHandlers={toolHandlers}
      />
      <MobileBottomNav
        currentView={view}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onNavigate={setView}
        onCartClick={() => setCartOpen(true)}
      />
    </div>
  );
};

/** Compact recipe tile used in the RECIPES view. */
const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
  <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
    <div className="h-40 overflow-hidden">
      <img
        src={recipe.image}
        alt={recipe.title}
        loading="lazy"
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <h3 className="font-bold text-gray-900">{recipe.title}</h3>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {recipe.tags?.map(t => (
          <span
            key={t}
            className="px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-700 font-medium"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 text-sm text-gray-600">
        <p className="font-medium">Ingredients ({recipe.ingredients.length})</p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {recipe.ingredients.join(', ')}
        </p>
      </div>
    </div>
  </article>
);

export default App;
