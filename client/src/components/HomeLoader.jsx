import React from 'react';
import { Icon } from '@iconify/react';

export default function HomeLoader() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1 animate-fade-in-scale">
      {/* Top Floating Island Header Pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] p-5 md:p-6 rounded-[32px] border border-[#E4DBD0] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shadow-md relative overflow-hidden">
            <Icon icon="solar:scissors-bold" className="w-6 h-6 -rotate-45 text-[#C2B4A3] animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-5 w-36 md:w-48 rounded-full luxury-shimmer" />
            <div className="h-3 w-48 md:w-64 rounded-full luxury-shimmer" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-36 rounded-full luxury-shimmer border border-[#E4DBD0]" />
          <div className="h-10 w-32 rounded-full luxury-shimmer border border-[#E4DBD0]" />
        </div>
      </div>

      {/* Stylist Floor Section Skeleton */}
      <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Icon icon="solar:users-group-rounded-bold" className="w-5 h-5 text-[#1C1A18]" />
            <h2 className="text-base font-black text-[#1C1A18]">Stylist Station Floor</h2>
          </div>
          <div className="h-5 w-24 rounded-full luxury-shimmer" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-[28px] border border-[#E4DBD0] bg-[#F7F3EE]/40 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full luxury-shimmer border border-[#E4DBD0]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-20 rounded-full luxury-shimmer" />
                  <div className="h-3 w-14 rounded-full luxury-shimmer" />
                </div>
              </div>
              <div className="h-6 w-full rounded-full luxury-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Queue Table & Cards Skeleton */}
      <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-[#1C1A18]" />
            <h2 className="text-base font-black text-[#1C1A18]">Live Lounge Queue</h2>
          </div>
          <div className="h-6 w-20 rounded-full luxury-shimmer" />
        </div>

        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-full border border-[#E4DBD0] bg-[#FFFFFF] flex items-center justify-between px-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full luxury-shimmer shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded-full luxury-shimmer" />
                  <div className="h-2.5 w-24 rounded-full luxury-shimmer" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 rounded-full luxury-shimmer" />
                <div className="h-5 w-14 rounded-full luxury-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
