import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { lastSyncTime } = useSocket();
  const { isAuthenticated, logoutStaff, openPinModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative select-none">
      {/* Floating Dynamic Island Capsule Header */}
      <div className="w-full bg-[#FFFFFF] rounded-full px-4 md:px-6 py-2.5 border border-[#E4DBD0] shadow-xs flex items-center justify-between">
        {/* Left: Brand Pill & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shadow-xs">
              <Icon icon="solar:scissors-bold" className="w-4 h-4 -rotate-45 text-[#C2B4A3]" />
            </div>
            <span className="font-black text-xs md:text-sm text-[#1C1A18] tracking-widest uppercase">
              ÉLAN ATELIER
            </span>
          </div>

          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#C2B4A3]"></span>

          <span className="hidden sm:inline-block text-[11px] font-medium text-[#4A4540]">
            Luxury Salon & Grooming
          </span>
        </div>

        {/* Right Controls: Real-time Capsule, Staff Pill & Mobile Button */}
        <div className="flex items-center gap-2.5">
          {/* Real-time Heartbeat Pill */}
          <div
            title="WebSocket real-time sync active"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] text-[#1C1A18] text-xs font-semibold"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1C1A18] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1C1A18]"></span>
            </span>
            <span className="hidden md:inline text-[11px] font-bold">Live Sync</span>
          </div>

          {/* Staff Lock Pill */}
          {isAuthenticated ? (
            <button
              onClick={logoutStaff}
              title="Click to lock staff console"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1C1A18] text-[#F7F3EE] hover:bg-[#4A4540] text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Icon icon="solar:lock-unlocked-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
              <span className="hidden sm:inline">Staff Active</span>
            </button>
          ) : (
            <button
              onClick={() => openPinModal()}
              title="Enter 4-digit staff PIN"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E4DBD0] text-[#1C1A18] hover:bg-[#C2B4A3] text-xs font-bold transition-all cursor-pointer border border-[#C2B4A3]"
            >
              <Icon icon="solar:lock-bold" className="w-3.5 h-3.5 text-[#4A4540]" />
              <span className="hidden sm:inline">Staff PIN</span>
            </button>
          )}

          {/* Mobile menu pill toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] text-[#1C1A18] flex items-center justify-center hover:bg-[#E4DBD0] cursor-pointer transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Icon icon={mobileMenuOpen ? 'solar:close-square-bold' : 'solar:hamburger-menu-bold'} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Floating Capsule Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#FFFFFF] border border-[#E4DBD0] rounded-[28px] p-3 shadow-xl flex flex-col gap-1 md:hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold text-[#1C1A18] hover:bg-[#F7F3EE]"
          >
            <Icon icon="solar:widget-2-bold" className="w-4 h-4 text-[#4A4540]" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/join"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold text-[#1C1A18] hover:bg-[#F7F3EE]"
          >
            <Icon icon="solar:user-plus-bold" className="w-4 h-4 text-[#4A4540]" />
            <span>Join Queue (Customer)</span>
          </NavLink>

          <NavLink
            to="/reception"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold text-[#1C1A18] hover:bg-[#F7F3EE]"
          >
            <Icon icon="solar:calendar-bold" className="w-4 h-4 text-[#4A4540]" />
            <span>Reception Console (Staff)</span>
          </NavLink>

          <NavLink
            to="/barber/Aarav%20Patel"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold text-[#1C1A18] hover:bg-[#F7F3EE]"
          >
            <Icon icon="solar:scissors-bold" className="w-4 h-4 text-[#4A4540]" />
            <span>Stylist Chair View</span>
          </NavLink>

          <NavLink
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold text-[#1C1A18] hover:bg-[#F7F3EE]"
          >
            <Icon icon="solar:settings-bold" className="w-4 h-4 text-[#4A4540]" />
            <span>Studio Settings (Owner)</span>
          </NavLink>
        </div>
      )}
    </header>
  );
}
