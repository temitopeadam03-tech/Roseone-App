import React, { useEffect, useState } from 'react';
import { RoseOneSymbol } from './RoseOneLogo';
import { useApp } from '../../context/AppContext';

interface SplashScreenProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 800,
}) => {
  const { isSplashScreenActive, setIsSplashScreenActive } = useApp();
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isSplashScreenActive) {
      setIsFadingOut(false);
      return;
    }

    setIsFadingOut(false);

    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const finishTimer = setTimeout(() => {
        setIsSplashScreenActive(false);
        if (onComplete) onComplete();
      }, prefersReducedMotion ? 50 : 350);
      return () => clearTimeout(finishTimer);
    }, prefersReducedMotion ? 150 : minDurationMs);

    return () => clearTimeout(timer);
  }, [isSplashScreenActive, minDurationMs, onComplete, setIsSplashScreenActive]);

  if (!isSplashScreenActive) return null;

  return (
    <div
      role="status"
      aria-label="Loading RoseOne"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9FB] dark:bg-[#0E0A12] transition-opacity duration-300 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle radial ambiance in background mapped to active theme */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transform -translate-y-6"
        style={{
          background: `radial-gradient(circle, var(--brand-accent-soft, rgba(233, 30, 140, 0.16)), transparent 70%)`,
        }}
      />

      {/* Brand presentation */}
      <div className="relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
        {/* RoseOne Symbol with pulse glow */}
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-full blur-xl animate-pulse"
            style={{ backgroundColor: 'var(--brand-accent-soft, rgba(233, 30, 140, 0.2))' }}
          />
          <div
            className="relative p-4 rounded-3xl bg-white dark:bg-[#18131F] shadow-xl border"
            style={{ borderColor: 'var(--brand-accent-soft, rgba(233, 30, 140, 0.3))' }}
          >
            <RoseOneSymbol size={80} animated={false} glow={true} />
          </div>
        </div>

        {/* Brand Wordmark */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
          Rose
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(90deg, var(--brand-accent, #E91E8C), var(--brand-accent-dark, #BE185D))',
            }}
          >
            One
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-400 mb-8">
          Everything, Connected.
        </p>

        {/* Subtle, refined loading bar */}
        <div className="w-44 h-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden relative">
          <div
            className="h-full rounded-full w-full animate-[shimmer_1.2s_infinite_linear]"
            style={{
              background:
                'linear-gradient(90deg, var(--brand-accent, #E91E8C), var(--brand-accent-light, #FDA4AF))',
            }}
          />
        </div>
      </div>

      {/* Footer subtle attribution */}
      <div className="absolute bottom-6 text-[11px] font-medium text-slate-400 dark:text-slate-400 tracking-wide">
        RoseOne Ecosystem
      </div>
    </div>
  );
};
