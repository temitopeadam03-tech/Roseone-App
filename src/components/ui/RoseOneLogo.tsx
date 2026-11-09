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

const brandPink = '#F20A83';
const brandMagenta = '#A90058';

export const RoseOneSymbol: React.FC<{
  size?: number | string;
  monochrome?: boolean;
  monochromeColor?: 'white' | 'black' | 'rose' | 'current';
  className?: string;
  animated?: boolean;
  glow?: boolean;
}> = ({ size = 32, monochrome = false, monochromeColor = 'current', className = '', animated = false }) => {
  const primary = monochrome
    ? monochromeColor === 'white' ? '#FFFFFF'
      : monochromeColor === 'black' ? '#17131A'
      : monochromeColor === 'current' ? 'currentColor' : 'var(--brand-accent, #F20A83)'
    : brandPink;
  const secondary = monochrome
    ? monochromeColor === 'white' ? '#FFFFFF'
      : monochromeColor === 'black' ? '#17131A'
      : monochromeColor === 'current' ? 'currentColor' : 'var(--brand-accent-dark, #A90058)'
    : brandMagenta;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${animated ? 'transition-transform duration-300 group-hover:scale-105' : ''} ${className}`}
      role="img"
      aria-label="GistUpp logo symbol"
    >
      <path
        d="M91.2 22.8A46 46 0 1 0 100 67.5H80.5A27.8 27.8 0 1 1 76.2 38.8L91.2 22.8Z"
        fill={primary}
        fillRule="evenodd"
      />
      <path
        d="M26.8 86.8C45.7 84.6 69.4 76.4 91.5 59.9L105 43.5L104.1 66.7L87.3 58.8C68.1 75.5 45.6 87.8 24.1 92.2C10.8 95 3.4 90.7 4.2 82.5C4.8 76.7 10.1 69.7 17.3 63.4C12.1 71.7 11.1 78.3 14.4 82.1C17 85.1 21.2 87.1 26.8 86.8Z"
        fill={primary}
      />
      <path
        d="M25.5 31.2A45.8 45.8 0 0 0 17.1 62.7L32.2 61.8A29.2 29.2 0 0 1 48.1 28.4L25.5 31.2Z"
        fill={secondary}
      />
      <path
        d="M45.2 74.2A28.8 28.8 0 0 0 75.8 87.1L81.2 72.8A28.7 28.7 0 0 1 62.1 77.5L45.2 74.2Z"
        fill={secondary}
      />
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
  const monochrome = variant === 'monochrome' || Boolean(monochromeColor);
  const color = monochromeColor === 'white' ? 'text-white'
    : monochromeColor === 'black' ? 'text-[#17131A]'
    : monochromeColor === 'current' ? 'text-current' : 'text-[#F20A83]';
  const sizes = {
    xs: { icon: 20, text: 'text-sm', gap: 'gap-1.5' },
    sm: { icon: 26, text: 'text-base', gap: 'gap-2' },
    md: { icon: 34, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 42, text: 'text-2xl', gap: 'gap-3' },
    xl: { icon: 58, text: 'text-3xl', gap: 'gap-3.5' },
    '2xl': { icon: 78, text: 'text-4xl', gap: 'gap-4' },
  } as const;
  const s = sizes[size] || sizes.md;
  const wordmark = (
    <span className={`whitespace-nowrap font-extrabold tracking-[-0.055em] leading-none ${s.text} ${monochrome ? color : 'text-[#A90058]'} ${textClassName}`}>
      Gist<span className={monochrome ? color : 'text-[#F20A83]'}>Upp</span>
    </span>
  );

  if (variant === 'symbol') {
    return <span className={`inline-flex items-center justify-center ${className}`}><RoseOneSymbol size={s.icon} monochrome={monochrome} monochromeColor={monochromeColor} className={symbolClassName} animated={animated} /></span>;
  }

  if (variant === 'primary') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${s.gap} ${className}`}>
        <RoseOneSymbol size={s.icon * 2.15} monochrome={monochrome} monochromeColor={monochromeColor} className={symbolClassName} animated={animated} />
        {wordmark}
        {showTagline && <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">Your world. Your people.</span>}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${s.gap} group select-none ${className}`}>
      <RoseOneSymbol size={s.icon} monochrome={monochrome} monochromeColor={monochromeColor} className={symbolClassName} animated={animated} />
      <span className="flex flex-col items-start gap-1">
        {wordmark}
        {showTagline && <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-slate-500 dark:text-slate-400">Your world. Your people.</span>}
      </span>
    </div>
  );
};
