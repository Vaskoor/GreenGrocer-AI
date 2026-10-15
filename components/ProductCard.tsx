/**
 * GreenGrocer AI — ProductCard
 * Compact product tile: image (h-44), organic leaf badge (top-left), seasonal
 * badge (top-right), category eyebrow, name, rating stars + count, price +
 * unit, and a quick "Add" button.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React from 'react';
import { Plus, Leaf, Star, Sun } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  /** The product to display. */
  product: Product;
  /** Add the product to the cart. */
  onAdd: (product: Product) => void;
  /** Open the product detail modal. */
  onSelect: (product: Product) => void;
}

/**
 * Render 5 stars with the first `rating` filled (rounded) and the rest empty.
 * Optionally shows a review count.
 */
const RatingStars: React.FC<{ rating: number; count?: number }> = ({ rating, count }) => {
  const rounded = Math.round(rating);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rounded
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
      {typeof count === 'number' && (
        <span className="ml-1 text-xs text-gray-500">({count})</span>
      )}
    </div>
  );
};

/** Heuristic: a product is "organic" if tagged organic or flagged isOrganic. */
const isOrganicProduct = (p: Product): boolean =>
  (p as Product & { isOrganic?: boolean }).isOrganic === true ||
  (p.tags?.some(t => t.toLowerCase() === 'organic') ?? false);

/** Compact, accessible product card. */
const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, onSelect }) => {
  const isOrganic = isOrganicProduct(product);
  const rating = product.rating ?? 0;
  const ratingCount = product.ratingCount;

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Image + badges */}
      <button
        onClick={() => onSelect(product)}
        className="relative block w-full h-44 overflow-hidden"
        aria-label={`View ${product.name} details`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        {isOrganic && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-600 text-white shadow-sm">
            <Leaf className="w-3 h-3" /> Organic
          </span>
        )}
        {product.seasonal && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-500 text-white shadow-sm">
            <Sun className="w-3 h-3" /> Seasonal
          </span>
        )}
      </button>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">
          {product.category}
        </p>
        <button
          onClick={() => onSelect(product)}
          className="mt-1 text-left font-bold text-gray-900 leading-tight hover:text-primary-700 transition-colors"
        >
          {product.name}
        </button>

        {rating > 0 && (
          <div className="mt-1.5">
            <RatingStars rating={rating} count={ratingCount} />
          </div>
        )}

        <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-1">{product.description}</p>

        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
            <p className="text-xs text-gray-500 -mt-0.5">/ {product.unit}</p>
          </div>
          <button
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.name} to cart`}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
