'use client';

import { Sparkles, ShieldCheck, Zap, Truck, MessageCircle, ArrowRight, Smartphone, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_CONTACT } from '@/data/landing-products';

interface HeroProps {
  onExplorePhones: () => void;
  onExploreHeadsets: () => void;
}

export function Hero({ onExplorePhones, onExploreHeadsets }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-12 -left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-[90px] pointer-events-none -z-10" />
      <div className="absolute top-36 -right-20 w-72 h-72 bg-purple-500/15 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Top Location & Quality Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-primary/20 backdrop-blur-md shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-foreground">
              Wende Mobile Butajira
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-primary font-medium">Original Tech & Audio</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
            Experience The Next Level of{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Smartphones & Audio
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed px-2">
            Discover the latest Apple iPhone 16 Pro, Samsung Galaxy S24 Ultra, and genuine AirPods Max / premium noise-cancelling headsets right here in <strong>Butajira, Ethiopia</strong>. Complete with official warranty and expert support.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={onExplorePhones}
              size="lg"
              className="w-full sm:w-auto gradient-primary text-white rounded-2xl py-6 px-7 font-bold text-sm sm:text-base glow-primary flex items-center justify-center gap-2 touch-btn active:scale-95 transition-transform"
            >
              <Smartphone className="h-5 w-5" />
              Explore Smartphones
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>

            <Button
              onClick={onExploreHeadsets}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-2xl py-6 px-7 font-bold text-sm sm:text-base bg-secondary/60 hover:bg-secondary border-border flex items-center justify-center gap-2 touch-btn active:scale-95 transition-transform"
            >
              <Headphones className="h-5 w-5 text-purple-400" />
              AirPods & Headsets
            </Button>

            <a
              href={`https://wa.me/${STORE_CONTACT.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-sm transition-all active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              Order on WhatsApp
            </a>
          </div>

          {/* Trust Value Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-6 sm:pt-8 text-left">
            <div className="p-3 sm:p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">100% Original</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Apple & Samsung certified</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">In-Store Warranty</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Local Butajira support</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">Same-Day Pickup</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Fast Butajira delivery</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">Best Local Price</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Fair ETB rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
