import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import {
  Scissors,
  Users,
  Clock,
  Sparkles,
  Calendar,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Tv,
  Tablet,
  UserCheck,
  TrendingUp,
  Shield,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { lastSyncTime } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const res = await apiRequest('/api/queue/summary');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load queue summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [lastSyncTime]);

  const config = data?.salonConfig;
  const waitStats = data?.waitStats;
  const barbers = data?.barbers || [];
  const isOnlineOpen = data?.isOnlineJoiningAllowed;

  // Barber chip status styling helper
  const getStatusChip = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Busy':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'On break':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Salon Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-3xl border border-purple-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Scissors className="w-6 h-6 -rotate-45" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              {config?.salonName || 'Branja Barber Studio'}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Premium Grooming & Queue Management
            </p>
          </div>
        </div>

        {/* 'Open · Closes 9 PM' or 'Closed' Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs border ${
              isOnlineOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnlineOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            ></span>
            <span>{isOnlineOpen ? 'Open · Closes 9 PM' : 'Closed'}</span>
          </div>

          <NavLink
            to="/join"
            className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm text-gray-900 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-300/40 transform hover:-translate-y-0.5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-900" />
            <span>Join Queue</span>
          </NavLink>
        </div>
      </div>

      {/* Main Grid: Hero Card & KPI Cards (Exact replica of Desktop UI Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hero Card (Matches Screenshot Dark Purple Gradient Banner) */}
        <div className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-[#2b0845] via-[#4d1377] to-[#7b2cbf] text-white p-6 md:p-8 relative overflow-hidden shadow-xl shadow-purple-900/20 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid md:grid-cols-2 gap-6 items-center z-10">
            {/* Salon Interior Preview Image */}
            <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-4/3 shadow-2xl border border-white/20">
              <img
                src={config?.bannerImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'}
                alt="Branja Salon Interior"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-900/80 px-2 py-0.5 rounded-md border border-purple-400/40">
                  Luxury Lounge
                </span>
              </div>
            </div>

            {/* Hero Copy */}
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest text-purple-200 font-semibold">
                Your style, effortlessly.
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
                Find your barber. <br />
                Book your next fresh look.
              </h2>
              <p className="text-xs text-purple-200/90 leading-relaxed">
                Join our real-time smart queue from your phone, watch live countdowns, and walk in right when your chair is ready.
              </p>

              <div className="pt-2">
                <NavLink
                  to="/join"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm text-gray-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-amber-200 shadow-xl shadow-amber-400/30 transform active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-purple-900" />
                  <span>Join Queue</span>
                  <ArrowRight className="w-4 h-4 text-purple-900" />
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 4 KPI Cards (Matching Desktop Demo) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {/* Card 1: Live Waiting */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {waitStats?.waitingCount ?? 0}
              </h3>
              <p className="text-xs text-gray-500 font-medium">People Waiting</p>
              <div className="mt-2 text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                <span>{waitStats?.isPaused ? 'Break Paused' : `~${waitStats?.waitMinutes ?? 0} min total wait`}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Est. Wait Duration */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                FCFS
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {waitStats?.waitMinutes ?? 0}m
              </h3>
              <p className="text-xs text-gray-500 font-medium">Est. Wait Ahead</p>
              <div className="mt-2 text-[11px] text-gray-500">
                Based on {waitStats?.activeBarbersCount ?? 0} active barbers
              </div>
            </div>
          </div>

          {/* Card 3: Active Stylists */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Scissors className="w-5 h-5 -rotate-45" />
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Today
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {barbers.filter(b => b.isOnDuty).length}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Active Stylists</p>
              <div className="mt-2 text-[11px] text-emerald-600 font-medium">
                {barbers.filter(b => b.status === 'Available').length} Available now
              </div>
            </div>
          </div>

          {/* Card 4: Daily Total Capacity */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ₹ INR
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">₹150+</h3>
              <p className="text-xs text-gray-500 font-medium">Affordable Grooming</p>
              <div className="mt-2 text-[11px] text-gray-500">
                Haircut, Beard & Spa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Queue Summary Card & Barber Status Chips */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              Live Queue Summary & Barber Status
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {waitStats?.isPaused
                ? 'Queue is currently paused (all barbers on break)'
                : `${waitStats?.waitingCount ?? 0} people waiting · about ${waitStats?.waitMinutes ?? 0} min estimated wait`}
            </p>
          </div>

          <NavLink
            to="/join"
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-700 hover:bg-purple-800 shadow-md shadow-purple-200 transition-all cursor-pointer"
          >
            + Get In Line Now
          </NavLink>
        </div>

        {/* Barber Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {barbers.map((barber) => (
            <div
              key={barber._id}
              className="p-3.5 rounded-2xl border border-purple-100/80 bg-[#faf9fe] flex items-center gap-3 hover:border-purple-300 transition-all"
            >
              <img
                src={barber.avatar}
                alt={barber.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-gray-900 truncate">{barber.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusChip(
                      barber.status
                    )}`}
                  >
                    {barber.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation to the Other 6 Screens */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold">Quick Access: The 7 Studio Screens</h3>
            <p className="text-xs text-purple-200">
              Access staff consoles, client status check, and TV display
            </p>
          </div>
          <span className="text-[11px] bg-white/10 text-purple-200 px-3 py-1 rounded-full font-mono border border-white/10">
            PIN: 1234
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <NavLink
            to="/join"
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex flex-col justify-between"
          >
            <Sparkles className="w-5 h-5 text-amber-300 mb-2" />
            <div>
              <p className="font-bold text-xs">1. Join Queue</p>
              <p className="text-[10px] text-purple-200">Customer Mobile</p>
            </div>
          </NavLink>

          <NavLink
            to="/status/sample"
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex flex-col justify-between"
          >
            <Clock className="w-5 h-5 text-emerald-300 mb-2" />
            <div>
              <p className="font-bold text-xs">2. My Status</p>
              <p className="text-[10px] text-purple-200">Phone Countdown</p>
            </div>
          </NavLink>

          <NavLink
            to="/reception"
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex flex-col justify-between"
          >
            <Tablet className="w-5 h-5 text-purple-300 mb-2" />
            <div>
              <p className="font-bold text-xs">3. Reception</p>
              <p className="text-[10px] text-amber-300">10" Tablet (PIN)</p>
            </div>
          </NavLink>

          <NavLink
            to="/barber/Dudu%20Tassa"
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex flex-col justify-between"
          >
            <UserCheck className="w-5 h-5 text-cyan-300 mb-2" />
            <div>
              <p className="font-bold text-xs">4. Barber View</p>
              <p className="text-[10px] text-amber-300">Stylist Phone (PIN)</p>
            </div>
          </NavLink>

          <NavLink
            to="/display"
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex flex-col justify-between"
          >
            <Tv className="w-5 h-5 text-pink-300 mb-2" />
            <div>
              <p className="font-bold text-xs">5. Waiting TV</p>
              <p className="text-[10px] text-purple-200">5-Meter Display</p>
            </div>
          </NavLink>

          <NavLink
            to="/admin"
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex flex-col justify-between"
          >
            <TrendingUp className="w-5 h-5 text-yellow-300 mb-2" />
            <div>
              <p className="font-bold text-xs">6. Admin Settings</p>
              <p className="text-[10px] text-amber-300">Owner KPIs (PIN)</p>
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
