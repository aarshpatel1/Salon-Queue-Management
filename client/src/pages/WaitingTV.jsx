import React, { useState, useEffect } from 'react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { playChime } from '../utils/audioChime';
import { Scissors, Clock, Users, Sparkles, Volume2, Bell } from 'lucide-react';

export default function WaitingTV() {
  const { lastSyncTime, lastCalledAlert } = useSocket();
  const [summaryData, setSummaryData] = useState(null);
  const [calledFlashToken, setCalledFlashToken] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const fetchTVData = async () => {
    try {
      const res = await apiRequest('/api/queue/summary');
      if (res.success) {
        setSummaryData(res);
      }
    } catch (err) {
      console.error('Failed to load TV display data:', err);
    }
  };

  useEffect(() => {
    fetchTVData();
  }, [lastSyncTime]);

  // When a token transitions to Called via Socket.io
  useEffect(() => {
    if (lastCalledAlert) {
      setCalledFlashToken(lastCalledAlert);
      playChime();

      // Clear flash after 4 seconds
      const timer = setTimeout(() => {
        setCalledFlashToken(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [lastCalledAlert]);

  const config = summaryData?.salonConfig;
  const barbers = summaryData?.barbers || [];
  const upNext = summaryData?.upNext || [];
  const waitStats = summaryData?.waitStats;

  // Enable audio helper for browser autoplay policies
  const handleEnableAudio = () => {
    playChime();
    setAudioEnabled(true);
  };

  return (
    <div className="min-h-screen bg-[#130324] text-white p-6 md:p-10 flex flex-col justify-between select-none">
      {/* Called Banner Flash (Large Gold Overlay on TV Chime) */}
      {calledFlashToken && (
        <div className="fixed top-8 left-8 right-8 z-50 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-gray-950 p-6 md:p-8 rounded-3xl shadow-2xl border-4 border-amber-200 animate-tv-flash flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-950 text-amber-300 flex items-center justify-center animate-bounce shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest bg-purple-950 text-white px-3 py-1 rounded-full">
                Now Calling To Chair
              </span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mt-1">
                Token {calledFlashToken.tokenNumber} — {calledFlashToken.customerName}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-950">Stylist</p>
            <p className="text-2xl md:text-4xl font-black text-purple-950">
              {calledFlashToken.barberName}
            </p>
          </div>
        </div>
      )}

      {/* Top Header: Brand & Live Salon Stats */}
      <div className="flex items-center justify-between border-b border-purple-900/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/60">
            <Scissors className="w-8 h-8 text-white -rotate-45" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-white">
              {config?.salonName || 'BRANJA BARBER STUDIO'}
            </h1>
            <p className="text-sm tracking-widest text-purple-300 uppercase">
              Live Queue & Stylist Status
            </p>
          </div>
        </div>

        {/* Live Wait Stats & Audio Trigger */}
        <div className="flex items-center gap-6">
          {!audioEnabled && (
            <button
              onClick={handleEnableAudio}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-800/80 hover:bg-purple-700 text-purple-200 text-xs font-semibold border border-purple-600 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span>Enable Audio Chimes</span>
            </button>
          )}

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live Updates</span>
            </div>
            <p className="text-2xl font-black text-white mt-0.5">
              {waitStats?.waitingCount ?? 0} in queue · ~{waitStats?.waitMinutes ?? 0}m wait
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area (Two Sections: Barber Chairs & Up Next 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-stretch flex-1">
        {/* Left Section: Barber Chairs Status (Large 5m readable row per active barber) */}
        <div className="lg:col-span-7 bg-[#1c0733]/80 rounded-3xl p-6 border border-purple-900/50 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <h2 className="text-xl font-bold text-purple-200 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-purple-400 -rotate-45" />
              <span>Stylist Chairs</span>
            </h2>
            <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
              Current Service
            </span>
          </div>

          <div className="space-y-3.5">
            {barbers.map((barber) => {
              const currentCust = barber.currentCustomer;
              const hasCustomer = currentCust && currentCust.tokenId;
              const isBreak = barber.status === 'On break';

              return (
                <div
                  key={barber._id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    hasCustomer
                      ? 'border-purple-500/60 bg-gradient-to-r from-purple-900/60 to-indigo-950/60 shadow-lg'
                      : isBreak
                      ? 'border-amber-900/40 bg-amber-950/20'
                      : 'border-purple-900/40 bg-purple-950/30'
                  }`}
                >
                  {/* Barber Avatar & Name */}
                  <div className="flex items-center gap-4">
                    <img
                      src={barber.avatar}
                      alt={barber.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/40"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white">{barber.name}</h3>
                      <p className="text-xs text-purple-300">
                        {barber.specialty || 'Senior Stylist'}
                      </p>
                    </div>
                  </div>

                  {/* Status: 'Now: S-XX' or 'Available' */}
                  <div className="text-right">
                    {hasCustomer ? (
                      <div>
                        <span className="text-2xl md:text-3xl font-black text-amber-300 tracking-wider">
                          Now: {currentCust.tokenNumber}
                        </span>
                        <p className="text-xs text-purple-200 font-medium">
                          {currentCust.customerName}
                        </p>
                      </div>
                    ) : isBreak ? (
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                        On Break
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: 'Up next' list of next 5 waiting tokens */}
        <div className="lg:col-span-5 bg-[#1c0733]/80 rounded-3xl p-6 border border-purple-900/50 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <h2 className="text-xl font-bold text-purple-200 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Up Next in Line</span>
            </h2>
            <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
              Next 5 Tokens
            </span>
          </div>

          {upNext.length === 0 ? (
            <div className="py-16 text-center text-purple-400/80">
              <p className="text-lg font-bold">No Waiting Customers</p>
              <p className="text-xs text-purple-400/60 mt-1">Chairs are ready for walk-ins!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upNext.map((token, index) => (
                <div
                  key={token._id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    index === 0
                      ? 'border-amber-400/80 bg-gradient-to-r from-amber-500/20 to-purple-900/40 ring-1 ring-amber-400/50'
                      : 'border-purple-900/40 bg-purple-950/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        index === 0
                          ? 'bg-amber-400 text-gray-950'
                          : 'bg-purple-900 text-purple-200'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-2xl font-black text-white">{token.tokenNumber}</p>
                      <p className="text-xs text-purple-300 truncate max-w-[150px]">
                        {token.customerName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-purple-200">
                      ~{token.totalDuration} min
                    </span>
                    <p className="text-[10px] text-purple-400 uppercase tracking-wider">
                      Pref: {token.preferredBarberName?.split(' ')[0] || 'Any'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-purple-900/60 pt-4 flex flex-wrap items-center justify-between text-xs text-purple-400/80">
        <p>Salon Closing Time: 9:00 PM (Online registration closes at 8:30 PM)</p>
        <p>Please check your phone for live turn alerts and notifications.</p>
      </div>
    </div>
  );
}
