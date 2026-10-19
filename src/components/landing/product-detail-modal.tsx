'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ProductItem,
  formatETB,
  generateWhatsAppLink,
  STORE_CONTACT,
} from '@/data/landing-products';
import {
  Star,
  Check,
  ShieldCheck,
  MessageCircle,
  Phone,
  Sparkles,
  MapPin,
  X,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedStorage, setSelectedStorage] = useState<string>('');

  if (!product) return null;

  const activeColor = selectedColor || product.colors[0]?.name || '';
  const activeStorage = selectedStorage || product.storageOptions?.[0] || '';
  const variantText = [activeColor, activeStorage].filter(Boolean).join(' • ');

  const whatsappUrl = generateWhatsAppLink(product.name, product.priceETB, variantText);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4 sm:p-6 rounded-2xl touch-scroll">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {product.brand}
            </span>
            {product.badge && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {product.badge}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          {/* Image & Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/50 border border-border/60 group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Original Guarantee
                </span>
              </div>
            </div>

            {/* Quick trust banner */}
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Available in-store at Butajira Main Commercial Street</span>
            </div>
          </div>

          {/* Details & Specs */}
          <div className="space-y-4">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground">
                {product.name}
              </DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {product.tagline}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({product.reviewsCount} customer reviews)
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border border-primary/20">
              <span className="text-xs text-muted-foreground block font-medium">
                Wende Mobile Special Price:
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-primary">
                  {formatETB(product.priceETB)}
                </span>
                {product.originalPriceETB && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatETB(product.originalPriceETB)}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                <Check className="h-3 w-3" /> In Stock for instant pickup / delivery in Butajira
              </span>
            </div>

            {/* Color Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Color Option:</span>
                  <span className="text-muted-foreground font-normal">{activeColor}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const isSelected = activeColor === color.name;
                    return (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/15 text-foreground shadow-sm'
                            : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-white/20"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage Options */}
            {product.storageOptions && product.storageOptions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Storage Capacity:</span>
                  <span className="text-muted-foreground font-normal">{activeStorage}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.storageOptions.map((opt) => {
                    const isSelected = activeStorage === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelectedStorage(opt)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-border bg-secondary/50 text-foreground hover:bg-secondary'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Specs Table */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-xs font-semibold text-foreground block">
                Technical Highlights:
              </span>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {product.specs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-1 px-2 rounded-lg bg-secondary/30 text-muted-foreground"
                  >
                    <span className="font-medium text-foreground/80">{spec.label}:</span>
                    <span className="text-right text-foreground font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all touch-btn active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Order via WhatsApp Now
              </a>

              <a
                href={`tel:${STORE_CONTACT.phone}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                Call Store: {STORE_CONTACT.displayPhone}
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
