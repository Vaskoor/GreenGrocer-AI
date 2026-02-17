import React from 'react';
import { Plus, Leaf } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        {product.seasonal && (
          <div className="absolute top-3 left-3 bg-secondary-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
            <Leaf className="w-3 h-3 mr-1" />
            Seasonal
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">{product.category}</p>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
            <span className="text-xs text-gray-500 block">/{product.unit}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
        
        <div className="mt-auto pt-3 border-t border-gray-50">
           <button 
             onClick={() => onAdd(product)}
             className="w-full flex items-center justify-center space-x-2 bg-primary-50 text-primary-700 hover:bg-primary-500 hover:text-white py-2.5 rounded-xl font-medium transition-colors duration-200"
           >
             <Plus className="w-4 h-4" />
             <span>Add to Cart</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;