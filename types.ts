export interface Product {
  id: string;
  name: string;
  category: 'Vegetables' | 'Fruits' | 'Herbs' | 'Organic Boxes';
  price: number;
  unit: string;
  image: string;
  seasonal: boolean;
  description: string;
  stock: number;
  tags: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  preferences: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isToolOutput?: boolean;
}

export type ViewState = 'HOME' | 'ADMIN' | 'CHECKOUT';

export interface ToolCallResult {
  result: any;
  displayText?: string;
}
