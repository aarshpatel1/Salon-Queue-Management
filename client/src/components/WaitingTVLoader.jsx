import React from 'react';
import { Icon } from '@iconify/react';

export default function WaitingTVLoader() {
  return (
    <div className="h-full bg-[#1C1A18] text-[#F7F3EE] p-6 md:p-10 flex flex-col justify-between select-none overflow-hidden animate-fade-in-scale">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-2 shrink-0 border-b border-[#4A4540]/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#262320] border border-[#4A4540] flex items-center justify-center shadow-lg relative overflow-hidden">
            <Icon icon="solar:scissors-bold" className="w-8 h-8 text-[#C2B4A3] -rotate-45 animate-pulse" />
            <div className="absolute inset-0 bg-[#C2B4A3]/10 animate-ping rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-wider text-[#F7F3EE] uppercase">
                Élan Atelier
              </h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C2B4A3] bg-[#262320] px-3 py-0.5 rounded-full border border-[#4A4540]">
                5-Meter TV Mode
              </span>
            </div>
            <p className="text-xs tracking-widest text-[#C2B4A3] uppercase font-bold flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#C2B4A3] animate-ping" />
              Synchronizing Live Lounge Queue & Stylist Stations...
            </p>
          </div>
        </div>

        {/* Live Broadcast Pill */}
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 rounded-full bg-[#262320] border border-[#4A4540] flex items-center gap-2.5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-[#F7F3EE] tracking-wide">Connecting Live Stream</span>
          </div>
          <div className="h-10 w-28 rounded-full luxury-shimmer-dark border border-[#4A4540]/50" />
        </div>
      </div>

      {/* Main Content Grid: Stylist Stations (Left) & Upcoming Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto overflow-hidden">
        {/* Left: Stylist Stations Skeleton */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-[#C2B4A3]">
              <Icon icon="solar:armchair-bold" className="w-5 h-5 text-[#C2B4A3]" />
              <span>Stylist Stations (Live)</span>
            </div>
            <div className="h-4 w-24 rounded-full luxury-shimmer-dark" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#262320]/80 rounded-[32px] p-5 border border-[#4A4540] flex flex-col justify-between min-h-[160px] shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full luxury-shimmer-dark border border-[#4A4540]" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 rounded-full luxury-shimmer-dark" />
                      <div className="h-3 w-16 rounded-full luxury-shimmer-dark" />
                    </div>
                  </div>
                  <div className="h-6 w-16 rounded-full luxury-shimmer-dark border border-[#4A4540]" />
                </div>

                <div className="mt-4 p-3 rounded-[20px] bg-[#1C1A18]/80 border border-[#4A4540]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded-full luxury-shimmer-dark" />
                    <div className="h-3 w-12 rounded-full luxury-shimmer-dark" />
                  </div>
                  <div className="h-4 w-3/4 rounded-full luxury-shimmer-dark" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Up Next In Lounge Table Skeleton */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-[#C2B4A3]">
              <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-[#C2B4A3]" />
              <span>Up Next in Lounge (Queue)</span>
            </div>
            <div className="h-4 w-16 rounded-full luxury-shimmer-dark" />
          </div>

          <div className="bg-[#262320]/80 rounded-[36px] p-5 border border-[#4A4540] shadow-lg space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3 rounded-full bg-[#1C1A18]/90 border border-[#4A4540]/60 flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full luxury-shimmer-dark shrink-0 flex items-center justify-center text-[11px] font-black" />
                  <div className="w-8 h-8 rounded-full luxury-shimmer-dark shrink-0" />
                  <div className="space-y-1 min-w-0">
                    <div className="h-3.5 w-32 rounded-full luxury-shimmer-dark" />
                    <div className="h-2.5 w-20 rounded-full luxury-shimmer-dark" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-5 w-16 rounded-full luxury-shimmer-dark" />
                  <div className="h-5 w-12 rounded-full luxury-shimmer-dark" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Timeline & Animated Luxury Progress */}
      <div className="pt-4 border-t border-[#4A4540]/40 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-xs text-[#C2B4A3] font-bold">
          <span className="flex items-center gap-2">
            <Icon icon="solar:shield-check-bold" className="w-4 h-4 text-emerald-400" />
            Élan Atelier Real-Time Cloud Engine Active
          </span>
          <span>Syncing Live Display...</span>
        </div>
        <div className="w-full h-1.5 bg-[#262320] rounded-full overflow-hidden border border-[#4A4540]/30">
          <div className="h-full bg-[#C2B4A3] rounded-full animate-loader-slide" />
        </div>
      </div>
    </div>
  );
}
