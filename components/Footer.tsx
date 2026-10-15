/**
 * GreenGrocer AI — Footer
 * Brand column + newsletter signup + link columns + social/legal row.
 * Sticky at the bottom of the flex column layout (mt-auto on root in App).
 *
 * MIT License — Copyright (c) 2025 GreenGrocer AI
 */

import React, { useState } from 'react';
import { Sprout, Mail, Github, Twitter, Facebook } from 'lucide-react';
import type { ViewState } from '../types';

interface FooterProps {
  /** Navigate to a view when a footer link is clicked. */
  onNavigate: (view: ViewState) => void;
}

/** Static link columns. `view?` makes the link navigate, no view = anchor. */
const COLUMNS: { title: string; links: { label: string; view?: ViewState }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All Produce', view: 'SHOP' },
      { label: 'Seasonal Picks', view: 'SHOP' },
      { label: 'Organic Boxes', view: 'SHOP' },
      { label: 'Recipes', view: 'RECIPES' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My Orders', view: 'ORDERS' },
      { label: 'Cart', view: 'CART' },
      { label: 'Admin', view: 'ADMIN' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us' },
      { label: 'Sustainability' },
      { label: 'Farm Partners' },
      { label: 'Careers' },
    ],
  },
];

/** Dark, full-bleed footer with newsletter signup. */
const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    window.setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand + newsletter */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-primary-600 rounded-lg">
                <Sprout className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-bold text-white">GreenGrocer AI</span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm mb-4">
              Farm-fresh produce, intelligently curated. Subscribe for weekly seasonal picks and recipe ideas.
            </p>
            <form onSubmit={handleSubscribe} className="flex max-w-sm">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email for newsletter"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-white placeholder-gray-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-r-lg transition-colors"
              >
                {subscribed ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    <button
                      onClick={() => link.view && onNavigate(link.view)}
                      className="text-sm text-gray-400 hover:text-primary-400 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} GreenGrocer AI. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Twitter"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="GitHub"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
