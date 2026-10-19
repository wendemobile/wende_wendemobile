'use client';

import { useState, useMemo } from 'react';
import {
  LANDING_PRODUCTS,
  ProductItem,
  formatETB,
  generateWhatsAppLink,
} from '@/data/landing-products';
import { ProductDetailModal } from '@/components/landing/product-detail-modal';
import {
  Search,
  Smartphone,
  Headphones,
  Sparkles,
  Star,
  Check,
  MessageCircle,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCatalogProps {
  initialCategory?: 'all' | 'smartphones' | 'headsets';
}

export function ProductCatalog({ initialCategory = 'all' }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'smartphones' | 'headsets'>(
    initialCategory
  );
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);

  // Available brands
  const brands = ['all', 'Apple', 'Samsung', 'Sony', 'Google', 'Beats', 'Xiaomi'];

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return LANDING_PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      // Brand filter
      if (selectedBrand !== 'all' && product.brand !== selectedBrand) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(query);
        const matchBrand = product.brand.toLowerCase().includes(query);
        const matchTagline = product.tagline.toLowerCase().includes(query);
        const matchSpecs = product.specs.some(
          (s) => s.label.toLowerCase().includes(query) || s.value.toLowerCase().includes(query)
        );
        return matchName || matchBrand || matchTagline || matchSpecs;
      }
      return true;
    });
  }, [selectedCategory, selectedBrand, searchQuery]);

  const smartphoneCount = LANDING_PRODUCTS.filter((p) => p.category === 'smartphones').length;
  const headsetCount = LANDING_PRODUCTS.filter((p) => p.category === 'headsets').length;

  return (
    <section id="catalog" className="py-10 sm:py-16 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Original Showroom Inventory
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Smartphones & Premium AirPods / Audio
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground">
            Explore authentic flagship smartphones and audiophile noise-cancelling headsets with verified warranties in Butajira.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-secondary/80 border border-border backdrop-blur-md shadow-sm max-w-full overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'gradient-primary text-white shadow-sm glow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Products
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {LANDING_PRODUCTS.length}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('smartphones')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === 'smartphones'
                    ? 'gradient-primary text-white shadow-sm glow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                Smartphones
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {smartphoneCount}
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory('headsets')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === 'headsets'
                    ? 'gradient-primary text-white shadow-sm glow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Headphones className="h-4 w-4" />
                AirPods & Headsets
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {headsetCount}
                </span>
              </button>
            </div>
          </div>

          {/* Search Input & Brand Filter Chips */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search iPhone 16, AirPods Max, S24, Sony..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-secondary/80 border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Brand Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
              <span className="text-xs text-muted-foreground mr-1 hidden lg:inline-flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" />
                Brand:
              </span>
              {brands.map((brand) => {
                const isSelected = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {brand === 'all' ? 'All Brands' : brand}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground">{filteredProducts.length}</strong> items
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <span className="text-emerald-500 font-medium flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> All Items In Stock in Butajira
          </span>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-card/40 rounded-3xl border border-dashed border-border/80 p-8 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No matching products found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We couldn’t find any models matching your search. Try adjusting keywords or clearing filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedBrand('all');
                setSelectedCategory('all');
              }}
              className="rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => {
              const whatsappLink = generateWhatsAppLink(product.name, product.priceETB);
              return (
                <div
                  key={product.id}
                  className="group relative rounded-2xl sm:rounded-3xl bg-card/80 border border-border/70 hover:border-primary/40 backdrop-blur-xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                >
                  {/* Top Badges */}
                  <div className="p-2 sm:p-3 pb-0 flex items-center justify-between z-10">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-foreground/80 border border-border/60">
                      {product.brand}
                    </span>
                    {product.badge && (
                      <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-500 border border-amber-500/20">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Product Image */}
                  <div
                    onClick={() => setActiveProduct(product)}
                    className="relative aspect-square mx-2 sm:mx-3 my-2 rounded-xl sm:rounded-2xl overflow-hidden bg-secondary/40 cursor-pointer flex items-center justify-center"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Quick view hover icon */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-xl bg-card/90 text-foreground backdrop-blur-md text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <Eye className="h-3.5 w-3.5" />
                        Quick View
                      </span>
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="p-2.5 sm:p-4 pt-1 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      {/* Rating */}
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-[11px] font-semibold text-foreground">
                          {product.rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({product.reviewsCount})
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setActiveProduct(product)}
                        className="text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      {/* Tagline / specs snippet */}
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {product.specs[0]?.value || product.tagline}
                      </p>

                      {/* Color Preview Dots */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {product.colors.slice(0, 4).map((c, i) => (
                            <span
                              key={i}
                              className="h-2.5 w-2.5 rounded-full border border-border/80 shadow-xs"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                          {product.colors.length > 4 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{product.colors.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-medium">
                            Price
                          </span>
                          <span className="text-xs sm:text-base font-extrabold text-primary whitespace-nowrap">
                            {formatETB(product.priceETB)}
                          </span>
                        </div>
                        {product.originalPriceETB && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                            {formatETB(product.originalPriceETB)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveProduct(product)}
                          className="w-full text-[10px] sm:text-xs rounded-xl h-8 sm:h-9 font-medium"
                        >
                          Specs
                        </Button>

                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] sm:text-xs font-bold h-8 sm:h-9 transition-colors shadow-xs"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Order
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={activeProduct}
        isOpen={Boolean(activeProduct)}
        onClose={() => setActiveProduct(null)}
      />
    </section>
  );
}
