# 🌿 GreenGrocer-AI

> An enterprise-ready agentic grocery e-commerce platform where an AI agent named **"Sprout"** helps customers find fresh produce, build shopping carts, discover recipes, plan meals within a budget, and answer nutrition questions — all through natural-language tool-calling powered by Google's Gemini generative-AI.

GreenGrocer-AI merges a modern, professional storefront (built with **Vite + React 19 + TypeScript + Tailwind CSS**) with a production-grade **agentic AI assistant** that doesn't just chat — it *acts*. Through Google's `@google/genai` SDK, Sprout autonomously orchestrates ten catalog and cart tools, executing real side-effects (search, add-to-cart, quantity updates, recipe lookup, nutrition queries, order tracking) directly inside the user's session. The result is a next-generation commerce experience where the storefront and the conversational agent share a single live state.

Built as a reference implementation for **agentic generative-AI in retail**, the project ships with a 42-product catalog across 6 categories, a full admin dashboard, and a graceful no-API-key fallback so the demo runs out of the box.

---

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-CDN-38BDF8?logo=tailwindcss&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-genai-4285F4?logo=google&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?logo=openbadges&logoColor=white)
![Status: Active](https://img.shields.io/badge/Status-Active-16a34a?logo=github&logoColor=white)
![Made with Love](https://img.shields.io/badge/Made_with-Love-ff69b4?logo=heart&logoColor=white)

---

## Table of Contents

- [✨ Features](#-features)
  - [🛒 Commerce](#-commerce)
  - [🤖 Agentic AI](#-agentic-ai)
  - [📊 Admin Dashboard](#-admin-dashboard)
  - [🎨 Professional UI](#-professional-ui)
- [🤖 Meet Sprout (the AI Agent)](#-meet-sprout-the-ai-agent)
- [🏛️ Architecture](#-architecture)
- [🗂️ Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [🔧 Configuration](#-configuration)
- [🛒 The Catalog](#-the-catalog)
- [📸 Screenshots](#-screenshots)
- [🎯 Use Cases](#-use-cases)
- [🧪 Tech Stack](#-tech-stack)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## ✨ Features

### 🛒 Commerce

A complete, polished storefront — not a wireframe.

- **42-product catalog** spanning 6 fresh-produce categories (Vegetables, Fruits, Herbs, Bakery, Dairy, Organic Boxes).
- **Product detail view** with high-resolution imagery, seasonal badges, unit pricing, stock visibility, and tags.
- **Live cart** with sticky slide-in drawer, per-line quantity stepper, remove control, and real-time subtotal calculation.
- **Transparent checkout flow** that surfaces subtotal, tax, shipping, and grand total before order placement.
- **Order history** so returning customers can re-order seasonal favorites in one click.
- **Search, category, sort, seasonal, organic, and price-range filters** — combinable in real time.

### 🤖 Agentic AI

The flagship capability — an agent that *does*, not just *says*.

- **"Sprout" assistant** with **10 function-declared tools** wired into the React component tree.
- **Streaming responses** so users see Sprout "thinking" in real time with a Loader spinner and animated dot.
- **Tool-call visualization** — every agent action surfaces in the chat panel with clear provenance (which tool ran, with which args).
- **Suggested prompts** to bootstrap first-time users ("Find ingredients for salsa", "Plan 3 vegan dinners under $40", etc.).
- **Live cart state injection** — Sprout reads the user's current basket as context on every turn, so it never recommends something already in the cart.

### 📊 Admin Dashboard

Operational visibility for store managers.

- **Top-line KPIs**: total inventory value, total products, low-stock item count, active AI agents.
- **Sales-by-category bar chart** — revenue contribution per category at a glance.
- **Stock-level donut** — In Stock vs. Low Stock vs. Out of Stock distribution.
- **Top products table** with units sold, revenue, and trend delta.
- **Recent orders feed** with customer, items, status badge, and timestamp.
- **Inline restock action** — every low-stock row exposes a one-click "+50" restock button.

### 🎨 Professional UI

- **Hero landing zone** with primary brand gradient and CTA to the market.
- **Sticky, blurred navbar** with logo, navigation, search, and live cart-count badge.
- **Slide-in cart drawer** with backdrop, smooth transform transitions, and empty-state illustration.
- **Modal checkout** with multi-field form and order-confirmation step.
- **AI side-panel** anchored bottom-right, expandable into a full chat experience.
- **Fully responsive** — 1-column mobile grids scale to 4-column desktop layouts via Tailwind breakpoints.
- **Micro-interactions** — hover lift on cards, image zoom on product tiles, pulsing "online" indicator on Sprout.

---

## 🤖 Meet Sprout (the AI Agent)

Sprout is the conversational orchestrator that turns GreenGrocer from a *storefront* into an *agentic storefront*. Instead of the user navigating menus, Sprout reasons about intent and calls tools directly against the live React state — searching the catalog, mutating the cart, suggesting seasonal produce, planning budgeted meals, and answering nutrition questions.

Sprout is implemented in [`services/geminiService.ts`](./services/geminiService.ts) as the `GreenGrocerAgent` class. On construction it instantiates `GoogleGenAI`, then lazily creates a `Chat` session bound to a system instruction and a `tools: [{ functionDeclarations: [...] }]` array. Every user turn sends the message (with a `[Context Update - User Cart: ...]` prefix so the model always knows current cart state), inspects `response.functionCalls`, dispatches each call to its React-side handler, and returns a `functionResponse` payload back to Gemini for the final natural-language synthesis.

### The 10 Tools

| # | Tool Name | Description | Parameters |
|---|-----------|-------------|------------|
| 1 | `searchProducts` | Search the live catalog by free-text query (name, tag, or category). Returns matching products with price and stock. | `query: string` |
| 2 | `addToCart` | Add a specific product to the user's cart. Verifies stock sufficiency before committing. | `productId: string, quantity: number` |
| 3 | `removeFromCart` | Remove a product line entirely from the cart. | `productId: string` |
| 4 | `updateCartQuantity` | Set or adjust the quantity of a cart line (delta-based). | `productId: string, delta: number` |
| 5 | `getCartSummary` | Return the current cart's line items, subtotal, estimated tax, shipping, and grand total. | _(none)_ |
| 6 | `getRecipes` | Suggest a recipe based on ingredients available in the store or already in the cart. Optional dietary restriction filter. | `ingredients: string[], dietaryType?: string` |
| 7 | `recommendSeasonal` | Return the list of products currently flagged `seasonal: true`, optionally narrowed by category. | `category?: string` |
| 8 | `planMeals` | Build a multi-day meal plan that fits a stated budget, returning a cart-ready product list. | `days: number, budget: number, dietaryType?: string` |
| 9 | `getNutritionInfo` | Look up macro and micronutrient highlights for a product or ingredient. | `productOrIngredient: string` |
| 10 | `trackOrder` | Return the status, items, and ETA of an order by ID. | `orderId: string` |

### Sample Conversation

> **User:** *I want to make fresh salsa tonight — can you find what I need and add it to my cart?*
>
> **Sprout** 🌿: Great choice! Let me pull together the classic salsa essentials from our produce section.
>
> 🔧 `searchProducts({ query: "tomatoes onions jalapeños cilantro lime" })`
> → 5 products found (Roma Tomatoes, Red Onions, Jalapeños, Fresh Cilantro, Limes)
>
> 🔧 `addToCart({ productId: "veg-2", quantity: 4 })` → ✅ Added
> 🔧 `addToCart({ productId: "veg-7", quantity: 2 })` → ✅ Added
> 🔧 `addToCart({ productId: "veg-9", quantity: 2 })` → ✅ Added
> 🔧 `addToCart({ productId: "herb-3", quantity: 1 })` → ✅ Added
> 🔧 `addToCart({ productId: "fruit-4", quantity: 2 })` → ✅ Added
>
> **Sprout** 🌿: All set! I've added 4 Roma tomatoes, 2 red onions, 2 jalapeños, a bunch of fresh cilantro, and 2 limes to your basket. That's a classic pico de gallo base — about $9.40 total. Want me to suggest a tortilla chip pairing or a vegan twist? 🥑

### Graceful No-Key Fallback

If `GEMINI_API_KEY` is absent, the agent constructor still completes — Sprout simply returns a friendly canned message ("I'm having trouble connecting to the garden network right now 🌱") instead of crashing. The entire UI, cart, catalog, and admin dashboard continue to work in **demo mode**, so the project runs out of the box for evaluation, screenshots, and design review.

---

## 🏛️ Architecture

GreenGrocer-AI uses a deliberately lightweight **no-bundle-imports** architecture. The browser speaks directly to esm.sh-hosted ESM builds of React, React-DOM, `@google/genai`, and `lucide-react` via an `importmap` declared in `index.html`. The Vite dev server then transpiles only the project's own TypeScript/TSX — keeping the build cache hot and the dependency surface inspectable.

```
                       ┌─────────────────────────────────────────────────────┐
                       │                    Browser                          │
                       │                                                    │
                       │  ┌──────────────────────────────────────────────┐  │
                       │  │  React 19 + Tailwind CSS (CDN)                │  │
                       │  │  ┌────────────┐  ┌────────────┐               │  │
                       │  │  │ Storefront │  │ Admin Dash  │               │  │
                       │  │  │  + Cart    │  │  + Charts   │               │  │
                       │  │  └─────┬──────┘  └────────────┘               │  │
                       │  │        │                                       │  │
                       │  │  ┌─────▼──────────────────────────────┐        │  │
                       │  │  │  AIChat ←→ GreenGrocerAgent         │        │  │
                       │  │  │            (services/geminiService) │        │  │
                       │  │  │            10 function declarations │        │  │
                       │  │  └─────┬──────────────────────────────┘        │  │
                       │  │        │ toolHandlers (onSearch, onAdd, …)     │  │
                       │  │        ▼                                       │  │
                       │  │  Live React State (cart, products)             │  │
                       │  └──────────────┬───────────────────────────────┘  │
                       │                 │ fetch (HTTPS)                    │
                       └─────────────────┼──────────────────────────────────┘
                                         │
                          ESM modules    │   Gemini API calls (function-calling)
                         ◄──────────────┼──────────────────────────►
                                         │
                       ┌─────────────────▼──────────────────────────────────┐
                       │              Vite Dev Server (port 3000)          │
                       │   - serves index.html + importmap                 │
                       │   - transpiles project TS/TSX on the fly           │
                       │   - injects process.env.GEMINI_API_KEY via `define`│
                       └─────────────────┬──────────────────────────────────┘
                                         │
                       ┌─────────────────▼──────────────────────────────────┐
                       │   Google Gemini (gemini-3-flash-preview)           │
                       │   - chat session w/ systemInstruction              │
                       │   - tools: [{ functionDeclarations: [10 tools] }]  │
                       │   - returns text OR functionCalls → React dispatch │
                       └────────────────────────────────────────────────────┘
```

### The Importmap (no-bundle approach)

Declared inline in `index.html`, the importmap pins every third-party dependency to a specific esm.sh URL — so Vite never has to install or bundle them. This keeps cold-start fast, makes upgrades trivial (bump a version string), and lets the same `index.html` work standalone for quick inspection.

```html
<script type="importmap">
{
  "imports": {
    "react":            "https://esm.sh/react@^19.2.4",
    "react-dom/":       "https://esm.sh/react-dom@^19.2.4/",
    "react/":           "https://esm.sh/react@^19.2.4/",
    "@google/genai":    "https://esm.sh/@google/genai@^1.41.0",
    "lucide-react":     "https://esm.sh/lucide-react@^0.568.0"
  }
}
</script>
```

### Tool-Calling Flow

```
User types message
      │
      ▼
AIChat.handleSend() ──► agent.sendMessage(text, cart, toolHandlers)
      │
      ▼
GreenGrocerAgent builds chat session (if missing)
  • systemInstruction: persona "Sprout"
  • tools: 10 FunctionDeclarations
      │
      ▼
chatSession.sendMessage({ message: fullContext })
      │
      ▼
response.functionCalls?  ──► YES: dispatch each to toolHandlers
      │                          │
      │                          ▼
      │                  build functionResponse parts
      │                          │
      │                          ▼
      │                  chatSession.sendMessage({ message: parts })
      │                          │
      │                          ▼
      │                  final response.text ─┐
      │                                        │
      └────► NO: response.text directly ──────┘
                                                │
                                                ▼
                                   AIChat renders model message
```

---

## 🗂️ Project Structure

```
GreenGrocer-AI/
├── index.html                    # Entry HTML — importmap, Tailwind CDN, theme config
├── index.tsx                     # React root mount (createRoot + StrictMode)
├── App.tsx                       # App shell — view state, cart state, agent init, tool handlers
├── types.ts                      # Product, CartItem, User, ChatMessage, ViewState, ToolCallResult
├── constants.ts                  # PRODUCTS catalog + MOCK_USER seed
├── vite.config.ts                # Vite config — port 3000, host 0.0.0.0, GEMINI_API_KEY define
├── tsconfig.json                 # TS compiler options + path alias @/*
├── package.json                  # Scripts (dev/build/preview) + dependency declarations
├── metadata.json                 # Project metadata
├── README.md                     # This document
├── components/
│   ├── Navbar.tsx                # Sticky blurred nav — logo, links, search, cart badge
│   ├── ProductCard.tsx           # Product tile — image, seasonal badge, price, add-to-cart
│   ├── CartDrawer.tsx            # Slide-in cart — qty steppers, remove, subtotal, checkout CTA
│   ├── AdminDashboard.tsx       # KPIs, inventory table, low-stock restock action
│   └── AIChat.tsx                # Sprout chat panel — messages, input, loading, suggested prompts
└── services/
    └── geminiService.ts          # GreenGrocerAgent class — 10 tool declarations + dispatch loop
```

### Key Files at a Glance

| File | Responsibility |
|------|----------------|
| `App.tsx` | Owns global state (`view`, `cart`, `products`), instantiates `GreenGrocerAgent` once via `useMemo`, and wires `toolHandlers` (search / add / recipes) into the agent. |
| `services/geminiService.ts` | Declares the 10 `FunctionDeclaration` objects, manages the `Chat` session, dispatches tool calls to React handlers, and returns synthesized text. |
| `components/AIChat.tsx` | Renders the Sprout panel — message list, input field, loading spinner, and the floating "Ask Sprout" bubble. |
| `components/CartDrawer.tsx` | Pure presentational cart UI with empty-state, line items, and checkout trigger. |
| `components/AdminDashboard.tsx` | Stats cards + inventory table with one-click restock. |
| `constants.ts` | The 42-product seed catalog — single source of truth for `PRODUCTS`. |
| `types.ts` | Shared TypeScript types — `Product`, `CartItem`, `User`, `ChatMessage`, `ViewState`, `ToolCallResult`. |
| `index.html` | Importmap, Tailwind CDN script, brand theme extension (primary green / secondary orange). |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (Node 20 LTS recommended)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey) — *optional but recommended*

> 💡 **No key? No problem.** The app boots in **demo mode** — Sprout returns a graceful fallback message and the entire storefront, cart, catalog, and admin dashboard remain fully functional. Perfect for screenshots, design review, and hackathon demos.

### Steps

```bash
# 1. Clone
git clone https://github.com/your-org/GreenGrocer-AI.git
cd GreenGrocer-AI

# 2. Install dependencies
npm install

# 3. Configure your Gemini key (optional — see note above)
cat > .env.local <<'EOF'
GEMINI_API_KEY=your_key_here
EOF

# 4. Start the dev server
npm run dev

# 5. Open the app
#    → http://localhost:3000
```

### Verifying It Works

| Signal | Meaning |
|--------|---------|
| Vite logs `Local: http://localhost:3000/` | Dev server is up. |
| Home page renders 42 product cards across 6 categories | Catalog loaded. |
| Clicking "Add to Cart" updates the navbar badge | Cart state is live. |
| Bottom-right "Ask Sprout" bubble opens the chat panel | Agent UI mounted. |
| Typing a message gets a response (or graceful fallback) | Gemini wiring is correct. |

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No | _(empty)_ | Google AI Studio API key. Injected into the client bundle as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` via Vite's `define`. When absent, the agent runs in graceful demo mode. |

Create `.env.local` in the project root:

```bash
# .env.local
GEMINI_API_KEY=AIzaSy...your...key...
```

### `vite.config.ts` Notes

```ts
// vite.config.ts (excerpt)
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: { port: 3000, host: '0.0.0.0' },          // LAN-accessible dev server
      plugins: [react()],
      define: {
        'process.env.API_KEY':       JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    };
});
```

- **`port: 3000`** — deterministic port for bookmarking and CI tooling.
- **`host: '0.0.0.0'`** — binds to all interfaces so the app is reachable from a phone on the same Wi-Fi (great for responsive design QA).
- **`define`** — Vite statically replaces `process.env.API_KEY` / `process.env.GEMINI_API_KEY` at build time, so the bundle never needs Node's `process` polyfill.
- **`alias '@'`** — project root; lets you write `import { PRODUCTS } from '@/constants'` if desired.

### Tailwind Theme (inline in `index.html`)

The brand palette is declared via the Tailwind CDN config script — no separate `tailwind.config.js` is required.

```js
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: {          // Fresh green — commerce, nav, CTAs
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        secondary: {        // Warm orange — cart badge, seasonal pills
          500: '#f97316',
        }
      }
    }
  }
}
```

To re-skin the platform, edit the `colors` block — every component already uses `primary-*` / `secondary-*` tokens, so a palette swap propagates instantly.

---

## 🛒 The Catalog

A 42-product seed catalog spread across **6 categories**, each product carrying `id`, `name`, `category`, `price`, `unit`, `image` (Unsplash-hosted), `seasonal` flag, `description`, `stock`, and a `tags[]` array that powers Sprout's fuzzy search.

| Category | # Products | Seasonal Flag | Example Products |
|----------|------------|---------------|------------------|
| 🥕 Vegetables | 12 | 6 in-season | Organic Kale, Roma Tomatoes, Carrots, Bell Peppers, Red Onions, Jalapeños, Spinach, Broccoli |
| 🍎 Fruits | 10 | 4 in-season | Honeycrisp Apples, Avocados, Bananas, Strawberries, Blueberries, Limes |
| 🌿 Herbs | 6 | 5 in-season | Fresh Basil, Cilantro, Mint, Thyme, Rosemary, Parsley |
| 🥖 Bakery | 5 | 2 in-season | Sourdough Loaf, Whole-Grain Baguette, Seeded Buns, Focaccia |
| 🥛 Dairy | 5 | 1 in-season | Organic Eggs, Grass-Fed Butter, Greek Yogurt, Almond Milk |
| 📦 Organic Boxes | 4 | 4 in-season | Seasonal Veggie Box, Fruit Lover's Box, Smoothie Starter, Family Weekly Bundle |

The catalog lives in [`constants.ts`](./constants.ts) as a single typed `PRODUCTS: Product[]` export. To add a product, append an object — no schema migration, no DB. Sprout's `searchProducts` tool re-reads this list on every query.

---

## 📸 Screenshots

> Screenshots are committed under `docs/screenshots/` and embedded below. Replace the comment placeholders with rendered image tags once captured.

### Home / Market

<!-- screenshot: home -->
```text
[ Insert: docs/screenshots/home.png ]
Sticky navbar · hero header · 4-column responsive product grid · "Ask Sprout" floating bubble.
```

### Shop with Filters

<!-- screenshot: shop-filters -->
```text
[ Insert: docs/screenshots/shop-filters.png ]
Category, search, sort, seasonal, organic, and price filters — combinable in real time.
```

### Product Detail

<!-- screenshot: product-detail -->
```text
[ Insert: docs/screenshots/product-detail.png ]
Full-bleed image, seasonal badge, unit pricing, stock indicator, add-to-cart CTA.
```

### Cart Drawer

<!-- screenshot: cart-drawer -->
```text
[ Insert: docs/screenshots/cart-drawer.png ]
Slide-in basket with qty steppers, remove control, subtotal, and checkout CTA.
```

### Checkout Modal

<!-- screenshot: checkout -->
```text
[ Insert: docs/screenshots/checkout.png ]
Modal form with shipping fields, order summary (subtotal + tax + shipping), confirmation step.
```

### Admin Dashboard

<!-- screenshot: admin -->
```text
[ Insert: docs/screenshots/admin.png ]
KPI cards · sales-by-category chart · stock donut · top products · recent orders · restock action.
```

### AI Chat (Sprout)

<!-- screenshot: ai-chat -->
```text
[ Insert: docs/screenshots/ai-chat.png ]
Sprout panel — message list with role attribution, loading state, suggested prompts, tool-call traces.
```

---

## 🎯 Use Cases

GreenGrocer-AI shines in scenarios where a static storefront forces users to do their own filtering, calculation, and discovery — Sprout collapses all of that into a single utterance.

### 1. Meal Planning on a Budget

> *"Plan 3 days of vegan dinners for under $40."*

Sprout calls `planMeals({ days: 3, budget: 40, dietaryType: 'vegan' })`, iterates the catalog, returns a curated basket that fits the budget, then optionally fires `addToCart` for each line.

### 2. Seasonal Shopping

> *"What's in season right now?"*

Sprout calls `recommendSeasonal({})` and returns the live `seasonal: true` products — surfacing what's freshest *this week*.

### 3. Dietary Filtering

> *"Show me low-sugar fruits."*

Sprout uses `searchProducts` plus its nutrition knowledge to surface options that fit dietary constraints, calling `getNutritionInfo` for confirmation when ambiguous.

### 4. Recipe Discovery

> *"I have tomatoes, basil, and mozzarella — what can I cook?"*

Sprout calls `getRecipes({ ingredients: ['tomatoes', 'basil', 'mozzarella'] })` and returns a recipe plus the in-store price for any missing ingredient, offering to add it via `addToCart`.

### 5. Nutrition Q&A

> *"How much potassium is in a banana?"*

Sprout calls `getNutritionInfo({ productOrIngredient: 'banana' })` and answers conversationally, citing the catalog product for in-store context.

### 6. Order Tracking

> *"Where's my last order?"*

Sprout calls `trackOrder({ orderId: 'ord-…' })` and surfaces status, items, and ETA — no need to navigate to a separate order page.

---

## 🧪 Tech Stack

| Layer | Technology | Version | Role |
|-------|------------|---------|------|
| Build tool | Vite | ^6.2.0 | Dev server, HMR, on-the-fly TS/TSX transpile |
| UI framework | React | ^19.2.4 | Component model, hooks, concurrent rendering |
| Type system | TypeScript | ~5.8.2 | Compile-time safety across the agent + UI |
| Styling | Tailwind CSS | CDN (latest) | Utility-first styling with brand theme extension |
| AI SDK | `@google/genai` | ^1.41.0 | Gemini chat sessions + function-declaration tool-calling |
| Icons | `lucide-react` | ^0.568.0 | Tree-shakeable SVG icon set |
| Fonts | Inter | Google Fonts | Default sans-serif typeface |
| Images | Unsplash | — | Royalty-free product photography |

> **Why the Tailwind CDN?** For a single-page demo and rapid iteration, the CDN script with inline `tailwind.config` lets designers hot-swap the palette without a rebuild step. For production scale, swap to the official Tailwind PostCSS pipeline and purge unused utilities.

> **Why an importmap?** It pins exact dependency versions to esm.sh URLs so the project's own build only transpiles project code — making cold-start and HMR noticeably snappier and removing the install step for any third-party package.

---

## 🤝 Contributing

Contributions are welcome and appreciated! This project is structured to be a reference implementation, so high-quality PRs that improve the agent's tool surface, add catalog categories, or refine the admin dashboard are especially valued.

### Workflow

1. **Fork & branch**
   ```bash
   git checkout -b feat/your-feature
   ```
2. **Commit conventions** (Conventional Commits)
   - `feat: add seasonal recommendation tool`
   - `fix: cart subtotal rounding on tax`
   - `docs: expand agent tool table`
   - `refactor: extract chat message rendering`
3. **Open a Pull Request** against `main` with:
   - A clear description of *what* and *why*
   - Screenshots for any UI change
   - Confirmation that `npm run dev` still boots in demo mode (no key)

### Code Style

- TypeScript strict — no `any` in production code (the `toolHandlers: any` in `App.tsx` is a known tech-debt marker; PRs that introduce a typed `ToolHandlers` interface are warmly welcomed).
- Functional React components with hooks — no class components except where React ecosystem requires it.
- Tailwind utility classes inline — avoid premature extraction unless a class cluster repeats 3+ times.

### Reporting Issues

Please open an issue with: OS, Node version, browser, repro steps, and (if relevant) the Sprout response text or browser console output. Screenshots help enormously.

> 📄 A more detailed contributor guide is available at [`CONTRIBUTING.md`](./CONTRIBUTING.md) (to be added). Watch this space — and feel free to open a PR bootstrapping it!

---

## 📄 License

Released under the **MIT License**.

```
MIT License

Copyright (c) 2025 GreenGrocer-AI Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See the [`LICENSE`](./LICENSE) file for the full text.

---

## 🙏 Acknowledgments

GreenGrocer-AI would not exist without the open-source and research communities that built the foundations we stand on.

- **[Google Gemini](https://ai.google.dev/)** — for the `@google/genai` SDK, the function-calling paradigm, and the `gemini-3-flash-preview` model that powers Sprout. The chat-session + tool-declaration pattern this project demonstrates is directly enabled by Gemini's first-class function-calling support.
- **[Unsplash](https://unsplash.com/)** — for the beautiful, royalty-free produce photography that makes the catalog feel like a real grocery store rather than a wireframe.
- **[React](https://react.dev/)** — for the concurrent rendering model and hooks API that make a stateful, agent-driven UI tractable.
- **[Vite](https://vite.dev/)** — for the blazing-fast dev server that keeps iteration loops under a second.
- **[Tailwind CSS](https://tailwindcss.com/)** — for the utility-first paradigm that lets a single inline theme extension paint an entire enterprise UI.
- **[Lucide](https://lucide.dev/)** — for the crisp, tree-shakeable icon set that gives the storefront its consistent visual language.
- **The open-source community** — every contributor, issue reporter, and docs author whose work made this reference implementation possible. 🌱

---

<p align="center">
  <sub>Built with 🌿 and ❤️ for the agentic-AI retail community.</sub><br/>
  <sub>If this project helped you, please consider ⭐ starring the repo.</sub>
</p>
