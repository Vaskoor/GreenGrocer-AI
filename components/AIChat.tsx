/**
 * GreenGrocer AI — AIChat
 * Right-side floating chat panel for Sprout. Streams model responses from
 * `agent.sendMessageStream()`, surfaces tool-call chips when the agent
 * invokes a tool, shows a typing indicator while waiting, and offers
 * suggested prompts for first-time users.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Bot, Sparkles, Wrench, Sprout } from 'lucide-react';
import type { ChatMessage } from '../types';
import type { GreenGrocerAgent, ToolHandlers } from '../services/geminiService';

interface AIChatProps {
  /** Panel open state. */
  isOpen: boolean;
  /** Close the panel. */
  onClose: () => void;
  /** The Sprout agent instance. */
  agent: GreenGrocerAgent;
  /** Tool handlers wired to global cart/order state. */
  toolHandlers: ToolHandlers;
}

/** Initial welcome message shown when the chat opens. */
const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text:
    "Hi there! I'm Sprout 🌱, your AI shopping assistant. I can find fresh produce, suggest recipes, manage your cart, or track your orders. What are we cooking today?",
  timestamp: new Date(),
};

/** Click-to-send suggested prompt chips (shown until first user message). */
const SUGGESTED_PROMPTS = [
  { label: 'Find seasonal produce', icon: '🍂', text: 'What seasonal produce is available right now?' },
  { label: 'Plan vegan meals', icon: '🥗', text: 'Plan 3 days of vegan meals under $40' },
  { label: 'Check my cart', icon: '🛒', text: "What's in my cart right now?" },
  { label: 'Recipe with tomatoes', icon: '🍅', text: 'Suggest a recipe with tomatoes' },
];

/**
 * Right-side floating chat panel. Streams `sendMessageStream` chunks:
 * - `role === 'system'` + `toolName` → render an amber tool-call chip
 * - `role === 'model'` + text → accumulate into the last model bubble
 */
const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, agent, toolHandlers }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Scroll the message list to the bottom. */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  // Focus the input shortly after opening.
  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 300);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  /**
   * Send a message (either the current input value or an explicit text, used
   * by the suggested-prompt chips). Streams the response, updating the
   * streaming model bubble in place and pushing tool-call chips as they
   * arrive.
   */
  const handleSend = useCallback(
    async (text?: string) => {
      const userText = (text ?? inputValue).trim();
      if (!userText || isLoading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      setInputValue('');
      setIsLoading(true);

      // Track the streaming model bubble's id so we can update it in place.
      let modelId: string | null = null;

      try {
        const stream = agent.sendMessageStream(userText, toolHandlers);
        for await (const chunk of stream) {
          // Tool-call chip
          if (chunk.role === 'system' && chunk.toolName) {
            setMessages(prev => [
              ...prev,
              {
                id: chunk.id || `t-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                role: 'system',
                text: chunk.toolName,
                toolName: chunk.toolName,
                timestamp: new Date(),
                isToolOutput: true,
              },
            ]);
            continue;
          }
          // Model text — accumulate into the last model bubble (streaming).
          if (chunk.role === 'model' && chunk.text) {
            setMessages(prev => {
              if (modelId) {
                return prev.map(m =>
                  m.id === modelId ? { ...m, text: chunk.text } : m
                );
              }
              const newId = `m-${Date.now()}`;
              modelId = newId;
              return [
                ...prev,
                { id: newId, role: 'model', text: chunk.text, timestamp: new Date() },
              ];
            });
          }
        }
      } catch (err) {
        console.error('[AIChat] stream error', err);
        setMessages(prev => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'model',
            text: 'Oops! I tripped over a pumpkin. Could you say that again? 🌱',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, agent, toolHandlers]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-full max-w-md md:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-[600px] max-h-[80vh] animate-in slide-in-from-bottom-5 fade-in duration-300"
      role="dialog"
      aria-label="Sprout AI assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-white/20 rounded-full">
            <Bot className="w-5 h-5 text-white" />
          </span>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1">
              Sprout 🌱
              <span className="text-xs font-normal text-primary-100">
                AI Assistant
              </span>
            </h3>
            <p className="text-[10px] text-primary-100 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full mr-1 animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="p-1 hover:bg-white/10 rounded transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-hide">
        {messages.map(msg => {
          // Tool-call chip
          if (msg.role === 'system' && msg.isToolOutput) {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  <Wrench className="w-3 h-3" /> Tool: {msg.toolName}
                </div>
              </div>
            );
          }
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words ${
                  isUser
                    ? 'bg-primary-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1 mb-1 opacity-60 text-[10px] font-bold uppercase tracking-wider">
                    <Sprout className="w-3 h-3" /> Sprout
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none p-3 border border-gray-100 shadow-sm flex items-center gap-1">
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts (only on welcome screen) */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 bg-gray-50">
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p.label}
              onClick={() => handleSend(p.text)}
              className="px-2.5 py-1.5 text-xs bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-700 rounded-full transition-colors"
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Sprout anything..."
            aria-label="Message Sprout"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
            className="ml-2 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex justify-center items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Powered
          </span>
          <span className="flex items-center gap-1">
            <Sprout className="w-3 h-3" /> Tool-using Agent
          </span>
        </div>
      </div>
    </div>
  );
};

/** Bouncing dot used in the typing indicator. */
const Dot: React.FC<{ delay: number }> = ({ delay }) => (
  <span
    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
    style={{ animationDelay: `${delay}ms` }}
  />
);

export default AIChat;
