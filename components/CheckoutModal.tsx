/**
 * GreenGrocer AI — CheckoutModal
 * Two-step checkout modal: (1) shipping address form, (2) mock payment +
 * place order, then an order-confirmation screen with order ID, status, and
 * ship-to summary. On submit a new Order is created (via onPlaceOrder) and
 * the cart is cleared.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  MapPin,
  Loader2,
} from 'lucide-react';
import type { CartItem, Order } from '../types';

interface CheckoutModalProps {
  /** Modal open state. */
  isOpen: boolean;
  /** Close the modal. */
  onClose: () => void;
  /** Items being purchased. */
  cart: CartItem[];
  /** Create the order; receives the shipping address. Returns the new Order. */
  onPlaceOrder: (address: string) => Order;
}

type Step = 'address' | 'payment' | 'success';

/** Modal that orchestrates the 2-step flow + success state. */
const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onPlaceOrder,
}) => {
  const [step, setStep] = useState<Step>('address');
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({
    name: '',
    line1: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 50 ? 0 : 4.99;
  const tax = subtotal * 0.085;
  const grand = subtotal + shipping + tax;

  // Reset state shortly after closing (so the close animation can play).
  useEffect(() => {
    if (!isOpen) {
      const t = window.setTimeout(() => {
        setStep('address');
        setPlacedOrder(null);
        setSubmitting(false);
        setForm({
          name: '',
          line1: '',
          city: '',
          state: '',
          zip: '',
          country: 'United States',
          cardName: '',
          cardNumber: '',
          expiry: '',
          cvc: '',
        });
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const addressValid =
    form.name && form.line1 && form.city && form.state && form.zip;
  const paymentValid =
    form.cardName &&
    form.cardNumber.replace(/\s/g, '').length >= 12 &&
    form.expiry &&
    form.cvc.length >= 3;

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    // Simulate network latency for the mock payment gateway.
    await new Promise(res => window.setTimeout(res, 900));
    const order = onPlaceOrder(
      `${form.name}, ${form.line1}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`
    );
    setPlacedOrder(order);
    setSubmitting(false);
    setStep('success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-gray-50 border border-gray-100 rounded-full shadow-sm transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Stepper */}
        {step !== 'success' && (
          <div className="px-6 pt-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span className={step === 'address' ? 'text-primary-700' : 'text-gray-400'}>
                1 · Address
              </span>
              <span className="flex-1 h-px bg-gray-200" />
              <span className={step === 'payment' ? 'text-primary-700' : 'text-gray-400'}>
                2 · Payment
              </span>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Step 1: Address */}
          {step === 'address' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Shipping Address</h2>
              <p className="text-sm text-gray-500 mb-4">
                Where should we deliver your fresh produce?
              </p>
              <div className="space-y-3">
                <Field label="Full name">
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="checkout-input"
                    placeholder="Alex Shopper"
                  />
                </Field>
                <Field label="Street address">
                  <input
                    value={form.line1}
                    onChange={e => setForm({ ...form, line1: e.target.value })}
                    className="checkout-input"
                    placeholder="123 Fresh St"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      className="checkout-input"
                      placeholder="Portland"
                    />
                  </Field>
                  <Field label="State">
                    <input
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      className="checkout-input"
                      placeholder="OR"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ZIP">
                    <input
                      value={form.zip}
                      onChange={e => setForm({ ...form, zip: e.target.value })}
                      className="checkout-input"
                      placeholder="97201"
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      value={form.country}
                      onChange={e => setForm({ ...form, country: e.target.value })}
                      className="checkout-input"
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep('payment')}
                  disabled={!addressValid}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Payment</h2>
              <p className="text-sm text-gray-500 mb-4 inline-flex items-center gap-1">
                <CreditCard className="w-4 h-4" /> Mock payment — no real card will be
                charged.
              </p>
              <div className="space-y-3">
                <Field label="Name on card">
                  <input
                    value={form.cardName}
                    onChange={e => setForm({ ...form, cardName: e.target.value })}
                    className="checkout-input"
                    placeholder="Alex Shopper"
                  />
                </Field>
                <Field label="Card number">
                  <input
                    value={form.cardNumber}
                    onChange={e =>
                      setForm({
                        ...form,
                        cardNumber: e.target.value.replace(/[^\d ]/g, ''),
                      })
                    }
                    className="checkout-input"
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry">
                    <input
                      value={form.expiry}
                      onChange={e => setForm({ ...form, expiry: e.target.value })}
                      className="checkout-input"
                      placeholder="MM/YY"
                    />
                  </Field>
                  <Field label="CVC">
                    <input
                      value={form.cvc}
                      onChange={e =>
                        setForm({
                          ...form,
                          cvc: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      className="checkout-input"
                      placeholder="123"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-5 bg-gray-50 rounded-xl p-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-primary-700">${grand.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep('address')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={!paymentValid || submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Placing order...
                    </>
                  ) : (
                    `Place Order · $${grand.toFixed(2)}`
                  )}
                </button>
              </div>
            </>
          )}

          {/* Success */}
          {step === 'success' && placedOrder && (
            <div className="text-center py-4">
              <div className="inline-flex p-4 bg-primary-50 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
              <p className="text-sm text-gray-500 mt-1">
                Thank you for shopping with GreenGrocer AI.
              </p>

              <div className="mt-5 bg-gray-50 rounded-xl p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono font-bold text-gray-900">
                    {placedOrder.id}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1 text-primary-700 font-bold capitalize">
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    {placedOrder.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ship to
                  </span>
                  <span className="text-gray-900 max-w-[60%] truncate">
                    {placedOrder.address}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-primary-700">
                    ${placedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                A confirmation email is on its way. Use the Orders page to track your
                delivery.
              </p>

              <button
                onClick={onClose}
                className="mt-6 w-full px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Local input styles (kept here so the component is self-contained). */}
      <style>{`
        .checkout-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 0.5rem;
          outline: none;
          transition: all 0.15s;
        }
        .checkout-input:focus {
          background: white;
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }
      `}</style>
    </div>
  );
};

/** Labeled input wrapper for the form. */
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <label className="block">
    <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
      {label}
    </span>
    {children}
  </label>
);

export default CheckoutModal;
