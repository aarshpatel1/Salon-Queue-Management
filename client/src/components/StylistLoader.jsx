import React from 'react';
import { Icon } from '@iconify/react';

/**
 * StylistTableSkeleton: Used for the Stylist Queue Table
 */
export function StylistTableSkeleton({ count = 4 }) {
  return (
    <div className="space-y-2 max-h-[380px] overflow-hidden pr-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-full border border-[#E4DBD0] bg-[#FFFFFF] flex items-center justify-between text-xs px-4 animate-fade-in-scale"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full luxury-shimmer shrink-0 border border-[#E4DBD0]" />
            <div className="space-y-1.5 min-w-0">
              <div className="h-3.5 w-24 md:w-32 rounded-full luxury-shimmer" />
              <div className="h-2.5 w-16 md:w-20 rounded-full luxury-shimmer" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-5 w-16 rounded-full luxury-shimmer" />
            <div className="h-5 w-10 rounded-full luxury-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * StylistLoader: Full page luxury loader for Stylist Station & Queue Console
 */
export default function StylistLoader() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1 animate-fade-in-scale">
      {/* Top Header Capsule Bar */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-5 md:p-6 border border-[#E4DBD0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shrink-0 shadow-md relative overflow-hidden">
            <Icon icon="solar:scissors-bold" className="w-6 h-6 text-[#C2B4A3] animate-pulse -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-[#1C1A18] tracking-tight">
                Stylist Station Console
              </h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1A18] bg-[#E4DBD0] px-3 py-0.5 rounded-full border border-[#C2B4A3]">
                Mirror View
              </span>
            </div>
            <p className="text-xs text-[#4A4540] font-medium flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#C2B4A3] animate-ping" />
              Connecting Stylist Station & Assigned Queue...
            </p>
          </div>
        </div>

        {/* Dropdown & Break Toggle Button Skeleton */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-44 rounded-full luxury-shimmer border border-[#E4DBD0]" />
          <div className="h-10 w-32 rounded-full luxury-shimmer border border-[#E4DBD0]" />
        </div>
      </div>

      {/* Main Grid: Station Mirror (Left) & Upcoming Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Chair Station (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4DBD0]/60">
              <div className="flex items-center gap-2">
                <Icon icon="solar:armchair-bold" className="w-5 h-5 text-[#1C1A18]" />
                <h2 className="text-base font-black text-[#1C1A18]">Active Station Chair</h2>
              </div>
              <div className="h-6 w-20 rounded-full luxury-shimmer" />
            </div>

            {/* Serving Guest Box Skeleton */}
            <div className="p-6 rounded-[28px] bg-[#F7F3EE]/60 border border-[#E4DBD0] space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full luxury-shimmer border border-[#E4DBD0] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 rounded-full luxury-shimmer" />
                  <div className="h-3 w-24 rounded-full luxury-shimmer" />
                </div>
                <div className="h-8 w-16 rounded-full luxury-shimmer" />
              </div>

              {/* Service Timer Box Skeleton */}
              <div className="p-4 rounded-[20px] bg-[#FFFFFF] border border-[#E4DBD0] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-3 w-20 rounded-full luxury-shimmer" />
                  <div className="h-5 w-28 rounded-full luxury-shimmer" />
                </div>
                <div className="h-8 w-24 rounded-full luxury-shimmer" />
              </div>
            </div>

            {/* Station Action Button Skeleton */}
            <div className="h-12 w-full rounded-full luxury-shimmer border border-[#E4DBD0]" />
          </div>

          {/* Stylist Profile Bar Skeleton */}
          <div className="bg-[#FFFFFF] rounded-[32px] p-5 border border-[#E4DBD0] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full luxury-shimmer border border-[#E4DBD0]" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded-full luxury-shimmer" />
                <div className="h-3 w-20 rounded-full luxury-shimmer" />
              </div>
            </div>
            <div className="h-7 w-28 rounded-full luxury-shimmer" />
          </div>
        </div>

        {/* Right Column: Next Up & Assigned Live Queue Table (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Priority Next Up Card Skeleton */}
          <div className="bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Icon icon="solar:user-bold" className="w-4 h-4 text-[#1C1A18]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#1C1A18]">
                  Next Specific Request
                </span>
              </div>
              <div className="h-5 w-16 rounded-full luxury-shimmer" />
            </div>

            <div className="p-4 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full luxury-shimmer shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 rounded-full luxury-shimmer" />
                  <div className="h-2.5 w-20 rounded-full luxury-shimmer" />
                </div>
              </div>
              <div className="h-6 w-14 rounded-full luxury-shimmer" />
            </div>
          </div>

          {/* Stylist Queue Table Card */}
          <div className="bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-[#1C1A18]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#1C1A18]">
                  Live Station Queue Table
                </span>
              </div>
              <div className="h-5 w-14 rounded-full luxury-shimmer" />
            </div>

            {/* Stylist Queue Table Skeleton */}
            <StylistTableSkeleton count={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
