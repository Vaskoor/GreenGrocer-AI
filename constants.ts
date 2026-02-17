import { Product, User } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'veg-1',
    name: 'Organic Kale',
    category: 'Vegetables',
    price: 3.99,
    unit: 'bunch',
    image: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=800',
    seasonal: true,
    description: 'Fresh, crunchy organic kale leaves. Perfect for smoothies or chips.',
    stock: 50,
    tags: ['green', 'leafy', 'superfood', 'organic']
  },
  {
    id: 'veg-2',
    name: 'Roma Tomatoes',
    category: 'Vegetables',
    price: 2.49,
    unit: 'lb',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
    seasonal: false,
    description: 'Ripe and juicy Roma tomatoes, ideal for sauces and salads.',
    stock: 120,
    tags: ['red', 'salad', 'cooking']
  },
  {
    id: 'fruit-1',
    name: 'Honeycrisp Apples',
    category: 'Fruits',
    price: 1.99,
    unit: 'lb',
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=800',
    seasonal: true,
    description: 'Sweet, crisp, and juicy. The perfect snack apple.',
    stock: 85,
    tags: ['sweet', 'snack', 'crunchy']
  },
  {
    id: 'fruit-2',
    name: 'Avocados',
    category: 'Fruits',
    price: 1.50,
    unit: 'each',
    image: 'https://images.unsplash.com/photo-1523049673856-3832c3924f7e?auto=format&fit=crop&q=80&w=800',
    seasonal: false,
    description: 'Creamy Hass avocados, ready to eat in 1-2 days.',
    stock: 40,
    tags: ['healthy-fat', 'toast', 'guacamole']
  },
  {
    id: 'herb-1',
    name: 'Fresh Basil',
    category: 'Herbs',
    price: 2.99,
    unit: 'bunch',
    image: 'https://images.unsplash.com/photo-1618375531912-867984bdfd87?auto=format&fit=crop&q=80&w=800',
    seasonal: true,
    description: 'Aromatic sweet basil.',
    stock: 25,
    tags: ['italian', 'pesto', 'aromatic']
  },
  {
    id: 'fruit-3',
    name: 'Bananas',
    category: 'Fruits',
    price: 0.69,
    unit: 'lb',
    image: 'https://images.unsplash.com/photo-1603833665858-e61d17a8622e?auto=format&fit=crop&q=80&w=800',
    seasonal: false,
    description: 'Fair trade organic bananas.',
    stock: 200,
    tags: ['potassium', 'snack', 'smoothie']
  },
  {
    id: 'veg-3',
    name: 'Carrots',
    category: 'Vegetables',
    price: 1.29,
    unit: 'lb',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800',
    seasonal: false,
    description: 'Crunchy orange carrots, rich in Beta Carotene.',
    stock: 150,
    tags: ['root', 'snack', 'cooking']
  },
  {
    id: 'veg-4',
    name: 'Bell Peppers',
    category: 'Vegetables',
    price: 1.99,
    unit: 'each',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdf5dbc240?auto=format&fit=crop&q=80&w=800',
    seasonal: true,
    description: 'Sweet red, yellow, and orange bell peppers.',
    stock: 60,
    tags: ['crunchy', 'colorful', 'vitamin-c']
  },
   {
    id: 'box-1',
    name: 'Seasonal Veggie Box',
    category: 'Organic Boxes',
    price: 29.99,
    unit: 'box',
    image: 'https://images.unsplash.com/photo-1595855709912-14309a967a53?auto=format&fit=crop&q=80&w=800',
    seasonal: true,
    description: 'A curated selection of this week\'s best seasonal vegetables.',
    stock: 20,
    tags: ['mix', 'value', 'surprise']
  }
];

export const MOCK_USER: User = {
  id: 'user-123',
  name: 'Alex Shopper',
  preferences: ['organic', 'low-sugar']
};