import React from 'react';

export interface RoseOneLogoProps {
  variant?: 'primary' | 'symbol' | 'horizontal' | 'compact' | 'monochrome';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  monochromeColor?: 'white' | 'black' | 'rose' | 'current';
  showTagline?: boolean;
  className?: string;
  symbolClassName?: string;
  textClassName?: string;
  animated?: boolean;
}

export const RoseOneSymbol: React.FC<{
  size?: number | string;
  monochrome?: boolean;
  monochromeColor?: 'white' | 'black' | 'rose' | 'current';
  className?: string;
  animated?: boolean;
  glow?: boolean;
}> = ({
  size = 32,
  monochrome = false,
  monochromeColor = 'current',
  className = '',
  animated = false,
  glow = true,
}) => {
  const uniqueId = React.useId().replace(/:/g, '');

  // Fill colors based on mode
  let primaryFill = `url(#roseGradPrimary_${uniqueId})`;
  let secondaryFill = `url(#roseGradDark_${uniqueId})`;
  let highlightFill = `url(#roseGradLight_${uniqueId})`;
  let spineFill = '#FFFFFF';
  let dotFill = '#FDA4AF';

  if (monochrome) {
    if (monochromeColor === 'white') {
      primaryFill = '#FFFFFF';
      secondaryFill = '#E2E8F0';
      highlightFill = '#CBD5E1';
      spineFill = '#0F172A';
      dotFill = '#0F172A';
    } else if (monochromeColor === 'black') {
      primaryFill = '#0F172A';
      secondaryFill = '#334155';
      highlightFill = '#475569';
      spineFill = '#FFFFFF';
      dotFill = '#FFFFFF';
    } else if (monochromeColor === 'rose') {
      primaryFill = 'var(--brand-accent, #E91E8C)';
      secondaryFill = 'var(--brand-accent-dark, #BE185D)';
      highlightFill = 'var(--brand-accent-light, #FB7185)';
      spineFill = '#FFFFFF';
      dotFill = 'var(--brand-accent-pastel, #FFF1F2)';
    } else {
      primaryFill = 'currentColor';
      secondaryFill = 'currentColor';
      highlightFill = 'currentColor';
      spineFill = '#000000';
      dotFill = '#000000';
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${animated ? 'transition-transform duration-300 group-hover:scale-105' : ''} ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Core Vibrant Accent Gradient */}
        <linearGradient
          id={`roseGradPrimary_${uniqueId}`}
          x1="10"
          y1="90"
          x2="90"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--brand-accent-dark, #BE185D)" />
          <stop offset="50%" stopColor="var(--brand-accent, #E91E8C)" />
          <stop offset="100%" stopColor="var(--brand-accent-light, #FB7185)" />
        </linearGradient>

        {/* Deeper Shadow Petal Gradient */}
        <linearGradient
          id={`roseGradDark_${uniqueId}`}
          x1="15"
          y1="15"
          x2="85"
          y2="85"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--brand-accent-darker, #9D174D)" />
          <stop offset="60%" stopColor="var(--brand-accent-dark, #BE185D)" />
          <stop offset="100%" stopColor="var(--brand-accent, #DB2777)" />
        </linearGradient>

        {/* Delicate Inner Highlight Petal Gradient */}
        <linearGradient
          id={`roseGradLight_${uniqueId}`}
          x1="30"
          y1="20"
          x2="70"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="var(--brand-accent-pastel, #FECDD3)" />
          <stop offset="100%" stopColor="var(--brand-accent-light, #F43F5E)" />
        </linearGradient>

        {/* Soft Radial Ambient Glow */}
        {glow && (
          <filter id={`ambientGlow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {/* Decorative subtle ambient backdrop glow when glowing */}
      {glow && !monochrome && (
        <circle cx="50" cy="50" r="38" fill="var(--brand-accent, #E91E8C)" opacity="0.18" filter={`url(#ambientGlow_${uniqueId})`} />
      )}

      {/* GistUpp brand mark: a bold conversation glyph wrapped by an open orbit. */}
      <circle cx="50" cy="50" r="39" stroke={primaryFill} strokeWidth="7" strokeLinecap="round" strokeDasharray="196 52" transform="rotate(-38 50 50)" />
      <path d="M67 34c-4-5-10-8-18-8-15 0-26 11-26 25s11 25 26 25c7 0 13-2 18-7" stroke={secondaryFill} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M62 43H48c-5 0-8 3-8 7s3 7 8 7h8" stroke={highlightFill} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M58 57l9 10" stroke={primaryFill} strokeWidth="7" strokeLinecap="round" />
      <circle cx="76" cy="22" r="5" fill={dotFill} />
    </svg>
  );
};

export const RoseOneLogo: React.FC<RoseOneLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  monochromeColor,
  showTagline = false,
  className = '',
  symbolClassName = '',
  textClassName = '',
  animated = true,
}) => {
  const isMonochrome = variant === 'monochrome' || Boolean(monochromeColor);

  // Dimension mapping
  const sizeMap = {
    xs: { symbol: 18, text: 'text-sm', badge: 'text-[9px]', gap: 'gap-1.5' },
    sm: { symbol: 24, text: 'text-base', badge: 'text-[10px]', gap: 'gap-2' },
    md: { symbol: 30, text: 'text-xl', badge: 'text-[11px]', gap: 'gap-2.5' },
    lg: { symbol: 40, text: 'text-2xl', badge: 'text-xs', gap: 'gap-3' },
    xl: { symbol: 56, text: 'text-3xl', badge: 'text-sm', gap: 'gap-3.5' },
    '2xl': { symbol: 76, text: 'text-4xl', badge: 'text-base', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Render symbol only
  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <RoseOneSymbol
          size={currentSize.symbol}
          monochrome={isMonochrome}
          monochromeColor={monochromeColor}
          className={symbolClassName}
          animated={animated}
        />
      </div>
    );
  }

  // Render compact variant (e.g. mobile header)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
        <RoseOneSymbol
          size={currentSize.symbol}
          monochrome={isMonochrome}
          monochromeColor={monochromeColor}
          className={symbolClassName}
          animated={animated}
        />
        <div className="flex flex-col leading-none">
          <span
            className={`font-black tracking-tight text-slate-900 dark:text-white ${currentSize.text} ${textClassName}`}
          >
            Gist<span className="text-[#E91E8C]">Upp</span>
          </span>
        </div>
      </div>
    );
  }

  // Render primary variant (e.g., stacked or hero presentation)
  if (variant === 'primary') {
    return (
      <div className={`flex flex-col items-center text-center ${currentSize.gap} ${className}`}>
        <div className="relative p-2 rounded-2xl bg-gradient-to-b from-[#FFF1F2]/80 to-transparent dark:from-[#BE185D]/15">
          <RoseOneSymbol
            size={currentSize.symbol}
            monochrome={isMonochrome}
            monochromeColor={monochromeColor}
            className={symbolClassName}
            animated={animated}
          />
        </div>
        <div className="flex flex-col items-center leading-none">
          <span
            className={`font-black tracking-tight text-slate-900 dark:text-white ${currentSize.text} ${textClassName}`}
          >
            Gist<span className="bg-gradient-to-r from-[#E91E8C] to-[#BE185D] bg-clip-text text-transparent">upp</span>
          </span>
          {showTagline && (
            <span className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
              Everything, Connected.
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: Horizontal variant (Headers, Desktop sidebars, Nav bars)
  return (
    <div className={`inline-flex items-center ${currentSize.gap} group select-none ${className}`}>
      <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
        <RoseOneSymbol
          size={currentSize.symbol}
          monochrome={isMonochrome}
          monochromeColor={monochromeColor}
          className={symbolClassName}
          animated={animated}
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className={`whitespace-nowrap min-w-max font-extrabold tracking-tight text-slate-900 dark:text-white ${currentSize.text} ${textClassName}`}
        >
          Gist<span className="bg-gradient-to-r from-[#E91E8C] to-[#BE185D] bg-clip-text text-transparent">upp</span>
        </span>
        {showTagline && (
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 -mt-0.5 uppercase">
            Everything, Connected.
          </span>
        )}
      </div>
    </div>
  );
};
