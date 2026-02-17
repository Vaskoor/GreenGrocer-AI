import { GoogleGenAI, FunctionDeclaration, Type, Chat } from "@google/genai";
import { CartItem, Product } from "../types";

// --- Tool Definitions ---

const searchProductsTool: FunctionDeclaration = {
  name: 'searchProducts',
  description: 'Search for products in the store catalog based on a query or description.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query or product description (e.g., "red apples", "ingredients for salsa")' },
    },
    required: ['query'],
  },
};

const addToCartTool: FunctionDeclaration = {
  name: 'addToCart',
  description: 'Add a specific product to the user\'s shopping cart.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: { type: Type.STRING, description: 'The product name or ID to add.' },
      quantity: { type: Type.NUMBER, description: 'The number of units to add.' },
    },
    required: ['productId', 'quantity'],
  },
};

const getRecipesTool: FunctionDeclaration = {
  name: 'getRecipes',
  description: 'Find a recipe based on ingredients available in the store or the user\'s cart.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of ingredients to use' },
      dietaryType: { type: Type.STRING, description: 'Optional dietary restriction (e.g., vegan, gluten-free)' }
    },
    required: ['ingredients']
  }
};

const checkInventoryTool: FunctionDeclaration = {
  name: 'checkInventory',
  description: 'Check the stock level of a specific product.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productName: { type: Type.STRING, description: 'Name of the product to check' }
    },
    required: ['productName']
  }
};

// --- Service Class ---

export class GreenGrocerAgent {
  private ai: GoogleGenAI;
  private modelName = 'gemini-3-flash-preview';
  private chatSession: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async sendMessage(
    userMessage: string, 
    cart: CartItem[], 
    toolHandlers: { 
      onSearch: (q: string) => Product[], 
      onAddToCart: (id: string, qty: number) => boolean,
      onGetRecipes: (ing: string[]) => string
    }
  ): Promise<string> {
    
    // Construct system instruction with context
    // In a real app, dynamic context like "Current User Cart" is usually passed as part of the system instruction 
    // or as a context message at the start. Since `systemInstruction` is set at chat creation, 
    // we inject the dynamic cart state into the user message invisibly or just update the logic to handle it.
    // For this simple demo, we will re-initialize the chat if it doesn't exist, but typically 
    // you want to keep the session. We'll append Cart info to the user message for context.
    
    const contextPrefix = `[Context Update - User Cart: ${cart.length > 0 ? JSON.stringify(cart.map(c => `${c.quantity}x ${c.name}`)) : "Empty"}] `;

    const systemInstruction = `
      You are "Sprout", the intelligent agent for GreenGrocer AI. 
      Your goal is to help users find fresh produce, suggest recipes, and manage their shopping cart.
      
      Persona:
      - Friendly, helpful, and knowledgeable about food.
      - Use emojis like 🥦, 🍎, 🥕.
      - Act as a Orchestrator: If a user needs help with "Admin" tasks, politely decline as you are the Customer Assistant.
      
      Capabilities:
      1. Search for products using 'searchProducts'. If user says "salsa ingredients", search for tomatoes, onions, etc.
      2. Add items to cart using 'addToCart'.
      3. Suggest recipes.
      
      Important:
      - If you search and find products, list them clearly with prices.
      - Always verify product availability before suggesting adding to cart.
    `;

    try {
      if (!this.chatSession) {
        this.chatSession = this.ai.chats.create({
          model: this.modelName,
          config: {
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: [searchProductsTool, addToCartTool, getRecipesTool, checkInventoryTool] }],
          },
        });
      }

      // We prepend context to the message so the model knows the latest state without confusing the user logic
      const fullMessage = `${contextPrefix} User says: ${userMessage}`;
      
      let response = await this.chatSession.sendMessage({ message: fullMessage });

      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const functionResponseParts = [];

        for (const call of functionCalls) {
          const { name, args, id } = call;
          let functionResult = {};

          console.log(`[Agent] Calling tool: ${name}`, args);

          if (name === 'searchProducts') {
            const query = args.query as string;
            const products = toolHandlers.onSearch(query);
            functionResult = { found: products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock })) };
          } 
          else if (name === 'addToCart') {
            const success = toolHandlers.onAddToCart(args.productId as string, args.quantity as number);
            functionResult = { success, message: success ? 'Added to cart' : 'Failed. Product not found or out of stock.' };
          }
          else if (name === 'getRecipes') {
             const suggestion = toolHandlers.onGetRecipes(args.ingredients as string[]);
             functionResult = { suggestion };
          }
          else if (name === 'checkInventory') {
             const products = toolHandlers.onSearch(args.productName as string);
             const p = products[0];
             functionResult = { stock: p ? p.stock : 0, product: p ? p.name : 'Unknown' };
          }

          functionResponseParts.push({
            functionResponse: {
              name: name,
              response: { result: functionResult },
              id: id
            }
          });
        }

        // Send tool results back to model
        response = await this.chatSession.sendMessage({
          message: functionResponseParts
        });
        
        return response.text || "I've processed your request.";
      }

      return response.text || "I'm not sure how to help with that.";

    } catch (error) {
      console.error("Gemini Agent Error:", error);
      return "I'm having trouble connecting to the garden network right now. Please try again later. 🌱";
    }
  }
}
