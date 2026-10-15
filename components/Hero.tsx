/**
 * GreenGrocer AI — Hero
 * Promotional landing hero: gradient background, eyebrow, headline, subhead,
 * two CTAs (Shop Market / Ask Sprout), trust-badge cluster, hero image, and
 * a floating "Sprout suggests" card.
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React from 'react';
import { Sparkles, Bot, Leaf, Truck, ShieldCheck } from 'lucide-react';

interface HeroProps {
  /** Click handler for the primary "Shop Market" CTA. */
  onShopClick: () => void;
  /** Click handler for the secondary "Ask Sprout" CTA. */
  onChatClick: () => void;
}

/** Trust badges rendered below the CTAs. */
const BADGES = [
  { icon: Leaf, label: '100% Organic Options' },
  { icon: Truck, label: 'Free Delivery over $50' },
  { icon: ShieldCheck, label: 'Farm-Direct Sourcing' },
];

/** Two-column hero with gradient bg, decorative blobs, and floating card. */
const Hero: React.FC<HeroProps> = ({ onShopClick, onChatClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-white">
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-primary-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left content */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Grocer
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Fresh from the Farm,
              <br />
              <span className="text-primary-600">Powered by AI.</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 max-w-lg">
              Discover seasonal produce, build smart carts, and get personalized recipes from
              Sprout — your intelligent grocery assistant.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onShopClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                Shop Market
              </button>
              <button
                onClick={onChatClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-700 text-gray-900 font-semibold rounded-xl shadow-sm transition-all"
              >
                <Bot className="w-5 h-5" />
                Ask Sprout
              </button>
            </div>

            {/* Badges */}
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {BADGES.map(b => (
                <li key={b.label} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="p-1 bg-primary-100 rounded-md text-primary-700">
                    <b.icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-medium">{b.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
              <img
                src="https://images.unsplash.com/photo-1542838136-5fd274596484?auto=format&fit=crop&q=80&w=1200"
                alt="Fresh produce arranged on a wooden table"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Sprout suggestion card */}
            <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-3 max-w-[240px]">
              <span className="p-2 bg-secondary-500/10 rounded-lg text-secondary-500">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xs text-gray-500 font-medium">Sprout suggests</p>
                <p className="text-sm font-bold text-gray-900">
                  In season: Kale, Apples, Basil
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
