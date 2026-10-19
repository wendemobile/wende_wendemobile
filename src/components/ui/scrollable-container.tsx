'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  showIndicators?: boolean;
  maxHeight?: string;
}

export function ScrollableContainer({
  children,
  className,
  showIndicators = true,
  maxHeight,
}: ScrollableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const hasOverflow = scrollHeight > clientHeight;
    
    setCanScrollUp(hasOverflow && scrollTop > 5);
    setCanScrollDown(hasOverflow && scrollTop < scrollHeight - clientHeight - 5);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial check
    checkScroll();

    // Listen for scroll events
    container.addEventListener('scroll', checkScroll, { passive: true });

    // Listen for resize events
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    // Also observe content changes
    const mutationObserver = new MutationObserver(checkScroll);
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      container.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [checkScroll]);

  return (
    <div className="relative flex-1 min-h-0">
      {/* Top scroll indicator */}
      {showIndicators && canScrollUp && (
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <div className="h-8 bg-gradient-to-b from-card to-transparent" />
          <div className="absolute top-1 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className={cn(
          'overflow-y-auto touch-scroll h-full',
          className
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>

      {/* Bottom scroll indicator */}
      {showIndicators && canScrollDown && (
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
          <div className="h-8 bg-gradient-to-t from-card to-transparent" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
          </div>
        </div>
      )}
    </div>
  );
}
