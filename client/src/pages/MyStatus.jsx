import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { playChime, triggerVibration } from '../utils/audioChime';
import confetti from 'canvas-confetti';
import RealTimeTimeline from '../components/RealTimeTimeline';

export default function MyStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lastSyncTime } = useSocket();

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await apiRequest(`/api/queue/status/${id}`);
      if (res.success && res.token) {
        setTokenData(res);
        localStorage.setItem('elan_active_token_id', res.token._id);
        window.dispatchEvent(new Event('elan_token_updated'));

        if (res.token.status === 'Called' && !hasCelebrated) {
          playChime();
          triggerVibration([400, 200, 400]);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          setHasCelebrated(true);
        }
      } else {
        setError(res.message || 'Token not found');
      }
    } catch (err) {
      console.error('Failed to load token status:', err);
      setError('Could not connect to live status. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [id, lastSyncTime]);

  const token = tokenData?.token;
  const queuePosition = tokenData?.queuePosition || 1;
  const waitStats = tokenData?.waitStats;
  const isSecondInLine = queuePosition === 2 && token?.status === 'Waiting';
  const isCalled = token?.status === 'Called';
  const isInChair = token?.status === 'In chair';
  const isDone = token?.status === 'Done';

  const formatOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <Icon icon="solar:refresh-bold" className="w-8 h-8 text-[#1C1A18] animate-spin mb-3" />
        <p className="text-xs font-bold text-[#1C1A18]">Connecting to Live Dynamic Island...</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <Icon icon="solar:danger-triangle-bold" className="w-10 h-10 text-[#ef4444] mb-2" />
        <h2 className="text-lg font-black text-[#1C1A18] mb-1">Spot Not Found</h2>
        <p className="text-xs text-[#4A4540] max-w-xs mb-4">
          {error || 'This ticket may have been concluded or cancelled.'}
        </p>
        <NavLink
          to="/join"
          className="px-6 py-2.5 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-bold text-xs"
        >
          Join Live Queue
        </NavLink>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto select-none py-1">
      {/* Top Navigation Pill */}
      <div className="flex items-center justify-between">
        <NavLink
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C1A18] bg-[#FFFFFF] px-4 py-2 rounded-full border border-[#E4DBD0] shadow-xs"
        >
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4 text-[#4A4540]" />
          <span>Dashboard</span>
        </NavLink>

        <span className="text-[10px] font-black uppercase tracking-wider text-[#1C1A18] bg-[#E4DBD0] px-3.5 py-1.5 rounded-full border border-[#C2B4A3]">
          Live Ticket
        </span>
      </div>

      {/* 2nd in Line Warning Capsule Banner */}
      {isSecondInLine && (
        <div className="p-4 rounded-full bg-[#E4DBD0] text-[#1C1A18] border border-[#C2B4A3] shadow-xs flex items-center gap-3 px-5">
          <Icon icon="solar:bell-bold" className="w-5 h-5 shrink-0 text-[#1C1A18]" />
          <div className="text-xs">
            <p className="font-black uppercase tracking-wide">You're 2nd in line!</p>
            <p className="text-[#4A4540] text-[11px] mt-0.5">
              Please make your way toward the salon lounge.
            </p>
          </div>
        </div>
      )}

      {/* CALLED TO CHAIR ALERT PILL BANNER */}
      {isCalled && (
        <div className="p-5 rounded-[32px] bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center shrink-0">
            <Icon icon="solar:scissors-bold" className="w-6 h-6 text-[#1C1A18]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest bg-[#4A4540] text-[#E4DBD0] px-3 py-0.5 rounded-full">
              Chair Ready
            </span>
            <h2 className="text-lg font-black mt-1">Please Proceed to Chair!</h2>
            <p className="text-xs text-[#E4DBD0]">
              Stylist: <span className="font-bold text-[#F7F3EE]">{token.assignedBarberName || 'Your Stylist'}</span>
            </p>
          </div>
        </div>
      )}

      {/* IN CHAIR REAL-TIME TIMELINE BANNER */}
      {isInChair && (
        <div className="p-6 rounded-[32px] bg-[#FFFFFF] border border-[#1C1A18] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse"></span>
              <span className="text-xs font-black text-[#1C1A18] uppercase tracking-wider">
                Session Active in Chair
              </span>
            </div>
            <span className="text-xs font-bold text-[#4A4540]">
              Stylist: {token.assignedBarberName || 'Stylist'}
            </span>
          </div>

          {/* REAL-TIME LIVE TIMELINE */}
          <RealTimeTimeline
            startedAt={token.startedAt || new Date()}
            estimatedDuration={token.totalDuration || 30}
            status="In chair"
            compact={false}
          />
        </div>
      )}

      {/* COMPLETED BANNER */}
      {isDone && (
        <div className="p-6 rounded-[32px] bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] text-center space-y-2">
          <Icon icon="solar:check-circle-bold" className="w-10 h-10 text-[#C2B4A3] mx-auto" />
          <h3 className="text-base font-bold">Session Completed</h3>
          <p className="text-xs text-[#E4DBD0]">
            Thank you for visiting Élan Atelier. See you on your next visit!
          </p>
        </div>
      )}

      {/* Main Digital Ticket Capsule Card */}
      <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E4DBD0] pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#4A4540]">
              Ticket Number
            </span>
            <p className="text-3xl font-black text-[#1C1A18]">{token.tokenNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#4A4540]">
              Customer
            </span>
            <p className="text-base font-black text-[#1C1A18]">{token.customerName}</p>
          </div>
        </div>

        {/* Waiting Countdown Capsule Card */}
        {token.status === 'Waiting' && (
          <div className="p-6 rounded-[28px] bg-[#F7F3EE] border border-[#E4DBD0] text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#4A4540]">
              Estimated Wait Ahead
            </span>
            <p className="text-4xl font-black text-[#1C1A18]">
              ~{waitStats?.waitMinutes ?? 0}m
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-[#1C1A18] bg-[#FFFFFF] px-4 py-1 rounded-full border border-[#E4DBD0]">
                Position #{queuePosition} ({formatOrdinal(queuePosition)} in line)
              </span>
            </div>
          </div>
        )}

        {/* Service Breakdown in Pills */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-[#1C1A18] uppercase tracking-wider flex items-center justify-between pl-1">
            <span>Booked Services</span>
            <span className="text-[#1C1A18]">Total: ₹{token.totalPrice}</span>
          </h4>
          <div className="space-y-1.5">
            {(token.services || []).map((srv, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] text-xs px-4"
              >
                <span className="font-semibold text-[#1C1A18]">{srv.name}</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#4A4540]">{srv.duration}m</span>
                  <span className="font-bold text-[#1C1A18]">₹{srv.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Removal Disabled Protection Note */}
        <div className="p-4 rounded-[24px] bg-[#E4DBD0]/40 border border-[#C2B4A3] flex items-start gap-3">
          <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-[#1C1A18] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-[#1C1A18] text-[11px]">Protected Spot</p>
            <p className="text-[10px] text-[#4A4540] mt-0.5 leading-relaxed">
              Your position in line is live and locked. Self-removal is disabled to maintain queue fairness. To adjust services or cancel, please check in at the reception desk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
