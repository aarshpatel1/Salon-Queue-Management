import React from 'react';
import { Icon } from '@iconify/react';

/**
 * ReceptionTableSkeleton: Can be used inside the Waiting Queue Table card
 * when queue data is refreshing or loading independently.
 */
export function ReceptionTableSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2.5 max-h-[640px] overflow-hidden pr-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-3 rounded-full border border-[#E4DBD0] bg-[#FFFFFF] flex items-center justify-between px-3.5 select-none animate-fade-in-scale"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Drag Handle placeholder */}
            <div className="w-4 h-4 rounded luxury-shimmer shrink-0 opacity-40" />

            {/* Customer Avatar Skeleton */}
            <div className="w-8 h-8 rounded-full luxury-shimmer shrink-0 border border-[#E4DBD0]" />

            {/* Token Badge Skeleton */}
            <div className="w-9 h-5 rounded-full luxury-shimmer shrink-0" />

            {/* Customer Info Bars */}
            <div className="space-y-1.5 min-w-0">
              <div className="h-3.5 w-28 md:w-36 rounded-full luxury-shimmer" />
              <div className="h-2.5 w-20 md:w-28 rounded-full luxury-shimmer" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Preferred Stylist Tag */}
            <div className="h-5 w-16 md:w-20 rounded-full luxury-shimmer hidden sm:block" />

            {/* Wait Time Pill */}
            <div className="h-5 w-12 rounded-full luxury-shimmer" />

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-full luxury-shimmer" />
              <div className="w-7 h-7 rounded-full luxury-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ReceptionLoader: Full page luxury skeleton for Reception Desk and Tablet Console
 */
export default function ReceptionLoader() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1 animate-fade-in-scale">
      {/* Top Header Capsule Bar */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-5 md:p-6 border border-[#E4DBD0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shrink-0 shadow-md relative overflow-hidden">
            <Icon icon="solar:calendar-bold" className="w-6 h-6 text-[#C2B4A3] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-[#1C1A18] tracking-tight">
                Reception Console
              </h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1A18] bg-[#E4DBD0] px-3 py-0.5 rounded-full border border-[#C2B4A3]">
                Staff Tablet
              </span>
            </div>
            <p className="text-xs text-[#4A4540] font-medium flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#C2B4A3] animate-ping" />
              Loading Salon Stations & Live Queue...
            </p>
          </div>
        </div>

        {/* Live Wait Stats Pill Skeleton & Walk-In Button Skeleton */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-44 rounded-full luxury-shimmer border border-[#E4DBD0]" />
          <div className="h-10 w-36 rounded-full luxury-shimmer border border-[#E4DBD0]" />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stylist Station Chairs (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Icon icon="solar:users-group-rounded-bold" className="w-5 h-5 text-[#1C1A18]" />
              <h2 className="text-base font-black text-[#1C1A18]">Active Stylist Stations</h2>
            </div>
            <div className="h-5 w-24 rounded-full luxury-shimmer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 rounded-[28px] border border-[#E4DBD0] bg-[#F7F3EE]/40 flex flex-col justify-between min-h-[170px] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full luxury-shimmer border border-[#E4DBD0]" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 rounded-full luxury-shimmer" />
                      <div className="h-3 w-16 rounded-full luxury-shimmer" />
                    </div>
                  </div>
                  <div className="h-6 w-14 rounded-full luxury-shimmer" />
                </div>

                <div className="p-3.5 rounded-[20px] bg-[#FFFFFF] border border-[#E4DBD0] space-y-2">
                  <div className="h-3 w-28 rounded-full luxury-shimmer" />
                  <div className="h-3.5 w-3/4 rounded-full luxury-shimmer" />
                </div>

                <div className="h-9 w-full rounded-full luxury-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Waiting Queue Table (5 cols) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
                <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-[#1C1A18]" />
                <span>Live Waiting Queue</span>
              </h2>
              <p className="text-[11px] text-[#4A4540]">Loading queue order & guest tickets...</p>
            </div>
            <div className="h-6 w-24 rounded-full luxury-shimmer" />
          </div>

          {/* Table Skeleton */}
          <ReceptionTableSkeleton count={5} />
        </div>
      </div>
    </div>
  );
}
