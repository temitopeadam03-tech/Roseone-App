import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const [time, setTime] = useState('10:24');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-5 pt-2 pb-1 text-xs select-none bg-white/95 dark:bg-[#17131A]/95 text-slate-800 dark:text-slate-200 border-b border-black/[0.04] dark:border-white/[0.04] backdrop-blur-md z-40 transition-colors">
      <span className="font-semibold tracking-tight tabular-nums text-[13px]">{time}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-[#E91E8C]">5G</span>
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium tabular-nums">96%</span>
          <BatteryMedium className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    </div>
  );
};

export const AndroidNavBar: React.FC = () => {
  return (
    <div className="h-6 flex items-center justify-center bg-white dark:bg-[#17131A] select-none border-t border-black/[0.04] dark:border-white/[0.04] shrink-0">
      <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
    </div>
  );
};
