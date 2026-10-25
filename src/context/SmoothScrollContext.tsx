import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

interface ScrollToOptions {
  offset?: number;
  duration?: number;
  immediate?: boolean;
  lock?: boolean;
  onComplete?: () => void;
}

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number, options?: ScrollToOptions) => void;
  stopScroll: () => void;
  startScroll: () => void;
  isReady: boolean;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
  stopScroll: () => {},
  startScroll: () => {},
  isReady: false,
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect user's accessibility motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize Lenis with tailored inertia & easing for rich festive feel
    const instance = new Lenis({
      duration: prefersReducedMotion ? 0.01 : 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
      smoothWheel: !prefersReducedMotion,
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
      infinite: false,
      autoResize: true,
    });

    lenisRef.current = instance;
    setLenis(instance);
    setIsReady(true);

    // Synchronize Lenis with GSAP ScrollTrigger
    instance.on('scroll', ScrollTrigger.update);

    const handleRaf = (time: number) => {
      instance.raf(time * 1000);
    };

    gsap.ticker.add(handleRaf);
    gsap.ticker.lagSmoothing(0);

    // Global accessibility helpers on window
    (window as any).__lenis = instance;
    (window as any).__smoothScrollTo = (target: string | HTMLElement | number, options?: ScrollToOptions) => {
      if (instance) {
        instance.scrollTo(target, {
          offset: options?.offset ?? -80,
          duration: options?.duration ?? 1.2,
          immediate: options?.immediate ?? false,
          onComplete: options?.onComplete,
        });
      } else {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el && 'scrollIntoView' in el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    return () => {
      instance.destroy();
      gsap.ticker.remove(handleRaf);
      lenisRef.current = null;
      setLenis(null);
      setIsReady(false);
      delete (window as any).__lenis;
      delete (window as any).__smoothScrollTo;
    };
  }, []);

  const scrollTo = (target: string | HTMLElement | number, options?: ScrollToOptions) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: options?.offset ?? -80,
        duration: options?.duration ?? 1.2,
        immediate: options?.immediate ?? false,
        lock: options?.lock ?? false,
        onComplete: options?.onComplete,
      });
    } else {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el && 'getBoundingClientRect' in el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset + (options?.offset ?? -80);
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }
    }
  };

  const stopScroll = () => {
    if (lenisRef.current) {
      lenisRef.current.stop();
    }
  };

  const startScroll = () => {
    if (lenisRef.current) {
      lenisRef.current.start();
    }
  };

  return (
    <SmoothScrollContext.Provider value={{ lenis, scrollTo, stopScroll, startScroll, isReady }}>
      {children}
    </SmoothScrollContext.Provider>
  );
};
