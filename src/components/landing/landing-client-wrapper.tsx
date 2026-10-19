'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ProductCatalog } from '@/components/landing/product-catalog';
import { StoreInfo } from '@/components/landing/store-info';
import { Footer } from '@/components/landing/footer';
import { LoginModal } from '@/components/landing/login-modal';
import { Smartphone, Headphones, MapPin, Lock, MessageCircle } from 'lucide-react';
import { STORE_CONTACT } from '@/data/landing-products';

export function LandingClientWrapper() {
  const [catalogCategory, setCatalogCategory] = useState<'all' | 'smartphones' | 'headsets'>('all');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleCategorySelect = (category: 'all' | 'smartphones' | 'headsets') => {
    setCatalogCategory(category);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Navbar with 3-bar menu */}
      <Navbar onCategorySelect={handleCategorySelect} />

      {/* Main Page Content */}
      <main className="flex-1 pb-16 sm:pb-0">
        <Hero
          onExplorePhones={() => handleCategorySelect('smartphones')}
          onExploreHeadsets={() => handleCategorySelect('headsets')}
        />
        <ProductCatalog key={catalogCategory} initialCategory={catalogCategory} />
        <StoreInfo />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Quick Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/80 px-2 py-2 safe-bottom shadow-2xl">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleCategorySelect('smartphones')}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-secondary/80 text-foreground transition-colors"
          >
            <Smartphone className="h-4 w-4 text-indigo-400 mb-0.5" />
            <span className="text-[10px] font-semibold">Phones</span>
          </button>

          <button
            onClick={() => handleCategorySelect('headsets')}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-secondary/80 text-foreground transition-colors"
          >
            <Headphones className="h-4 w-4 text-purple-400 mb-0.5" />
            <span className="text-[10px] font-semibold">AirPods</span>
          </button>

          <a
            href="#store-info"
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-secondary/80 text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4 text-emerald-400 mb-0.5" />
            <span className="text-[10px] font-semibold">Store</span>
          </a>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors border border-primary/20"
          >
            <Lock className="h-4 w-4 mb-0.5" />
            <span className="text-[10px] font-bold">Staff Login</span>
          </button>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
