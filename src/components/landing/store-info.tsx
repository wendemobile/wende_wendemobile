'use client';

import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Send,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Headphones,
} from 'lucide-react';
import { STORE_CONTACT } from '@/data/landing-products';

export function StoreInfo() {
  return (
    <section id="store-info" className="py-12 sm:py-18 bg-secondary/30 border-y border-border/60 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin className="h-3.5 w-3.5" />
            Local Showroom & Support
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Visit Us in Butajira
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground">
            Experience devices hands-on before you buy. Located in the heart of Butajira commercial district.
          </p>
        </div>

        {/* 2-Column Info & Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Store Location & Operating Hours */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-lg space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {STORE_CONTACT.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {STORE_CONTACT.city}
                  </p>
                </div>
              </div>

              {/* Address Box */}
              <div className="p-4 rounded-2xl bg-secondary/60 border border-border/60 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Physical Address:</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {STORE_CONTACT.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-border/40">
                  <Clock className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">Working Hours:</span>
                    <p className="text-xs text-muted-foreground">{STORE_CONTACT.hoursWeekday}</p>
                    <p className="text-xs text-muted-foreground">{STORE_CONTACT.hoursSunday}</p>
                  </div>
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Showroom Services:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {STORE_CONTACT.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="pt-4 border-t border-border/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                Accepted Payment Methods in Butajira:
              </span>
              <div className="flex flex-wrap gap-2">
                {STORE_CONTACT.paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="px-2.5 py-1 rounded-xl text-xs font-medium bg-secondary text-foreground/90 border border-border/80"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Instant Contact & Inquiry */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-lg space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    Connect With Our Team
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Instant response for orders, price checks & reservations
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${STORE_CONTACT.whatsappNumber}?text=${encodeURIComponent(
                    'Hello Wende Mobile Butajira, I would like to inquire about smartphones and AirPods in stock.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                        WhatsApp Customer Service
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Chat directly with our Butajira sales reps
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold underline hidden sm:inline">Message Now →</span>
                </a>

                {/* Direct Call 1 */}
                <a
                  href={`tel:${STORE_CONTACT.phone}`}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border text-foreground transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        Direct Sales Line
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {STORE_CONTACT.displayPhone}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary underline hidden sm:inline">Call →</span>
                </a>

                {/* Telegram */}
                <a
                  href={STORE_CONTACT.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-sky-400 transition-colors">
                        Telegram Channel
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Daily arrivals & exclusive flash deals
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold underline hidden sm:inline">Join Channel →</span>
                </a>
              </div>
            </div>

            {/* In-store badge guarantee */}
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-xs text-foreground/90">
                All devices can be unboxed and verified on-site at our Butajira shop before payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
