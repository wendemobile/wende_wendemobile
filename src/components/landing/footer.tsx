'use client';

import Link from 'next/link';
import { Smartphone, Headphones, MapPin, Lock, Heart } from 'lucide-react';
import { STORE_CONTACT } from '@/data/landing-products';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/80 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                Wende Mobile Butajira
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              Butajira’s premier hub for authentic Apple, Samsung, and Sony flagship smartphones, AirPods Max, and high-fidelity headsets. Complete with official warranty and dedicated local service.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Commercial Center, Butajira, Ethiopia</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Showroom Catalog
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#catalog" className="hover:text-foreground transition-colors">
                  Flagship Smartphones
                </a>
              </li>
              <li>
                <a href="#catalog" className="hover:text-foreground transition-colors">
                  AirPods Max & Earbuds
                </a>
              </li>
              <li>
                <a href="#store-info" className="hover:text-foreground transition-colors">
                  Store Hours & Location
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${STORE_CONTACT.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>

          {/* Staff Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Store Operations
            </h4>
            <p className="text-xs text-muted-foreground">
              Point of Sale, inventory transfers, and daily session closing for store cashiers and management.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors"
            >
              <Lock className="h-3.5 w-3.5 text-primary" />
              Staff Login Portal
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Wende Mobile Butajira. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with excellence for Butajira, Ethiopia
          </p>
        </div>
      </div>
    </footer>
  );
}
