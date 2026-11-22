import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import RealTimeTimeline from './RealTimeTimeline';
import Avatar from './Avatar';
import { formatTimer } from '../utils/timeFormat';

export default function DynamicIsland() {
  const { lastSyncTime } = useSocket();
  const [tokenId, setTokenId] = useState(() => localStorage.getItem('elan_active_token_id'));
  const [tokenData, setTokenData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showOptOutConfirm, setShowOptOutConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 1-second live ticker for smooth countdown and elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync token ID from localStorage / events
  useEffect(() => {
    const checkToken = () => {
      const stored = localStorage.getItem('elan_active_token_id');
      if (stored !== tokenId) {
        setTokenId(stored);
      }
    };

    window.addEventListener('storage', checkToken);
    window.addEventListener('elan_token_updated', checkToken);
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('elan_token_updated', checkToken);
    };
  }, [tokenId]);

  // Fetch status of current active token
  useEffect(() => {
    if (!tokenId) {
      setTokenData(null);
      return;
    }

    const fetchTokenStatus = async () => {
      try {
        const res = await apiRequest(`/api/queue/status/${tokenId}`);
        if (res.success && res.token) {
          setTokenData(res);
        }
      } catch (err) {
        console.error('Failed to sync customer queue status:', err);
      }
    };

    fetchTokenStatus();
  }, [tokenId, lastSyncTime]);

  // Escape key handler for smoothly collapsing the modal
  useEffect(() => {
    if (!expanded) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

  if (!tokenId || !tokenData || !tokenData.token) return null;

  const token = tokenData.token;
  const queuePos = tokenData.queuePosition || 1;
  const waitStats = tokenData.waitStats;
  const isDone = ['Done', 'Cancelled', 'No-show'].includes(token.status);

  // Calculate live wait timer (countdown if target is in future, or elapsed wait time)
  let waitTimerSeconds = Math.max(0, (waitStats?.waitMinutes ?? 0) * 60);
  if (token.joinedAt && waitStats?.waitMinutes !== undefined) {
    const joinedMs = new Date(token.joinedAt).getTime();
    const targetMs = joinedMs + (waitStats.waitMinutes * 60 * 1000);
    const diffSec = Math.floor((targetMs - currentTime) / 1000);
    if (diffSec > 0) {
      waitTimerSeconds = diffSec;
    } else {
      const elapsedSec = Math.max(0, Math.floor((currentTime - joinedMs) / 1000));
      waitTimerSeconds = elapsedSec;
    }
  }

  // Calculate in-chair live elapsed time
  let inChairSeconds = 0;
  if (token.status === 'In chair' && token.startedAt) {
    inChairSeconds = Math.max(0, Math.floor((currentTime - new Date(token.startedAt).getTime()) / 1000));
  }

  // Smooth collapse back to bottom pill
  const handleCollapse = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setShowOptOutConfirm(false);
    setExpanded(false);
  };

  const handleOpen = () => {
    setShowOptOutConfirm(false);
    setExpanded(true);
  };

  const handleDismiss = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    localStorage.removeItem('elan_active_token_id');
    window.dispatchEvent(new Event('elan_token_updated'));
    setTokenId(null);
    setTokenData(null);
    setExpanded(false);
    setShowOptOutConfirm(false);
  };

  const handleOptOut = async () => {
    if (!token?._id) return;
    setCancelling(true);
    try {
      await apiRequest(`/api/queue/cancel/${token._id}`, { method: 'POST' });
      handleDismiss();
    } catch (err) {
      console.error('Failed to opt out of queue:', err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* Darkened Background Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-350 ease-out ${
          expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleCollapse}
      />

      {/* Floating Bottom Bar that expands directly into Modal via height/size transformation */}
      <div
        role="dialog"
        aria-expanded={expanded}
        onClick={!expanded ? handleOpen : undefined}
        className={`floating-bottom-island select-none ${expanded ? 'is-expanded' : ''}`}
      >
        {/* Compact Bar View (Visible when collapsed) */}
        <div className="compact-bar-view">
          {/* Customer Avatar & Pulsing Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <Avatar src={token.avatar} name={token.customerName} size="xs" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#1C1A18] ${
                  token.status === 'In chair'
                    ? 'bg-[#22c55e]'
                    : token.status === 'Called'
                    ? 'bg-[#E4DBD0]'
                    : 'bg-[#C2B4A3]'
                }`}
              />
            </div>

            {/* Token Pill Badge */}
            <span className="bg-[#F7F3EE] text-[#1C1A18] px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider shrink-0">
              {token.tokenNumber}
            </span>

            {/* Customer & Status Text with Live Timer */}
            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="font-bold text-[#F7F3EE] truncate max-w-[85px] sm:max-w-[120px]">
                {token.customerName}
              </span>
              <span className="text-[#4A4540]">•</span>
              {token.status === 'Waiting' ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[#E4DBD0] font-semibold text-[11px] whitespace-nowrap">
                    #{queuePos}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#F7F3EE] bg-[#4A4540]/40 px-2 py-0.5 rounded-full border border-[#4A4540]/60 text-[11px]">
                    <Icon icon="solar:clock-circle-bold" className="w-3 h-3 text-[#C2B4A3]" />
                    <span>{formatTimer(waitTimerSeconds)}</span>
                  </span>
                </div>
              ) : token.status === 'Called' ? (
                <span className="text-[#F7F3EE] font-black animate-pulse flex items-center gap-1 text-[11px]">
                  <Icon icon="solar:bell-bing-bold" className="w-3 h-3 text-[#C2B4A3]" />
                  <span>To Chair!</span>
                </span>
              ) : token.status === 'In chair' ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[#22c55e] font-black text-[11px]">In Chair</span>
                  <span className="font-mono font-bold text-[#22c55e] bg-[#22c55e]/15 px-2 py-0.5 rounded-full text-[11px]">
                    {formatTimer(inChairSeconds)}
                  </span>
                </div>
              ) : (
                <span className="text-[#C2B4A3] text-[11px] font-semibold">{token.status}</span>
              )}
            </div>
          </div>

          {/* Expand Arrow / Maximize Icon */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <div className="w-6 h-6 rounded-full bg-[#4A4540]/50 flex items-center justify-center text-[#E4DBD0] hover:bg-[#4A4540] transition-colors">
              <Icon icon="solar:alt-arrow-up-bold" className="w-3.5 h-3.5" />
            </div>
            {isDone && (
              <button
                onClick={handleDismiss}
                title="Close finished ticket"
                className="p-1 text-[#C2B4A3] hover:text-[#F7F3EE] cursor-pointer"
              >
                <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Modal View (Transforms directly by growing from the bottom bar) */}
        <div className="expanded-modal-view" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={token.avatar} name={token.customerName} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-[#F7F3EE] uppercase tracking-wider truncate">
                    Live Queue Ticket
                  </h3>
                  <span className="bg-[#F7F3EE] text-[#1C1A18] px-2 py-0.5 rounded-full text-[10px] font-black shrink-0">
                    {token.tokenNumber}
                  </span>
                </div>
                <p className="text-[11px] text-[#C2B4A3] truncate">{token.customerName} • Élan Atelier</p>
              </div>
            </div>

            <button
              onClick={handleCollapse}
              aria-label="Close modal"
              className="w-8 h-8 rounded-full bg-[#4A4540]/40 text-[#C2B4A3] hover:text-[#F7F3EE] hover:bg-[#4A4540]/80 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
            {/* Main Wait Pill Card */}
            <div className="p-4 rounded-[28px] bg-[#4A4540]/25 border border-[#4A4540]/60 text-center space-y-1.5">
              <span className="inline-block bg-[#F7F3EE] text-[#1C1A18] text-xs font-black px-4 py-0.5 rounded-full mb-1">
                Token {token.tokenNumber}
              </span>
              <h4 className="text-lg font-black text-[#F7F3EE]">
                {token.customerName}
              </h4>

              {token.status === 'Waiting' ? (
                <div className="pt-1">
                  <p className="text-3xl font-black font-mono text-[#F7F3EE]">
                    {formatTimer(waitTimerSeconds)}
                  </p>
                  <p className="text-xs text-[#C2B4A3] mt-0.5 font-medium">
                    Estimated Wait Timer Ahead (~{waitStats?.waitMinutes ?? 0} Mins)
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-2 bg-[#1C1A18] text-[#F7F3EE] px-4 py-1.5 rounded-full text-xs font-bold border border-[#4A4540]">
                    <Icon icon="solar:users-group-rounded-bold" className="w-4 h-4 text-[#C2B4A3]" />
                    <span>
                      Position #{queuePos} ({queuePos === 1 ? 'Next in line!' : `${queuePos - 1} clients ahead`})
                    </span>
                  </div>
                </div>
              ) : token.status === 'Called' ? (
                <div className="pt-1">
                  <p className="text-lg font-black text-[#F7F3EE] animate-pulse">
                    Please Walk to Stylist Station!
                  </p>
                  <p className="text-xs text-[#C2B4A3] font-bold mt-1">
                    Stylist: {token.assignedBarberName || 'Station Stylist'}
                  </p>
                </div>
              ) : token.status === 'In chair' ? (
                <div className="pt-1">
                  <p className="text-xs font-bold text-[#F7F3EE]">
                    Styling Session In Progress with {token.assignedBarberName || 'Stylist'}
                  </p>
                  <p className="text-2xl font-black font-mono text-[#22c55e] mt-1">
                    {formatTimer(inChairSeconds)}
                  </p>
                </div>
              ) : (
                <div className="pt-1">
                  <p className="text-sm font-bold text-[#E4DBD0]">
                    Session Status: {token.status}
                  </p>
                </div>
              )}
            </div>

            {/* Real-time Timeline if in chair */}
            {token.status === 'In chair' && (
              <RealTimeTimeline
                startedAt={token.startedAt}
                estimatedDuration={token.totalDuration || 30}
                status="In chair"
                compact={false}
              />
            )}

            {/* Booked Services Breakdown */}
            <div className="p-3.5 rounded-[24px] bg-[#4A4540]/20 border border-[#4A4540]/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold pb-1">
                <span className="text-[#C2B4A3] uppercase text-[10px] tracking-wider">Booked Services</span>
                <span className="text-[#F7F3EE]">Total: ₹{token.totalPrice}</span>
              </div>
              <div className="space-y-1.5 pt-0.5">
                {(token.services || []).map((srv, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-[#E4DBD0]">{srv.name}</span>
                    <span className="font-semibold text-[#F7F3EE]">₹{srv.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Opt Out / Cancel Confirmation Box */}
            {showOptOutConfirm && (
              <div className="p-3.5 rounded-[24px] bg-[#ef4444]/15 border border-[#ef4444]/40 text-center space-y-2.5">
                <p className="text-xs font-bold text-[#F7F3EE]">
                  Are you sure you want to opt out of the queue?
                </p>
                <p className="text-[10px] text-[#C2B4A3]">
                  Your spot #{token.tokenNumber} will be cancelled and given to the next guest in line.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOptOutConfirm(false)}
                    className="flex-1 py-2 rounded-full border border-[#4A4540] text-xs font-bold text-[#E4DBD0] hover:bg-[#4A4540]/40 transition-colors cursor-pointer"
                  >
                    Keep My Spot
                  </button>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={handleOptOut}
                    className="flex-1 py-2 rounded-full bg-[#ef4444] text-white text-xs font-bold hover:bg-[#dc2626] transition-colors cursor-pointer"
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Opt Out'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Area */}
          <div className="space-y-2 pt-3 shrink-0">
            {isDone ? (
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-full bg-[#F7F3EE] text-[#1C1A18] font-bold text-xs hover:bg-[#E4DBD0] transition-colors cursor-pointer"
              >
                Clear Completed Ticket
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCollapse}
                  className="w-full py-2.5 rounded-full bg-[#F7F3EE] text-[#1C1A18] font-bold text-xs hover:bg-[#E4DBD0] transition-colors cursor-pointer"
                >
                  Minimize to Bottom Bar
                </button>
                {!showOptOutConfirm && ['Waiting', 'Called'].includes(token.status) && (
                  <button
                    type="button"
                    onClick={() => setShowOptOutConfirm(true)}
                    className="w-full py-2 rounded-full border border-[#ef4444]/40 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                    <span>Opt Out / Cancel My Turn</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
