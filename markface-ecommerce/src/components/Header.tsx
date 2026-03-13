'use client';

import Link from 'next/link';
import { useState } from 'react';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/5 px-4 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-primary rounded-lg text-white group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">bedtime</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Mark Face</h2>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/catalog?category=pajamas" className="text-sm font-semibold hover:text-primary transition-colors">Pajamas</Link>
            <Link href="/catalog?category=robes" className="text-sm font-semibold hover:text-primary transition-colors">Robes</Link>
            <Link href="/catalog?category=loungewear" className="text-sm font-semibold hover:text-primary transition-colors">Loungewear</Link>
            <Link href="/catalog?category=best-sellers" className="text-sm font-semibold hover:text-primary transition-colors">Best Sellers</Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-primary/5 dark:bg-primary/10 rounded-full px-4 py-2 border border-primary/10 group focus-within:border-primary/30 transition-all">
            <span className="material-symbols-outlined text-xl text-slate-400 group-focus-within:text-primary">search</span>
            <input 
              type="text"
              placeholder="Search comfort..."
              className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <button className="p-2 hover:bg-primary/10 rounded-full transition-colors">
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <Link href="/cart" className="p-2 hover:bg-primary/10 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="absolute top-1 right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">2</span>
            </Link>
            <button className="p-2 hover:bg-primary/10 rounded-full transition-colors">
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
