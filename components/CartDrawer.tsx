/**
 * GreenGrocer AI — CartDrawer
 * Right-side slide-in drawer with line items (qty steppers + remove), a
 * free-shipping progress bar, a summary block (subtotal, shipping, tax,
 * total), and a Checkout CTA. Empty state included.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useEffect } from 'react';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import type { CartItem } from '../types';

interface CartDrawerProps {
  /** Drawer open state. */
  isOpen: boolean;
  /** Close the drawer. */
  onClose: () => void;
  /** Items in the cart. */
  cart: CartItem[];
  /** Remove an item from the cart. */
  onRemove: (id: string) => void;
  /** Apply a delta (±1) to an item's quantity. */
  onUpdateQty: (id: string, delta: number) => void;
  /** Proceed to checkout. */
  onCheckout: () => void;
}

/** Subtotal above which shipping is free. */
const FREE_SHIPPING_THRESHOLD = 50;
/** Flat shipping cost when subtotal is below the threshold. */
const SHIPPING_FLAT = 4.99;
/** Sales tax rate applied to subtotal. */
const TAX_RATE = 0.085;

/** Right-side drawer with sticky header + summary footer. */
const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onRemove,
  onUpdateQty,
  onCheckout,
}) => {
  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShipProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-40 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Your Basket</h2>
            {cart.length > 0 && (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                {cart.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-bold text-gray-900">Your basket is empty</p>
              <p className="text-sm text-gray-500">
                Add some fresh produce to get started.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Free shipping progress */}
              <div className="bg-primary-50 rounded-xl p-3 mb-2">
                <div className="flex items-center gap-2 text-xs text-primary-700 mb-1.5">
                  <Truck className="w-4 h-4" />
                  {remainingForFreeShip > 0 ? (
                    <span>
                      Add <span className="font-bold">${remainingForFreeShip.toFixed(2)}</span>{' '}
                      for free shipping!
                    </span>
                  ) : (
                    <span className="font-bold">You&apos;ve unlocked free shipping! 🎉</span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all duration-300"
                    style={{ width: `${freeShipProgress}%` }}
                  />
                </div>
              </div>

              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex gap-3 pb-4 border-b border-gray-50 last:border-0"
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-xs text-primary-600 font-semibold">
                          {item.category}
                        </p>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ${item.price.toFixed(2)} / {item.unit}
                    </p>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          aria-label={`Decrease ${item.name} quantity`}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-bold text-gray-900 min-w-[32px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label={`Increase ${item.name} quantity`}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Summary */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-5 bg-gray-50">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd className="font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Shipping</dt>
                <dd
                  className={`font-medium ${
                    shipping === 0 ? 'text-primary-700' : 'text-gray-900'
                  }`}
                >
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Tax (8.5%)</dt>
                <dd className="font-medium text-gray-900">${tax.toFixed(2)}</dd>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between text-base">
                <dt className="font-bold text-gray-900">Total</dt>
                <dd className="font-bold text-primary-700">${total.toFixed(2)}</dd>
              </div>
            </dl>
            <button
              onClick={onCheckout}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm transition-colors"
            >
              Checkout <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
