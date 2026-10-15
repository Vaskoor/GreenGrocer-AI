/**
 * GreenGrocer-AI — Type definitions
 * Copyright (c) 2025 GreenGrocer-AI. MIT License.
 *
 * Shared data contracts for the catalog, cart, checkout, recipes, orders,
 * chat agent, and admin tooling. Pure data layer — no React / runtime logic.
 */

/**
 * Catalog categories supported by the storefront. Order is meaningful: it
 * drives the navigation order in the shop view and admin dashboard.
 */
export type Category =
  | 'Vegetables'
  | 'Fruits'
  | 'Herbs'
  | 'Organic Boxes'
  | 'Bakery'
  | 'Dairy & Eggs';

/**
 * Top-level navigation state of the single-page storefront.
 * - HOME       — landing / hero / featured carousel
 * - SHOP       — filterable catalog grid
 * - PRODUCT    — single-product detail view
 * - CART       — cart drawer / review
 * - CHECKOUT   — shipping + payment summary
 * - ADMIN      — inventory + orders dashboard
 * - RECIPES    — curated recipe cards
 * - ORDERS     — past order history
 */
export type ViewState =
  | 'HOME'
  | 'SHOP'
  | 'PRODUCT'
  | 'CART'
  | 'CHECKOUT'
  | 'ADMIN'
  | 'RECIPES'
  | 'ORDERS';

/**
 * Macro + micronutrient breakdown per 100 g serving. Used by the product
 * detail view and the recipe analyzer.
 */
export interface NutritionInfo {
  /** Energy in kcal per 100 g. */
  calories: number;
  /** Protein in grams per 100 g. */
  protein_g: number;
  /** Carbohydrates in grams per 100 g. */
  carbs_g: number;
  /** Total fat in grams per 100 g. */
  fat_g: number;
  /** Dietary fiber in grams per 100 g. */
  fiber_g?: number;
  /** Optional vitamin C in milligrams per 100 g. */
  vitaminC_mg?: number;
}

/**
 * A single customer review attached to a product.
 */
export interface Review {
  /** Stable review id, e.g. `rev-veg-1-a`. */
  id: string;
  /** Display name of the reviewer. */
  author: string;
  /** Star rating, 1–5. */
  rating: number;
  /** Free-form review body. */
  comment: string;
  /** ISO date the review was submitted. */
  date: string;
}

/**
 * A sellable catalog item. Fully self-describing so ProductCard, ProductDetail,
 * CartDrawer, AdminDashboard, and the AI agent can all share one record.
 */
export interface Product {
  /** Stable product id, e.g. `veg-3`. */
  id: string;
  /** Human-facing display name. */
  name: string;
  /** Primary category used for filtering and routing. */
  category: Category;
  /** USD price per `unit`. */
  price: number;
  /** Unit of sale, e.g. "lb", "each", "bunch", "dozen", "loaf", "box". */
  unit: string;
  /** Public image URL (Unsplash). */
  image: string;
  /** True when in-season for the current catalog period. */
  seasonal: boolean;
  /** True when certified organic. */
  organic: boolean;
  /** One-line marketing description for cards. */
  description: string;
  /** 2–3 sentence description for the product detail view. */
  longDescription: string;
  /** On-hand inventory units. */
  stock: number;
  /** Free-form tags: ["vegan","gluten-free","high-fiber", ...]. */
  tags: string[];
  /** Aggregate rating, 3.8–4.9. */
  rating: number;
  /** Total ratings count used for "stars (n)" badges. */
  reviewCount: number;
  /** Human-readable provenance, e.g. "Capay Valley, CA". */
  origin: string;
  /** Per-100 g nutrition facts. */
  nutrition: NutritionInfo;
  /** Customer reviews (1–2 per seed product). */
  reviews: Review[];
  /** Optional flag promoting the product to the home carousel. */
  featured?: boolean;
}

/**
 * A Product plus the quantity selected by the shopper.
 */
export interface CartItem extends Product {
  quantity: number;
}

/**
 * A completed or in-flight customer order.
 */
export interface Order {
  /** Stable order id, e.g. `ord-1024`. */
  id: string;
  /** ISO date the order was placed. */
  date: string;
  /** Line items, each a CartItem snapshot at purchase time. */
  items: CartItem[];
  /** Pre-tax, pre-shipping subtotal in USD. */
  subtotal: number;
  /** Flat shipping fee in USD. */
  shipping: number;
  /** Sales tax in USD. */
  tax: number;
  /** Final charged total in USD. */
  total: number;
  /** Fulfillment status. */
  status: 'Delivered' | 'In Transit' | 'Processing' | 'Cancelled';
  /** Shipping address line. */
  address: string;
}

/**
 * A curated recipe that can be auto-built from catalog items by the AI agent.
 */
export interface Recipe {
  /** Stable recipe id, e.g. `rcp-1`. */
  id: string;
  /** Recipe title. */
  title: string;
  /** Ingredient list — name (matches Product.name when applicable) + qty string. */
  ingredients: { name: string; qty: string }[];
  /** Ordered preparation steps. */
  steps: string[];
  /** Human-readable total cook/active time, e.g. "25 min". */
  cookTime: string;
  /** Number of servings yielded. */
  servings: number;
  /** Dietary tags: ["vegan","gluten-free","dairy-free", ...]. */
  dietary: string[];
  /** Public hero image URL. */
  image: string;
}

/**
 * Multi-select sort options for the shop grid.
 */
export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name';

/**
 * Live filter state bound to the shop sidebar. Used by the AI agent's
 * `filter_products` tool so it can manipulate the same filters the user does.
 */
export interface FilterState {
  /** Active category filters (empty = all). */
  categories: Category[];
  /** Free-text search term matched against name, tags, origin. */
  search: string;
  /** Restrict to in-season items. */
  seasonalOnly: boolean;
  /** Restrict to organic items. */
  organicOnly: boolean;
  /** Upper price bound in USD. */
  maxPrice: number;
  /** Sort mode applied to results. */
  sort: SortOption;
}

/**
 * Authenticated (mock) shopper profile.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  /** Dietary / lifestyle preferences: ["organic","low-sugar", ...]. */
  preferences: string[];
  /** Default shipping address. */
  address: string;
}

/**
 * A single turn in the agent chat transcript. `role` follows the Gemini
 * convention with an added `system` channel for tool-output rendering.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  /** True when this message renders a tool call's displayText. */
  isToolOutput?: boolean;
  /** Name of the tool whose output this message represents. */
  toolName?: string;
}

/**
 * Return shape of agent tool calls — raw structured result plus an optional
 * human-facing summary the chat surface renders inline.
 */
export interface ToolCallResult {
  result: any;
  displayText?: string;
}
