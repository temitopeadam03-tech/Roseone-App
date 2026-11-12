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

const iconSizes = { xs: 20, sm: 26, md: 34, lg: 42, xl: 58, '2xl': 78 } as const;

export const RoseOneSymbol: React.FC<{
  size?: number | string;
  monochrome?: boolean;
  monochromeColor?: 'white' | 'black' | 'rose' | 'current';
  className?: string;
  animated?: boolean;
  glow?: boolean;
}> = ({ size = 32, monochrome = false, monochromeColor = 'current', className = '', animated = false }) => {
  const filter = monochrome
    ? monochromeColor === 'white' ? 'brightness(0) invert(1)'
      : monochromeColor === 'black' ? 'brightness(0)'
      : monochromeColor === 'current' ? 'brightness(0) saturate(100%)'
      : 'none'
    : 'none';
  return (
    <img
      src="/gistupp-mark.svg?v=20261112-brand4"
      alt="GistUpp"
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 object-contain select-none ${animated ? 'transition-transform duration-300 group-hover:scale-105' : ''} ${className}`}
      style={{ filter }}
    />
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
  const iconSize = iconSizes[size] || iconSizes.md;
  const monochrome = variant === 'monochrome' || Boolean(monochromeColor);
  const imageStyle = monochrome && monochromeColor === 'white' ? { filter: 'brightness(0) invert(1)' }
    : monochrome && monochromeColor === 'black' ? { filter: 'brightness(0)' }
    : undefined;
  const tagline = showTagline ? <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-slate-500 dark:text-slate-400">Your world. Your people.</span> : null;

  if (variant === 'symbol') {
    return <RoseOneSymbol size={iconSize} monochrome={monochrome} monochromeColor={monochromeColor} className={symbolClassName} animated={animated} />;
  }

  if (variant === 'primary') {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <img src="/gistupp-logo.svg?v=20261112-brand4" alt="GistUpp" draggable={false} className={`w-56 sm:w-64 h-auto object-contain ${symbolClassName} ${textClassName}`} style={imageStyle} />
        {tagline}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <RoseOneSymbol size={iconSize} monochrome={monochrome} monochromeColor={monochromeColor} className={symbolClassName} animated={animated} />
      <span className="flex flex-col items-start gap-1">
        <img src="/gistupp-wordmark.svg?v=20261112-brand4" alt="GistUpp" draggable={false} className={`w-28 sm:w-32 h-auto object-contain ${textClassName}`} style={imageStyle} />
        {tagline}
      </span>
    </div>
  );
};
