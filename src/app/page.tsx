import { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ProductCatalog } from '@/components/landing/product-catalog';
import { StoreInfo } from '@/components/landing/store-info';
import { Footer } from '@/components/landing/footer';
import { LandingClientWrapper } from '@/components/landing/landing-client-wrapper';

export const metadata: Metadata = {
  title: 'Wende Mobile Butajira | Flagship Smartphones & AirPods / Audio',
  description:
    'Butajira’s premier showroom for original Apple iPhone 16 Pro Max, Samsung Galaxy S24 Ultra, AirPods Max, and high-fidelity headsets. In-store warranty and same-day delivery.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <LandingClientWrapper />
    </div>
  );
}
