import React from 'react';
import { Icon } from '@iconify/react';

export default function AdminLoader() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1 animate-fade-in-scale">
      {/* Top Header Capsule Bar */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-5 md:p-6 border border-[#E4DBD0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shrink-0 shadow-md relative overflow-hidden">
            <Icon icon="solar:settings-bold" className="w-6 h-6 text-[#C2B4A3] animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-5 w-48 rounded-full luxury-shimmer" />
            <div className="h-3 w-64 rounded-full luxury-shimmer" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-36 rounded-full luxury-shimmer border border-[#E4DBD0]" />
          <div className="h-10 w-28 rounded-full luxury-shimmer border border-[#E4DBD0]" />
        </div>
      </div>

      {/* Admin Parameters Card Skeleton */}
      <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="h-5 w-44 rounded-full luxury-shimmer" />
          <div className="h-5 w-20 rounded-full luxury-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-[24px] bg-[#F7F3EE]/50 border border-[#E4DBD0] space-y-2">
              <div className="h-3 w-20 rounded-full luxury-shimmer" />
              <div className="h-8 w-full rounded-full luxury-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Services Table & Stylists Table Side-by-Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Services Menu Table Skeleton */}
        <div className="bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="space-y-1">
              <div className="h-5 w-36 rounded-full luxury-shimmer" />
              <div className="h-3 w-48 rounded-full luxury-shimmer" />
            </div>
            <div className="h-9 w-28 rounded-full luxury-shimmer" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-full border border-[#E4DBD0] bg-[#FFFFFF] flex items-center justify-between px-5"
              >
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded-full luxury-shimmer" />
                  <div className="h-3 w-20 rounded-full luxury-shimmer" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full luxury-shimmer" />
                  <div className="w-7 h-7 rounded-full luxury-shimmer" />
                  <div className="h-6 w-16 rounded-full luxury-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stylists Table Skeleton */}
        <div className="bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="space-y-1">
              <div className="h-5 w-40 rounded-full luxury-shimmer" />
              <div className="h-3 w-44 rounded-full luxury-shimmer" />
            </div>
            <div className="h-9 w-28 rounded-full luxury-shimmer" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-full border border-[#E4DBD0] bg-[#FFFFFF] flex items-center justify-between px-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full luxury-shimmer border border-[#E4DBD0]" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded-full luxury-shimmer" />
                    <div className="h-3 w-20 rounded-full luxury-shimmer" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 rounded-full luxury-shimmer" />
                  <div className="w-7 h-7 rounded-full luxury-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
