import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { isAuthenticated, logoutStaff, openPinModal } = useAuth();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: 'solar:widget-2-bold', exact: true },
    { to: '/join', label: 'Join Queue', icon: 'solar:user-plus-bold' },
    { to: '/reception', label: 'Reception Tablet', icon: 'solar:calendar-bold', badge: 'Staff' },
    { to: '/display', label: 'Lounge TV Display', icon: 'solar:tv-bold', badge: 'Display' },
    { to: '/barber/Aarav%20Patel', label: 'Stylist Chair', icon: 'solar:scissors-bold', badge: 'Staff' },
    { to: '/admin', label: 'Studio Settings', icon: 'solar:settings-bold', badge: 'Owner' }
  ];

  return (
    <aside className="w-64 shrink-0 my-3 ml-3 md:my-4 md:ml-4 h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2rem)] max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-2rem)] rounded-[36px] bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] p-5 shadow-2xl flex flex-col justify-between select-none hidden md:flex overflow-hidden">
      {/* Top Brand Header Pill (Static shrink-0) */}
      <div className="shrink-0 mb-4 px-3 py-3 rounded-full bg-[#4A4540]/30 border border-[#4A4540]/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#F7F3EE] flex items-center justify-center shrink-0">
          <Icon icon="solar:scissors-bold" className="w-4 h-4 text-[#1C1A18] -rotate-45" />
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-sm tracking-widest text-[#F7F3EE] uppercase truncate">ÉLAN ATELIER</h1>
          <p className="text-[9px] text-[#C2B4A3] tracking-widest uppercase font-semibold">Salon Queue</p>
        </div>
      </div>

      {/* Navigation Tabs (Scrollable flex-1 overflow-y-auto inside 100% dvh) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-1.5 scrollbar-thin">
        <nav className="space-y-1.5">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#F7F3EE] text-[#1C1A18] shadow-md border border-[#C2B4A3]'
                    : 'text-[#E4DBD0]/80 hover:bg-[#4A4540]/40 hover:text-[#F7F3EE]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      icon={item.icon}
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1C1A18]' : 'text-[#C2B4A3]'}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-[#1C1A18] text-[#F7F3EE]'
                          : 'bg-[#4A4540] text-[#E4DBD0] border border-[#C2B4A3]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Static Footer Inside 100% dvh (Pinned at bottom, shrink-0) */}
      <div className="shrink-0 pt-4 mt-auto space-y-3 border-[#4A4540]/40 bg-[#1C1A18]">
        {/* Staff Authentication Status Pill */}
        <div className="p-3 rounded-full bg-[#4A4540]/30 border border-[#4A4540]/60 flex items-center justify-between text-xs px-4">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isAuthenticated ? 'bg-[#22c55e]' : 'bg-[#C2B4A3]'
              }`}
            />
            <span className="text-[#E4DBD0] text-[11px] font-semibold truncate">
              {isAuthenticated ? 'Staff Mode Active' : 'Staff Locked'}
            </span>
          </div>
          {isAuthenticated ? (
            <button
              onClick={logoutStaff}
              className="text-[#C2B4A3] hover:text-[#F7F3EE] text-[11px] font-bold underline cursor-pointer shrink-0 ml-1"
            >
              Lock
            </button>
          ) : (
            <button
              onClick={() => openPinModal()}
              className="text-[#F7F3EE] hover:text-[#C2B4A3] font-bold text-[11px] underline cursor-pointer shrink-0 ml-1"
            >
              PIN
            </button>
          )}
        </div>

        {/* Minimalist Floating Pill Quick Action Card */}
        <div className="p-4 rounded-[28px] bg-[#4A4540]/30 border border-[#4A4540]/50 text-[#F7F3EE] space-y-2 text-center">
          <div className="w-8 h-8 rounded-full bg-[#1C1A18] text-[#C2B4A3] flex items-center justify-center mx-auto border border-[#4A4540]">
            <Icon icon="solar:ticket-bold" className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-[#F7F3EE]">Live Queue Spot</h4>
          <p className="text-[10px] text-[#C2B4A3] leading-relaxed">
            Real-time queue synchronization for lounge guests and stylists.
          </p>
          <div className="pt-1">
            <NavLink
              to="/join"
              className="inline-block w-full text-center py-2 rounded-full text-xs font-black bg-[#F7F3EE] text-[#1C1A18] hover:bg-[#E4DBD0] transition-colors shadow-xs"
            >
              Join Queue →
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
