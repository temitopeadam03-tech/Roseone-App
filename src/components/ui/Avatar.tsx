import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs sm:text-sm',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 text-2xl font-bold',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-12 h-12',
  };

  // Get initials if name is provided
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src && src.trim().length > 0) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-[#FCE7F3] to-[#FCE7F3] dark:from-[#BE185D]/30 dark:to-[#E91E8C]/20 text-[#BE185D] dark:text-[#FCE7F3] border border-[#E91E8C]/20 flex items-center justify-center font-bold tracking-tight shrink-0 select-none ${className}`}
    >
      {initials ? initials : <UserIcon className={iconSizes[size]} />}
    </div>
  );
};
