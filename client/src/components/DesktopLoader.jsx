import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function DesktopLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show smooth intro loading animation on desktop
    const timer1 = setTimeout(() => setFading(true), 450);
    const timer2 = setTimeout(() => setVisible(false), 850);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-[#F7F3EE] transition-opacity duration-400 ease-out select-none ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in-scale">
        <div className="w-16 h-16 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shadow-xl border border-[#4A4540]">
          <Icon icon="solar:scissors-bold" className="w-8 h-8 text-[#C2B4A3] -rotate-45" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-base font-black tracking-widest uppercase text-[#1C1A18]">
            Élan Atelier
          </h2>
          <p className="text-[11px] text-[#4A4540] font-semibold tracking-wider">
            Smart Queue System
          </p>
        </div>

        {/* Minimalist Animated Progress Bar */}
        <div className="w-36 h-1 bg-[#E4DBD0] rounded-full overflow-hidden mt-2">
          <div className="h-full bg-[#1C1A18] rounded-full animate-loader-slide" />
        </div>
      </div>
    </div>
  );
}
