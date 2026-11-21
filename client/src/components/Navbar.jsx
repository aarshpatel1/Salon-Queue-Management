import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { Search, Bell, Radio, Scissors, Menu, X, Lock, Unlock } from 'lucide-react';

export default function Navbar() {
  const { lastSyncTime } = useSocket();
  const { isAuthenticated, logoutStaff, openPinModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#f8f6fc]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-purple-100/60">
      {/* Left: Mobile Brand & Desktop Greeting */}
      <div className="flex items-center gap-4">
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center text-white">
            <Scissors className="w-4 h-4 -rotate-45" />
          </div>
          <span className="font-bold text-gray-900 tracking-wider">BRANJA</span>
        </div>

        {/* Desktop Greeting */}
        <div className="hidden md:flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="Manager Avatar"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-600/30"
          />
          <div>
            <p className="text-xs text-gray-500 font-medium leading-none">Good Morning,</p>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1 mt-0.5">
              Branja Barber Studio <span className="text-sm">👋</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Middle: Desktop Search Bar */}
      <div className="hidden lg:flex items-center relative w-96">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Search clients, queue tokens..."
          className="w-full pl-10 pr-16 py-2 bg-white rounded-full text-xs border border-purple-100 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm transition-all"
        />
        <span className="absolute right-3 text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-100">
          Live Sync
        </span>
      </div>

      {/* Right Controls: Real-time Indicator & Actions */}
      <div className="flex items-center gap-3">
        {/* Real-time Heartbeat indicator */}
        <div
          title="MongoDB & Socket.io Live Subscribed"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Live Sync</span>
        </div>

        {/* Staff Lock Status */}
        {isAuthenticated ? (
          <button
            onClick={logoutStaff}
            title="Click to lock staff session"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100/80 text-purple-800 hover:bg-purple-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Staff (1234)</span>
          </button>
        ) : (
          <button
            onClick={() => openPinModal()}
            title="Enter 4-digit staff PIN"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Staff PIN</span>
          </button>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-purple-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-purple-100 p-4 shadow-xl flex flex-col gap-2 md:hidden z-50">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 text-gray-700"
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/join"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 text-gray-700"
          >
            Join Queue (Customer)
          </NavLink>
          <NavLink
            to="/reception"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 text-purple-700 font-semibold"
          >
            Reception Tablet (PIN)
          </NavLink>
          <NavLink
            to="/display"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 text-gray-700"
          >
            Waiting Area TV
          </NavLink>
          <NavLink
            to="/barber/Dudu%20Tassa"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 text-purple-700 font-semibold"
          >
            Barber View (PIN)
          </NavLink>
          <NavLink
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-50 text-purple-700 font-semibold"
          >
            Owner Settings (PIN)
          </NavLink>
        </div>
      )}
    </header>
  );
}
