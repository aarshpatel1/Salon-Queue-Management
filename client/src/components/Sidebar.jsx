import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Tv,
  Scissors,
  Users,
  Settings,
  Sparkles,
  UserPlus,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { isAuthenticated, logoutStaff, openPinModal } = useAuth();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/join', label: 'Join Queue', icon: UserPlus },
    { to: '/reception', label: 'Reception', icon: Calendar, badge: 'Staff' },
    { to: '/display', label: 'Waiting TV', icon: Tv, badge: 'Public' },
    { to: '/barber/Dudu%20Tassa', label: 'Barber View', icon: Users, badge: 'Staff' },
    { to: '/admin', label: 'Settings', icon: Settings, badge: 'Staff' }
  ];

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-[#1c052f] text-white flex flex-col justify-between p-5 border-r border-purple-950/60 select-none hidden md:flex">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/50">
            <Scissors className="w-5 h-5 text-white -rotate-45" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white">BRANJA</h1>
            <p className="text-[11px] text-purple-300 tracking-widest uppercase">Barber Studio</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-700/40 font-semibold'
                      : 'text-purple-200/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-normal ${
                      item.badge === 'Staff'
                        ? 'bg-purple-900/80 text-purple-200 border border-purple-700/50'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo & Auth Card */}
      <div className="space-y-4">
        {/* Staff Authentication Status */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Unlock className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-gray-300">
              {isAuthenticated ? 'Staff Mode Active' : 'Staff Locked'}
            </span>
          </div>
          {isAuthenticated ? (
            <button
              onClick={logoutStaff}
              className="text-purple-300 hover:text-white text-[11px] underline cursor-pointer"
            >
              Lock
            </button>
          ) : (
            <button
              onClick={() => openPinModal()}
              className="text-amber-300 hover:text-amber-100 font-semibold text-[11px] underline cursor-pointer"
            >
              Enter PIN
            </button>
          )}
        </div>

        {/* Growth Banner (Matching Demo Image) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-800/80 to-indigo-900/80 border border-purple-500/30 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 w-16 h-16 bg-purple-400/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center mb-2.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <h3 className="font-bold text-xs tracking-wide">Grow Your Barber Business</h3>
          <p className="text-[11px] text-purple-200/80 mt-1 leading-snug">
            Manage bookings, queue tokens, and your team effortlessly.
          </p>
          <div className="mt-3">
            <NavLink
              to="/admin"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white text-purple-950 px-3 py-1.5 rounded-xl shadow hover:bg-purple-50 transition-colors"
            >
              Manage Studio →
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
