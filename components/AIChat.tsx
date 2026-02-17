import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Loader2, Sparkles, ShoppingBag, Sprout } from 'lucide-react';
import { ChatMessage, CartItem } from '../types';
import { GreenGrocerAgent } from '../services/geminiService';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  agent: GreenGrocerAgent;
  toolHandlers: any;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, cart, agent, toolHandlers }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi there! I'm Sprout 🌿, your personal grocery assistant. I can help you find fresh produce, suggest recipes based on what's in season, or manage your cart. What are you looking for today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await agent.sendMessage(userMsg.text, cart, toolHandlers);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Oops! I tripped over a pumpkin. Could you say that again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md md:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-[600px] max-h-[80vh] animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Sprout AI Assistant</h3>
            <p className="text-xs text-primary-100 flex items-center">
              <span className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' && (
                <div className="flex items-center gap-1 mb-1 opacity-50 text-xs font-semibold uppercase tracking-wider">
                   <Sprout size={12} /> Sprout
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm rounded-bl-none flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span className="text-xs text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for recipes or products..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="ml-2 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex justify-center space-x-4 text-[10px] text-gray-400">
           <span className="flex items-center"><Sparkles className="w-3 h-3 mr-1" /> AI Powered</span>
           <span className="flex items-center"><ShoppingBag className="w-3 h-3 mr-1" /> Smart Cart</span>
        </div>
      </div>
    </div>
  );
};

export default AIChat;