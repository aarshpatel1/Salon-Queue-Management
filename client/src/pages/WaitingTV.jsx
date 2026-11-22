import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { playChime } from '../utils/audioChime';
import RealTimeTimeline from '../components/RealTimeTimeline';
import Avatar from '../components/Avatar';
import WaitingTVLoader from '../components/WaitingTVLoader';

export default function WaitingTV() {
  const { lastSyncTime, lastCalledAlert } = useSocket();
  const [summaryData, setSummaryData] = useState(null);
  const [calledFlashToken, setCalledFlashToken] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      const timer = setTimeout(() => {
        setCalledFlashToken(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastCalledAlert]);

  const config = summaryData?.salonConfig;
  const barbers = summaryData?.barbers || [];
  const upNext = summaryData?.waitingTokens || summaryData?.upNext || [];
  const waitStats = summaryData?.waitStats;

  const handleEnableAudio = () => {
    playChime();
    setAudioEnabled(true);
  };

  // Mobile Screen Gate: TV Mode is explicitly hidden for mobile website!
  if (isMobileScreen) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none bg-[#1C1A18] text-[#F7F3EE]">
        <div className="w-16 h-16 rounded-full bg-[#4A4540]/30 text-[#F7F3EE] flex items-center justify-center mb-4 border border-[#4A4540]">
          <Icon icon="solar:tv-bold" className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black mb-2">TV Lounge Mode Hidden on Mobile</h2>
        <p className="text-xs text-[#C2B4A3] max-w-xs mb-6 leading-relaxed">
          The 5-Meter TV Mode is designed exclusively for widescreen lounge displays in landscape mode. Please open on a desktop monitor or salon TV.
        </p>
        <NavLink
          to="/"
          className="px-6 py-3 rounded-full bg-[#F7F3EE] text-[#1C1A18] font-black text-xs"
        >
          Return to Mobile Dashboard
        </NavLink>
      </div>
    );
  }

  // Live TV Loader while synchronizing lounge queue & barber stations
  if (!summaryData) {
    return <WaitingTVLoader />;
  }

  return (
    <div className="h-full bg-[#1C1A18] text-[#F7F3EE] p-6 md:p-10 flex flex-col justify-between select-none overflow-hidden">
      {/* Called Banner Flash (iOS Dynamic Island Massive Alert Pill) */}
      {calledFlashToken && (
        <div className="fixed top-8 left-8 right-8 z-50 bg-[#F7F3EE] text-[#1C1A18] p-6 md:p-8 rounded-[40px] shadow-2xl border-4 border-[#C2B4A3] flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shadow-lg border border-[#4A4540]">
              <Icon icon="solar:scissors-bold" className="w-8 h-8 text-[#C2B4A3]" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest bg-[#E4DBD0] text-[#1C1A18] px-3.5 py-1 rounded-full">
                Now Calling To Chair
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mt-1.5">
                Token {calledFlashToken.tokenNumber} — {calledFlashToken.customerName}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-[#4A4540]">Stylist Station</p>
            <p className="text-2xl md:text-4xl font-black text-[#1C1A18]">
              {calledFlashToken.barberName}
            </p>
          </div>
        </div>
      )}

      {/* Top Header: Brand & Live Salon Stats in Pill */}
      <div className="flex items-center justify-between pb-4 mb-2 shrink-0 animate-fade-in-scale stagger-1">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F7F3EE] flex items-center justify-center shadow-md">
            <Icon icon="solar:scissors-bold" className="w-8 h-8 text-[#1C1A18] -rotate-45" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-wider text-[#F7F3EE]">
              {config?.salonName || 'ÉLAN ATELIER'}
            </h1>
            <p className="text-xs tracking-widest text-[#C2B4A3] uppercase font-bold">
              Live Lounge Queue & Stylist Stations
            </p>
          </div>
        </div>

        {/* Live Wait Stats & Audio Trigger */}
        <div className="flex items-center gap-6">
          {!audioEnabled && (
            <button
              onClick={handleEnableAudio}
              className="px-5 py-2.5 rounded-full bg-[#4A4540]/40 hover:bg-[#4A4540]/70 text-[#F7F3EE] border border-[#4A4540] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Icon icon="solar:volume-loud-bold" className="w-4 h-4 text-[#C2B4A3]" />
              <span>Enable Lounge Audio</span>
            </button>
          )}

          <div className="text-right">
            <p className="text-xs uppercase font-bold tracking-widest text-[#C2B4A3]">
              Estimated Wait
            </p>
            <p className="text-3xl font-black text-[#F7F3EE]">
              ~{waitStats?.waitMinutes ?? 0} Mins
            </p>
            <p className="text-[11px] text-[#C2B4A3]">
              {waitStats?.waitingCount ?? upNext.length} clients in line
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Display: 7 Columns Barber Stations | 5 Columns Up Next */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-stretch flex-1 min-h-0 overflow-hidden">
        {/* Left Section: Stylist Chairs in Pill Capsules */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between overflow-y-auto pr-1 scrollbar-thin animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between pb-2 mb-1 shrink-0">
            <h2 className="text-lg font-black text-[#F7F3EE] flex items-center gap-2">
              <Icon icon="solar:scissors-bold" className="w-5 h-5 text-[#C2B4A3]" />
              <span>Active Stylist Chairs</span>
            </h2>
            <span className="text-xs font-bold text-[#C2B4A3] uppercase tracking-wider">
              {barbers.filter((b) => b.status === 'Available').length} Chairs Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            {barbers.map((barber) => {
              const currentCust = barber.currentCustomer;
              const hasCustomer = currentCust && currentCust.tokenId;
              const isBusy = barber.status === 'Busy';
              const isBreak = barber.status === 'On break';

              return (
                <div
                  key={barber._id}
                  className={`rounded-[32px] p-5 border flex flex-col justify-between ${
                    isBusy
                      ? 'border-[#C2B4A3] bg-[#4A4540]/30'
                      : isBreak
                      ? 'border-[#4A4540]/40 bg-[#4A4540]/10 opacity-70'
                      : 'border-[#4A4540]/60 bg-[#4A4540]/20'
                  }`}
                >
                  <div>
                    {/* Stylist Profile */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={barber.avatar}
                        name={barber.name}
                        size="w-12 h-12 text-sm"
                        className="border border-[#C2B4A3] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-black text-sm text-[#F7F3EE] truncate">
                          {barber.name}
                        </p>
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full inline-block border ${
                            barber.status === 'Available'
                              ? 'bg-[#F7F3EE] text-[#1C1A18] border-[#F7F3EE]'
                              : barber.status === 'Busy'
                              ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#4A4540]'
                              : 'bg-[#4A4540] text-[#E4DBD0] border-[#4A4540]'
                          }`}
                        >
                          {barber.status}
                        </span>
                      </div>
                    </div>

                    {/* Customer In Chair with Real-Time Timeline */}
                    {hasCustomer ? (
                      <div className="p-3.5 rounded-[24px] bg-[#1C1A18] border border-[#4A4540] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-[#F7F3EE]">
                            {currentCust.tokenNumber}
                          </span>
                          <span className="text-xs font-bold text-[#E4DBD0] truncate max-w-[120px]">
                            {currentCust.customerName}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#C2B4A3] truncate">
                          {currentCust.services?.join(', ')}
                        </p>

                        {/* Real-time Timeline */}
                        <div className="pt-1">
                          <RealTimeTimeline
                            startedAt={currentCust.startedAt || new Date()}
                            estimatedDuration={currentCust.estimatedDuration || 30}
                            status="In chair"
                            compact={true}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-[24px] bg-[#1C1A18]/40 border border-dashed border-[#4A4540] text-center">
                        <p className="text-xs text-[#C2B4A3] font-medium">Chair is open</p>
                        <p className="text-[10px] text-[#F7F3EE] font-bold mt-0.5">
                          Ready for next guest
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Up Next in Line in Capsule Island */}
        <div className="lg:col-span-5 bg-[#4A4540]/25 rounded-[36px] p-6 border border-[#4A4540] shadow-xl flex flex-col justify-between space-y-4 overflow-hidden animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between pb-2 mb-1 shrink-0">
            <h2 className="text-lg font-black text-[#F7F3EE] flex items-center gap-2">
              <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-[#C2B4A3]" />
              <span>Up Next in Line</span>
            </h2>
            <span className="text-xs uppercase tracking-widest text-[#E4DBD0] font-black">
              Next 5 Tickets
            </span>
          </div>

          {upNext.length === 0 ? (
            <div className="py-16 text-center text-[#C2B4A3]">
              <Icon icon="solar:check-circle-bold" className="w-10 h-10 text-[#F7F3EE] mx-auto mb-2" />
              <p className="text-base font-bold">No Waiting Clients</p>
              <p className="text-xs text-[#C2B4A3] mt-1">Chairs are ready for walk-ins!</p>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {upNext.slice(0, 5).map((token, index) => (
                <div
                  key={token._id}
                  className={`p-4 rounded-full border flex items-center justify-between px-5 ${
                    index === 0
                      ? 'border-[#F7F3EE] bg-[#1C1A18] shadow-md'
                      : 'border-[#4A4540] bg-[#1C1A18]/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        index === 0
                          ? 'bg-[#F7F3EE] text-[#1C1A18]'
                          : 'bg-[#4A4540] text-[#F7F3EE]'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <Avatar
                      src={token.avatar}
                      name={token.customerName}
                      size="w-9 h-9 text-xs"
                      className="border border-[#4A4540] shrink-0"
                    />
                    <div>
                      <p className="text-lg font-black text-[#F7F3EE]">{token.tokenNumber}</p>
                      <p className="text-xs text-[#E4DBD0] truncate max-w-[150px]">
                        {token.customerName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-[#F7F3EE]">
                      Pref: {token.preferredBarberName || 'Any'}
                    </span>
                    <p className="text-[10px] text-[#C2B4A3]">
                      ~{token.totalDuration} mins
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#4A4540]/40 flex items-center justify-between text-xs text-[#C2B4A3] shrink-0">
            <span>Scan QR at desk to join queue</span>
            <span className="font-mono text-[#F7F3EE]">Live Queue Engine</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-[#4A4540]/40 pt-4 flex items-center justify-between text-xs text-[#C2B4A3] shrink-0">
        <p>Élan Atelier Lounge Display • Live Queue Telemetry</p>
        <p>Real-time continuous sync active</p>
      </div>
    </div>
  );
}
