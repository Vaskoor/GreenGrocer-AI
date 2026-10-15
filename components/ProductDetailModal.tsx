/**
 * GreenGrocer AI — ProductDetailModal
 * Full product details: large image, name/category/origin, rating + reviews,
 * price, stock, nutrition table, longDescription, quantity stepper, Add to
 * Cart CTA, and tag chips. Closes on backdrop click or Esc (handled in App).
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Plus,
  Minus,
  Leaf,
  MapPin,
  ShoppingCart,
  Package,
} from 'lucide-react';
import type { Product } from '../types';

interface ProductDetailModalProps {
  /** Product to display. Modal renders only when set (App gates on null). */
  product: Product;
  /** Close the modal. */
  onClose: () => void;
  /** Add `quantity` units of the product to the cart. */
  onAdd: (product: Product, quantity: number) => void;
}

/** Heuristic: organic if tagged organic or flagged isOrganic. */
const isOrganicProduct = (p: Product): boolean =>
  (p as Product & { isOrganic?: boolean }).isOrganic === true ||
  (p.tags?.some(t => t.toLowerCase() === 'organic') ?? false);

/** Centered modal with image-left / details-right layout. */
const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAdd,
}) => {
  const [qty, setQty] = useState(1);

  // Reset quantity whenever the product changes
  useEffect(() => {
    setQty(1);
  }, [product.id]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const organic = isOrganicProduct(product);
  const rating = product.rating ?? 0;
  const ratingCount = product.ratingCount ?? 0;
  const reviews = product.reviews ?? [];
  const nutrition = product.nutrition;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} details`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close product details"
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-gray-50 border border-gray-100 rounded-full shadow-sm transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image + badges */}
          <div className="relative h-72 md:h-full min-h-[400px] overflow-hidden md:rounded-l-3xl">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {organic && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-600 text-white shadow-sm">
                <Leaf className="w-3.5 h-3.5" /> Organic
              </span>
            )}
            {product.seasonal && (
              <span
                className={`absolute right-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-500 text-white shadow-sm ${
                  organic ? 'top-4' : 'top-4'
                }`}
              >
                Seasonal Pick
              </span>
            )}
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col">
            <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">
              {product.category}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">
              {product.name}
            </h2>

            {/* Rating */}
            {rating > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 fill-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {rating.toFixed(1)} · {ratingCount} reviews
                </span>
              </div>
            )}

            {/* Origin */}
            {product.origin && (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" /> Origin: {product.origin}
              </p>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">/ {product.unit}</span>
            </div>

            {/* Stock */}
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Package
                className={`w-4 h-4 ${product.stock > 0 ? 'text-primary-600' : 'text-red-500'}`}
              />
              <span
                className={product.stock > 0 ? 'text-gray-700' : 'text-red-600 font-medium'}
              >
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Description */}
            <p className="mt-4 text-gray-600 text-sm leading-relaxed">
              {product.longDescription ?? product.description}
            </p>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags.map(t => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity + Add */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-gray-900 min-w-[40px] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  aria-label="Increase quantity"
                  className="p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => onAdd(product, qty)}
                disabled={product.stock === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart · ${(product.price * qty).toFixed(2)}
              </button>
            </div>

            {/* Nutrition */}
            {nutrition && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Nutrition (per serving)
                </h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <NutritionRow label="Calories" value={`${nutrition.calories} kcal`} />
                    {typeof nutrition.protein === 'number' && (
                      <NutritionRow label="Protein" value={`${nutrition.protein} g`} />
                    )}
                    {typeof nutrition.carbs === 'number' && (
                      <NutritionRow label="Carbs" value={`${nutrition.carbs} g`} />
                    )}
                    {typeof nutrition.fat === 'number' && (
                      <NutritionRow label="Fat" value={`${nutrition.fat} g`} />
                    )}
                    {typeof nutrition.fiber === 'number' && (
                      <NutritionRow label="Fiber" value={`${nutrition.fiber} g`} />
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Reviews ({reviews.length})
                </h3>
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {reviews.slice(0, 3).map(r => (
                    <li key={r.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">{r.author}</p>
                        <div className="flex items-center" aria-label={`Rating ${r.rating}`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < r.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200 fill-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(r.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{r.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Two-row table row for nutrition facts. */
const NutritionRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <tr>
    <td className="py-2 text-gray-600">{label}</td>
    <td className="py-2 text-right font-medium text-gray-900">{value}</td>
  </tr>
);

export default ProductDetailModal;
