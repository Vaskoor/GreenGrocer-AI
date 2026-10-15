/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 GreenGrocer-AI Contributors
 *
 * @file services/geminiService.ts
 * @brief The "Sprout" AI agent for GreenGrocer-AI.
 *
 * Wraps @google/genai (Gemini) in an agentic chat with 10 function-calling
 * tools covering product search, cart management, recipes, meal planning,
 * nutrition info, and order tracking. Falls back gracefully to local logic
 * when no API key is present so the UI still demos offline.
 *
 * The `@google/genai` package is loaded via an importmap in index.html —
 * it is intentionally NOT added to package.json.
 */

import { GoogleGenAI, FunctionDeclaration, Type, Chat } from "@google/genai";
import {
  Product,
  CartItem,
  Recipe,
  Order,
  ChatMessage,
  NutritionInfo,
} from "../types";
import { PRODUCTS, SAMPLE_RECIPES, SAMPLE_ORDERS } from "../constants";

// ============================================================================
// Pricing / shipping constants (shared by both the agent and the UI's
// onGetCartSummary handler so the numbers always agree).
// ============================================================================

/** Sales tax rate (8.5%) advertised to the model. */
const TAX_RATE = 0.085;
/** Carts at or above this subtotal ship for free. */
const FREE_SHIPPING_THRESHOLD = 50;
/** Flat shipping fee when the subtotal is below the free-shipping threshold. */
const FLAT_SHIPPING_FEE = 4.99;
/** Guard against runaway tool-call loops. */
const MAX_TOOL_ROUNDS = 6;
/** Default model name. */
const MODEL_NAME = "gemini-2.5-flash";

// ============================================================================
// FunctionDeclaration tool definitions
// ============================================================================

/** 1. Search the catalog by name / tag / category. */
const searchProductsTool: FunctionDeclaration = {
  name: "searchProducts",
  description:
    "Fuzzy search the GreenGrocer catalog for products by name, tag, or category. " +
    "Always use this before recommending a product — never invent product info.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          'Free-text query (e.g. "red apples", "kale", "ingredients for salsa").',
      },
    },
    required: ["query"],
  },
};

/** 2. Add a product to the cart (by id OR case-insensitive name). */
const addToCartTool: FunctionDeclaration = {
  name: "addToCart",
  description:
    "Add a product to the shopping cart. Accepts either a product id or a " +
    "product name (case-insensitive). Verifies the requested quantity is in stock.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: {
        type: Type.STRING,
        description: "Product id (e.g. 'veg-1') OR product name (e.g. 'Organic Kale').",
      },
      quantity: {
        type: Type.NUMBER,
        description: "Number of units to add (>= 1).",
      },
    },
    required: ["productId", "quantity"],
  },
};

/** 3. Remove a cart line entirely. */
const removeFromCartTool: FunctionDeclaration = {
  name: "removeFromCart",
  description: "Remove a product line completely from the shopping cart.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: {
        type: Type.STRING,
        description: "Product id or product name of the line to remove.",
      },
    },
    required: ["productId"],
  },
};

/** 4. Set the absolute quantity of an in-cart product. */
const updateCartQuantityTool: FunctionDeclaration = {
  name: "updateCartQuantity",
  description:
    "Set the absolute quantity of a product in the cart. Use 0 to effectively " +
    "remove the line. Does NOT add a new line — use addToCart for that.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: {
        type: Type.STRING,
        description: "Product id or product name already in the cart.",
      },
      quantity: {
        type: Type.NUMBER,
        description: "The new absolute quantity (>= 0).",
      },
    },
    required: ["productId", "quantity"],
  },
};

/** 5. Return a structured cart summary (item count, subtotal, tax, shipping, total). */
const getCartSummaryTool: FunctionDeclaration = {
  name: "getCartSummary",
  description:
    "Return a structured summary of the current cart: item count, subtotal, " +
    "estimated tax (8.5%), shipping (free over $50, else $4.99), and grand total. " +
    "Call before checkout or budget planning.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

/** 6. Find recipes matching some ingredients (and optionally a dietary type). */
const getRecipesTool: FunctionDeclaration = {
  name: "getRecipes",
  description:
    "Find recipes from the GreenGrocer cookbook that match the given ingredients " +
    "(any intersection with the recipe's ingredients) and an optional dietary type.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      ingredients: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Ingredients the user has or wants to use.",
      },
      dietaryType: {
        type: Type.STRING,
        description: "Optional dietary restriction (e.g. 'vegan', 'gluten-free', 'low-carb').",
      },
    },
    required: ["ingredients"],
  },
};

/** 7. Return the currently-seasonal featured products. */
const recommendSeasonalTool: FunctionDeclaration = {
  name: "recommendSeasonal",
  description:
    "Return the currently-seasonal featured products from the catalog. No parameters.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

/** 8. Build a sample meal plan within a budget over a number of days. */
const planMealsTool: FunctionDeclaration = {
  name: "planMeals",
  description:
    "Build a sample meal plan that fits a given budget and number of days, " +
    "optionally respecting a dietary type. Returns a plan (days × meals) and its total cost.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      budget: {
        type: Type.NUMBER,
        description: "Total budget in USD.",
      },
      days: {
        type: Type.NUMBER,
        description: "Number of days to plan for (>= 1).",
      },
      dietaryType: {
        type: Type.STRING,
        description: "Optional dietary restriction.",
      },
    },
    required: ["budget", "days"],
  },
};

/** 9. Return a product's NutritionInfo. */
const getNutritionInfoTool: FunctionDeclaration = {
  name: "getNutritionInfo",
  description:
    "Return the NutritionInfo (calories, macros, etc.) for a specific product.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: {
        type: Type.STRING,
        description: "Product id or product name.",
      },
    },
    required: ["productId"],
  },
};

/** 10. Look up an order by id and return its status. */
const trackOrderTool: FunctionDeclaration = {
  name: "trackOrder",
  description: "Look up an order by id and return its current status.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: "The order id (e.g. 'ord-1001').",
      },
    },
    required: ["orderId"],
  },
};

/** All tool declarations wired into the chat config. */
const ALL_TOOLS: FunctionDeclaration[] = [
  searchProductsTool,
  addToCartTool,
  removeFromCartTool,
  updateCartQuantityTool,
  getCartSummaryTool,
  getRecipesTool,
  recommendSeasonalTool,
  planMealsTool,
  getNutritionInfoTool,
  trackOrderTool,
];

/** Public constant: the names of every tool the agent can call. */
export const TOOL_NAMES: string[] = ALL_TOOLS.map((t) => t.name);

// ============================================================================
// Tool handlers interface — implemented by the UI / App layer
// ============================================================================

/** Structured cart summary returned by {@link ToolHandlers.onGetCartSummary}. */
export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items?: CartItem[];
}

/** One row of a meal plan produced by {@link ToolHandlers.onPlanMeals}. */
export interface MealPlanItem {
  day: number;
  meal: string;
  product: Product;
  servings: number;
  cost: number;
}

/** A meal plan produced by {@link ToolHandlers.onPlanMeals}. */
export interface MealPlan {
  plan: MealPlanItem[];
  cost: number;
  withinBudget: boolean;
}

/**
 * Handlers the UI passes in to translate the agent's tool calls into actual
 * mutations of the in-app cart / data. The agent never touches React state
 * directly — it always goes through these callbacks so state stays the
 * single source of truth.
 */
export interface ToolHandlers {
  /** Fuzzy search across the product catalog. */
  onSearch: (query: string) => Product[];
  /** Add (or merge) a line into the cart. Return false if not found / OOS. */
  onAddToCart: (productId: string, quantity: number) => boolean;
  /** Remove a cart line entirely. Return false if the line wasn't there. */
  onRemoveFromCart: (productId: string) => boolean;
  /** Set the absolute quantity of an in-cart product. Return false on miss. */
  onUpdateCartQuantity: (productId: string, quantity: number) => boolean;
  /** Return a full structured cart summary. */
  onGetCartSummary: () => CartSummary;
  /** Find recipes matching ingredients + (optional) dietary type. */
  onGetRecipes: (ingredients: string[], dietaryType?: string) => Recipe[];
  /** Return the currently-seasonal products. */
  onRecommendSeasonal: () => Product[];
  /** Build a meal plan within a budget. */
  onPlanMeals: (budget: number, days: number, dietaryType?: string) => MealPlan;
  /** Look up a product's NutritionInfo. Return null if unknown. */
  onGetNutritionInfo: (productId: string) => NutritionInfo | null;
  /** Look up an order by id. Return null if unknown. */
  onTrackOrder: (orderId: string) => Order | null;
}

// ============================================================================
// System instruction (rich persona prompt)
// ============================================================================

const SYSTEM_INSTRUCTION = `You are Sprout, the friendly AI shopping assistant for GreenGrocer AI, an organic fresh-produce market.

Your job is to help customers:
  - Find fresh produce (always call searchProducts first — never invent product info)
  - Build and manage their shopping cart (add, remove, update quantities)
  - Discover recipes from the GreenGrocer cookbook
  - Plan meals that fit a given budget and dietary preference
  - Answer nutrition questions about specific products
  - Track the status of an existing order

Persona & tone:
  - Warm, concise, action-oriented. Use the occasional produce emoji (🥦🍎🥕🌿) but sparingly.
  - Always confirm what you did after a tool call ("I added 2 bunches of Organic Kale to your cart.").
  - If a product is out of stock, say so and suggest a seasonal alternative via recommendSeasonal.
  - If you don't know something, say so — never fabricate product names, prices, or stock levels.

Tool usage rules:
  - For ANY product mention, call searchProducts first to verify it exists.
  - When adding to cart, prefer the exact product id returned by searchProducts.
  - For checkout/budget questions, call getCartSummary before answering.
  - For "what's in season?" questions, call recommendSeasonal.
  - For meal planning, call planMeals and present the resulting plan + total cost.
  - For "how many calories / macros?" questions, call getNutritionInfo.
  - For "where is my order?" questions, call trackOrder.

Stay in character as the customer shopping assistant — politely decline admin/operational requests.`;

// ============================================================================
// GreenGrocerAgent
// ============================================================================

/**
 * The Sprout AI agent. Wraps @google/genai Chat with 10 function-calling
 * tools and a graceful no-key fallback so the UI still demos offline.
 *
 * @example
 * const agent = new GreenGrocerAgent();
 * for await (const chunk of agent.sendMessageStream("I want kale", handlers)) {
 *   if (chunk.role === "model") console.log(chunk.text);
 * }
 */
export class GreenGrocerAgent {
  private ai: GoogleGenAI | null = null;
  private chatSession: Chat | null = null;
  private readonly modelName = MODEL_NAME;
  /** True when an API key was present and the SDK was initialised. */
  public available = false;

  /**
   * Read the API key from process.env.API_KEY or process.env.GEMINI_API_KEY.
   * If absent, the agent runs in offline mode and every method returns a
   * graceful canned response so the UI still works for a demo.
   */
  constructor() {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.available = true;
      } catch (err) {
        console.warn("[Sprout] Failed to initialise GoogleGenAI — running offline.", err);
        this.ai = null;
        this.available = false;
      }
    } else {
      this.ai = null;
      this.available = false;
    }
  }

  // -- Chat bootstrapping ----------------------------------------------------

  /**
   * (Re)create the underlying Chat session with the full tool config and
   * system instruction. Cached on `this.chatSession`.
   */
  createChat(): Chat {
    if (!this.ai) {
      throw new Error("Cannot create chat: GoogleGenAI is not initialised (no API key).");
    }
    this.chatSession = this.ai.chats.create({
      model: this.modelName,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: ALL_TOOLS }],
      },
    });
    return this.chatSession;
  }

  // -- Tool dispatch ---------------------------------------------------------

  /**
   * Dispatch a single function call from the model to the matching UI
   * handler. Returns a JSON-serialisable result the model can consume.
   */
  private dispatchToolCall(
    call: { name: string; args?: Record<string, unknown>; id?: string },
    handlers: ToolHandlers
  ): unknown {
    const { name, args = {} } = call;
    try {
      switch (name) {
        case "searchProducts": {
          const query = String(args.query ?? "");
          const results = handlers.onSearch(query);
          return { found: results.map((p) => this.serializeProduct(p)) };
        }
        case "addToCart": {
          const productId = String(args.productId ?? "");
          const quantity = Number(args.quantity ?? 1);
          const ok = handlers.onAddToCart(productId, quantity);
          return {
            success: ok,
            message: ok ? "Added to cart" : "Failed — product not found or out of stock",
          };
        }
        case "removeFromCart": {
          const productId = String(args.productId ?? "");
          const ok = handlers.onRemoveFromCart(productId);
          return { success: ok, message: ok ? "Removed from cart" : "Item not in cart" };
        }
        case "updateCartQuantity": {
          const productId = String(args.productId ?? "");
          const quantity = Number(args.quantity ?? 0);
          const ok = handlers.onUpdateCartQuantity(productId, quantity);
          return { success: ok, message: ok ? "Quantity updated" : "Could not update quantity" };
        }
        case "getCartSummary": {
          const s = handlers.onGetCartSummary();
          return {
            itemCount: s.itemCount,
            subtotal: s.subtotal,
            tax: s.tax,
            shipping: s.shipping,
            total: s.total,
            items: (s.items ?? []).map((i) => ({
              id: i.id,
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
          };
        }
        case "getRecipes": {
          const ingredients = Array.isArray(args.ingredients)
            ? (args.ingredients as unknown[]).map(String)
            : [];
          const dietaryType = args.dietaryType ? String(args.dietaryType) : undefined;
          const recipes = handlers.onGetRecipes(ingredients, dietaryType);
          return { recipes: recipes.map((r) => this.serializeRecipe(r)) };
        }
        case "recommendSeasonal": {
          const seasonal = handlers.onRecommendSeasonal();
          return { seasonal: seasonal.map((p) => this.serializeProduct(p)) };
        }
        case "planMeals": {
          const budget = Number(args.budget ?? 0);
          const days = Number(args.days ?? 1);
          const dietaryType = args.dietaryType ? String(args.dietaryType) : undefined;
          const mealPlan = handlers.onPlanMeals(budget, days, dietaryType);
          return {
            plan: mealPlan.plan.map((item) => ({
              day: item.day,
              meal: item.meal,
              product: this.serializeProduct(item.product),
              servings: item.servings,
              cost: item.cost,
            })),
            totalCost: mealPlan.cost,
            withinBudget: mealPlan.withinBudget,
          };
        }
        case "getNutritionInfo": {
          const productId = String(args.productId ?? "");
          const n = handlers.onGetNutritionInfo(productId);
          if (!n) {
            return { found: false, message: "No nutrition info available for that product" };
          }
          return { found: true, nutrition: n };
        }
        case "trackOrder": {
          const orderId = String(args.orderId ?? "");
          const order = handlers.onTrackOrder(orderId);
          if (!order) {
            return { found: false, message: `No order found with id ${orderId}` };
          }
          return { found: true, order: this.serializeOrder(order) };
        }
        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (err) {
      console.error(`[Sprout] Tool ${name} threw:`, err);
      return { error: `Tool ${name} failed: ${(err as Error).message}` };
    }
  }

  // -- Serializers (slim shapes for the model context) -----------------------

  /** Slim JSON shape for a Product (includes nutrition if present). */
  private serializeProduct(p: Product) {
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit,
      stock: p.stock,
      seasonal: p.seasonal,
      tags: p.tags,
      description: p.description,
      // NutritionInfo is optional on the Product type — send it through if present.
      nutrition: (p as Product & { nutrition?: NutritionInfo }).nutrition ?? null,
    };
  }

  /** Slim JSON shape for a Recipe (defensive: Recipe shape is owned by types.ts). */
  private serializeRecipe(r: Recipe) {
    const any = r as unknown as Record<string, unknown>;
    return {
      id: any.id,
      title: any.title,
      description: any.description,
      ingredients: any.ingredients,
      dietaryTypes: any.dietaryTypes ?? any.dietaryType,
      instructions: any.instructions,
    };
  }

  /** Slim JSON shape for an Order (defensive: Order shape is owned by types.ts). */
  private serializeOrder(o: Order) {
    const any = o as unknown as Record<string, unknown>;
    return {
      id: any.id,
      status: any.status,
      total: any.total,
      createdAt: any.createdAt,
      items: any.items,
    };
  }

  // -- Public API: streaming -------------------------------------------------

  /**
   * Send a message and stream {@link ChatMessage} chunks back. Handles tool
   * round-trips automatically: when the model emits functionCalls, each is
   * dispatched to the matching handler, the responses are fed back, and we
   * keep streaming until the model produces a final text answer.
   *
   * Yields:
   *  - text deltas as `role:'model'` messages,
   *  - tool events as `role:'system'` messages with `isToolOutput:true, toolName`,
   *  - on any error / no-key: a single `role:'model'` fallback message.
   *
   * @param userText - the user's typed message
   * @param toolHandlers - the UI-supplied handlers (see {@link ToolHandlers})
   */
  async *sendMessageStream(
    userText: string,
    toolHandlers: ToolHandlers
  ): AsyncGenerator<ChatMessage> {
    // No-key / unavailable → run local fallback.
    if (!this.available || !this.ai) {
      yield this.localFallback(userText, toolHandlers);
      return;
    }

    try {
      if (!this.chatSession) this.createChat();

      // Outgoing message alternates between a user prompt and a list of
      // functionResponse parts fed back from tool calls.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let messageToSend: any = userText;
      let rounds = 0;

      while (rounds++ < MAX_TOOL_ROUNDS) {
        const chat = this.chatSession as Chat;
        const stream = await chat.sendMessageStream({ message: messageToSend });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let functionCalls: any[] = [];
        let sawText = false;

        for await (const chunk of stream) {
          // Stream text deltas as model messages.
          const text: string | undefined = chunk.text;
          if (text) {
            sawText = true;
            yield this.makeMessage("model", text);
          }
          const calls = chunk.functionCalls;
          if (calls && calls.length > 0) {
            functionCalls = functionCalls.concat(calls);
          }
        }

        // No tool calls → the model is done talking. Bail out.
        if (functionCalls.length === 0) {
          if (!sawText) {
            // Model finished without producing visible text — give a friendly nudge.
            yield this.makeMessage(
              "model",
              "I've finished updating your cart. Anything else I can help with? 🌿"
            );
          }
          return;
        }

        // Dispatch each tool call, yield tool-output events, and collect responses.
        const functionResponseParts: unknown[] = [];
        for (const call of functionCalls) {
          const callName: string = String(call.name ?? "unknown");
          const callId: string | undefined = call.id;
          const callArgs = call.args ?? {};
          yield this.makeMessage(
            "system",
            `🔧 ${callName}(${JSON.stringify(callArgs)})`,
            true,
            callName
          );
          const result = this.dispatchToolCall(
            { name: callName, args: callArgs as Record<string, unknown>, id: callId },
            toolHandlers
          );
          const preview = this.shortResultPreview(callName, result);
          yield this.makeMessage("system", `→ ${callName}: ${preview}`, true, callName);
          functionResponseParts.push({
            functionResponse: {
              name: callName,
              response: { result },
              id: callId,
            },
          });
        }

        // Feed the responses back and keep streaming.
        messageToSend = functionResponseParts;
      }

      // Exceeded MAX_TOOL_ROUNDS — graceful stop.
      yield this.makeMessage(
        "model",
        "I've done what I can for now — let me know if you'd like me to keep going. 🌱"
      );
    } catch (err) {
      console.error("[Sprout] sendMessageStream error:", err);
      yield this.makeMessage("model", this.errorFallbackText(toolHandlers));
    }
  }

  // -- Public API: non-streaming --------------------------------------------

  /**
   * Non-streaming convenience wrapper around {@link sendMessageStream}.
   * Consumes the whole stream, joins the model's text deltas into a single
   * message, and returns it. Tool events are dropped (the caller only sees
   * the final answer). Falls back to local logic if no API key is set.
   *
   * @param userText - the user's typed message
   * @param toolHandlers - the UI-supplied handlers (see {@link ToolHandlers})
   * @returns the assembled model message
   */
  async sendMessage(userText: string, toolHandlers: ToolHandlers): Promise<ChatMessage> {
    let joined = "";
    let sawTool = false;
    for await (const msg of this.sendMessageStream(userText, toolHandlers)) {
      if (msg.role === "model") {
        joined += msg.text;
      } else if (msg.isToolOutput) {
        sawTool = true;
      }
    }
    if (joined) {
      return this.makeMessage("model", joined);
    }
    // Edge case: model produced only tool output. Surface a brief summary.
    if (sawTool) {
      return this.makeMessage("model", "Done — I've made that update for you. Anything else? 🌿");
    }
    return this.makeMessage("model", "I wasn't able to reach the garden network just then. 🌱");
  }

  // -- Helpers --------------------------------------------------------------

  /**
   * Build a ChatMessage with a unique id and current timestamp. Tool-output
   * messages additionally carry `isToolOutput=true` and (optionally) `toolName`.
   */
  private makeMessage(
    role: ChatMessage["role"],
    text: string,
    isToolOutput = false,
    toolName?: string
  ): ChatMessage {
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      text,
      timestamp: new Date(),
      isToolOutput,
    } as ChatMessage;
    if (toolName) {
      (msg as ChatMessage & { toolName?: string }).toolName = toolName;
    }
    return msg;
  }

  /** A one-line preview of a tool's result, for the system-message log. */
  private shortResultPreview(name: string, result: unknown): string {
    try {
      switch (name) {
        case "searchProducts":
        case "recommendSeasonal": {
          const r = result as { found?: unknown[]; seasonal?: unknown[] };
          const arr = (r.found ?? r.seasonal ?? []) as unknown[];
          return `${arr.length} item(s)`;
        }
        case "addToCart":
        case "removeFromCart":
        case "updateCartQuantity": {
          const r = result as { success?: boolean };
          return r.success ? "ok" : "failed";
        }
        case "getCartSummary": {
          const r = result as { total?: number };
          return `total $${Number(r.total ?? 0).toFixed(2)}`;
        }
        case "getRecipes": {
          const r = result as { recipes?: unknown[] };
          return `${(r.recipes ?? []).length} recipe(s)`;
        }
        case "planMeals": {
          const r = result as { totalCost?: number; withinBudget?: boolean };
          return `$${Number(r.totalCost ?? 0).toFixed(2)} (${r.withinBudget ? "within budget" : "over budget"})`;
        }
        case "getNutritionInfo": {
          const r = result as { found?: boolean };
          return r.found ? "found" : "not found";
        }
        case "trackOrder": {
          const r = result as { found?: boolean };
          return r.found ? "found" : "not found";
        }
        default:
          return "ok";
      }
    } catch {
      return "ok";
    }
  }

  // -- No-key / offline fallback --------------------------------------------

  /**
   * Build a helpful local response when the cloud model isn't available.
   * Recognises a few common intents (search, seasonal, cart summary,
   * recipes) using only the in-process catalog + the UI-supplied handlers.
   *
   * @returns a `role:'model'` ChatMessage starting with
   *   "I couldn't reach the cloud model, but here's what I found locally: …"
   */
  private localFallback(userText: string, handlers: ToolHandlers): ChatMessage {
    const q = userText.toLowerCase().trim();

    try {
      // Cart summary intent
      if (
        q.includes("cart") &&
        (q.includes("summary") || q.includes("total") || q.includes("checkout"))
      ) {
        const s = handlers.onGetCartSummary();
        return this.makeMessage(
          "model",
          "I couldn't reach the cloud model, but here's what I found locally:\n" +
            `🛒 Cart summary — ${s.itemCount} item(s), subtotal $${s.subtotal.toFixed(2)}, ` +
            `tax $${s.tax.toFixed(2)}, shipping $${s.shipping.toFixed(2)}, ` +
            `grand total $${s.total.toFixed(2)}.`
        );
      }

      // Seasonal intent
      if (q.includes("seasonal") || q.includes("in season") || q.includes("what's fresh")) {
        const items = handlers.onRecommendSeasonal();
        return this.makeMessage(
          "model",
          "I couldn't reach the cloud model, but here's what I found locally:\n" +
            "🌿 Seasonal picks: " +
            items.map((p) => `${p.name} ($${p.price.toFixed(2)}/${p.unit})`).join(", ") +
            "."
        );
      }

      // Recipe intent
      if (q.includes("recipe") || q.includes("cook") || q.includes("meal")) {
        const recipes = handlers.onGetRecipes([], undefined);
        const titles = recipes
          .slice(0, 3)
          .map((r) => (r as unknown as { title?: string }).title ?? "Untitled");
        return this.makeMessage(
          "model",
          "I couldn't reach the cloud model, but here's what I found locally:\n" +
            "📖 Suggested recipes: " +
            (titles.length ? titles.join(", ") : "(no recipes in the local cookbook)") +
            "."
        );
      }

      // Search intent
      const searchMatch = q.match(
        /(?:find|search|look for|do you have|want|need|i'd like|i would like)\s+(.*)/
      );
      if (searchMatch && searchMatch[1]) {
        const query = searchMatch[1].trim();
        const results = handlers.onSearch(query);
        if (results.length > 0) {
          return this.makeMessage(
            "model",
            `I couldn't reach the cloud model, but here's what I found locally for "${query}":\n` +
              results
                .map((p) => `• ${p.name} — $${p.price.toFixed(2)}/${p.unit} (${p.stock} in stock)`)
                .join("\n")
          );
        }
        return this.makeMessage(
          "model",
          `I couldn't reach the cloud model, and locally I didn't find any matches for "${query}". ` +
            "Try a different spelling, or ask for something seasonal. 🌱"
        );
      }
    } catch (err) {
      console.warn("[Sprout] localFallback intent handler threw:", err);
    }

    // Default fallback: seasonal recommendations.
    return this.makeMessage("model", this.errorFallbackText(handlers));
  }

  /**
   * Friendly text for any error path (network failure, SDK exception, or no
   * API key). Surfaces a seasonal pick so the message is still useful.
   */
  private errorFallbackText(handlers: ToolHandlers, seasonalOverride?: Product[]): string {
    let seasonal: Product[];
    try {
      seasonal = (seasonalOverride ?? handlers.onRecommendSeasonal()).slice(0, 3);
    } catch {
      seasonal = (seasonalOverride ?? localRecommendSeasonal()).slice(0, 3);
    }
    const picks = seasonal.map((p) => `${p.name} ($${p.price.toFixed(2)})`).join(", ");
    return (
      "I'm offline right now — here's a seasonal pick: " +
      (picks || "the catalog is empty") +
      ". Ask me again in a moment and I should be back online. 🌱"
    );
  }
}

// ============================================================================
// Local helper functions (exported for UI handler reuse)
//
// The UI's ToolHandlers usually wrap these so the no-key path and the LLM
// path see identical results — but a UI is free to substitute its own logic.
// ============================================================================

/**
 * Compute a cart summary from a raw list of CartItems, using the same
 * 8.5% tax and $50 free-shipping rules the agent advertises to the model.
 * Exported so the UI's `onGetCartSummary` handler can reuse it.
 *
 * @param items - the current cart contents
 */
export function computeCartSummary(items: CartItem[]): CartSummary {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const total = +(subtotal + tax + shipping).toFixed(2);
  return {
    itemCount,
    subtotal: +subtotal.toFixed(2),
    tax,
    shipping,
    total,
    items,
  };
}

/**
 * Local fuzzy search across name / tags / category.
 * Exported so the UI's `onSearch` handler can reuse it.
 */
export function localSearchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PRODUCTS.filter((p) => {
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/**
 * Filter SAMPLE_RECIPES by ingredient intersection and optional dietary
 * type. Exported so the UI's `onGetRecipes` handler can reuse it.
 */
export function localGetRecipes(ingredients: string[], dietaryType?: string): Recipe[] {
  const ingLower = ingredients.map((i) => i.toLowerCase());
  return SAMPLE_RECIPES.filter((r) => {
    const any = r as unknown as Record<string, unknown>;
    const recipeIngredients: string[] = Array.isArray(any.ingredients)
      ? (any.ingredients as string[]).map((i) => String(i).toLowerCase())
      : [];
    const matchesIngredients =
      ingLower.length === 0 ||
      ingLower.some((i) =>
        recipeIngredients.some((ri) => ri.includes(i) || i.includes(ri))
      );
    if (!matchesIngredients) return false;
    if (dietaryType) {
      const dietaryTypes: string[] = Array.isArray(any.dietaryTypes)
        ? (any.dietaryTypes as string[]).map((d) => String(d).toLowerCase())
        : any.dietaryType
          ? [String(any.dietaryType).toLowerCase()]
          : [];
      return dietaryTypes.some((d) => d.includes(dietaryType.toLowerCase()));
    }
    return true;
  });
}

/** Local seasonal recommendation. Exported for UI reuse. */
export function localRecommendSeasonal(): Product[] {
  return PRODUCTS.filter((p) => p.seasonal);
}

/**
 * Local meal planner: greedily picks seasonal + cheap products to cover
 * the requested number of days within the budget. Optionally filters by
 * dietary type via product tags. Exported so the UI's `onPlanMeals`
 * handler can reuse it.
 */
export function localPlanMeals(
  budget: number,
  days: number,
  dietaryType?: string
): MealPlan {
  const plan: MealPlanItem[] = [];
  let spent = 0;
  const mealsPerDay = 2; // breakfast-ish + dinner-ish
  const mealNames = ["Breakfast", "Lunch", "Dinner", "Snack"];

  const pool = PRODUCTS.filter((p) => {
    if (p.stock <= 0) return false;
    if (dietaryType) {
      const tags = p.tags.map((t) => t.toLowerCase());
      return tags.some((t) => t.includes(dietaryType.toLowerCase()));
    }
    return true;
  }).sort((a, b) => {
    if (a.seasonal !== b.seasonal) return a.seasonal ? -1 : 1;
    return a.price - b.price;
  });

  for (let day = 1; day <= days; day++) {
    for (let m = 0; m < mealsPerDay; m++) {
      const pick = pool.find((p) => spent + p.price <= budget);
      if (!pick) break;
      plan.push({
        day,
        meal: mealNames[m % mealNames.length],
        product: pick,
        servings: 1,
        cost: pick.price,
      });
      spent += pick.price;
    }
  }

  return {
    plan,
    cost: +spent.toFixed(2),
    withinBudget: spent <= budget,
  };
}

/**
 * Resolve a product id OR a case-insensitive name to a Product.
 * Shared by addToCart / updateCartQuantity / getNutritionInfo.
 */
function resolveProduct(productId: string): Product | undefined {
  const needle = productId.toLowerCase();
  return PRODUCTS.find(
    (p) => p.id === productId || p.name.toLowerCase() === needle
  );
}

/**
 * Local add-to-cart predicate — returns the resolved Product (or null) so
 * the UI can perform the actual mutation. Exported for UI reuse.
 */
export function localResolveProductForCart(productId: string): Product | null {
  return resolveProduct(productId) ?? null;
}

/** Look up a SAMPLE_ORDER by id. Exported so the UI's `onTrackOrder` can reuse it. */
export function localTrackOrder(orderId: string): Order | null {
  return (
    SAMPLE_ORDERS.find((o) => {
      const any = o as unknown as Record<string, unknown>;
      return String(any.id) === orderId;
    }) ?? null
  );
}

/**
 * Look up a product's NutritionInfo by id or name. Exported so the UI's
 * `onGetNutritionInfo` handler can reuse it.
 */
export function localGetNutritionInfo(productId: string): NutritionInfo | null {
  const p = resolveProduct(productId);
  if (!p) return null;
  return (p as Product & { nutrition?: NutritionInfo }).nutrition ?? null;
}
