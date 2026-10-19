'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { generateUUID } from '@/lib/utils';

export interface CartItem {
  id: string;
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  costPrice: number;
  lineTotal: number;
  locationId: string;
  locationName: string;
  imageUrl?: string;
}

interface AddToCartItem {
  itemId: string;
  name: string;
  sku: string;
  qty?: number;
  unitPrice: number;
  costPrice: number;
  locationId: string;
  locationName: string;
  imageUrl?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: AddToCartItem) => void;
  updateQty: (id: string, delta: number) => void;
  setQty: (id: string, qty: number) => void;
  updatePrice: (id: string, newPrice: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'pos-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Failed to save cart to storage:', error);
      }
    }
  }, [cart, isHydrated]);


  const addToCart = useCallback((item: AddToCartItem) => {
    setCart((prev) => {
      // Check if same item from same location exists
      const existing = prev.find(
        (c) => c.itemId === item.itemId && c.locationId === item.locationId
      );
      
      if (existing) {
        const newQty = existing.qty + (item.qty || 1);
        return prev.map((c) =>
          c.id === existing.id
            ? { ...c, qty: newQty, lineTotal: newQty * c.unitPrice }
            : c
        );
      }
      
      const qty = item.qty || 1;
      return [
        ...prev,
        {
          id: generateUUID(),
          itemId: item.itemId,
          name: item.name,
          sku: item.sku,
          qty,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          lineTotal: qty * item.unitPrice,
          locationId: item.locationId,
          locationName: item.locationName,
          imageUrl: item.imageUrl,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c;
          // Round to 2 decimal places for meter-based items
          const newQty = Math.max(0, Math.round((c.qty + delta) * 100) / 100);
          return { ...c, qty: newQty, lineTotal: Math.round(newQty * c.unitPrice * 100) / 100 };
        })
        .filter((c) => c.qty > 0)
    );
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c;
          // Allow decimal quantities (e.g., 5.60 meters), round to 2 decimal places
          const newQty = Math.max(0, Math.round(qty * 100) / 100);
          return { ...c, qty: newQty, lineTotal: Math.round(newQty * c.unitPrice * 100) / 100 };
        })
        .filter((c) => c.qty > 0)
    );
  }, []);

  const updatePrice = useCallback((id: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setCart((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unitPrice: validPrice, lineTotal: validPrice * c.qty }
          : c
      )
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQty,
        setQty,
        updatePrice,
        removeFromCart,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
