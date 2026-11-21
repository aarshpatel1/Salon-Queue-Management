import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import RealTimeTimeline from './RealTimeTimeline';

export default function DynamicIsland() {
  const { lastSyncTime } = useSocket();
  const [tokenId, setTokenId] = useState(() => localStorage.getItem('elan_active_token_id'));
  const [tokenData, setTokenData] = useState(null);
  const [expanded, setExpanded] = useState(false);

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
        console.error('Failed to sync customer dynamic island status:', err);
      }
    };

    fetchTokenStatus();
  }, [tokenId, lastSyncTime]);

  if (!tokenId || !tokenData || !tokenData.token) return null;

  const token = tokenData.token;
  const queuePos = tokenData.queuePosition || 1;
  const waitStats = tokenData.waitStats;
  const isDone = ['Done', 'Cancelled', 'No-show'].includes(token.status);

  const handleDismiss = (e) => {
    e.stopPropagation();
    localStorage.removeItem('elan_active_token_id');
    setTokenId(null);
    setTokenData(null);
    setExpanded(false);
  };

  return (
    <>
      {/* Floating iOS 27 Dynamic Island Pill at Bottom Center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
        <div
          onClick={() => setExpanded(true)}
          className="flex items-center gap-3.5 px-5 py-2.5 bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] rounded-full shadow-2xl cursor-pointer hover:border-[#C2B4A3] transition-all transform hover:-translate-y-0.5 active:scale-98"
        >
          {/* Pulsing Dynamic Island Camera / Status Dot */}
          <span className="relative flex h-3 w-3 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                token.status === 'In chair'
                  ? 'bg-[#22c55e]'
                  : token.status === 'Called'
                  ? 'bg-[#E4DBD0]'
                  : 'bg-[#C2B4A3]'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                token.status === 'In chair'
                  ? 'bg-[#22c55e]'
                  : token.status === 'Called'
                  ? 'bg-[#E4DBD0]'
                  : 'bg-[#C2B4A3]'
              }`}
            ></span>
          </span>

          {/* Token Pill Badge */}
          <span className="bg-[#F7F3EE] text-[#1C1A18] px-3 py-0.5 rounded-full text-xs font-black tracking-wider">
            {token.tokenNumber}
          </span>

          {/* Customer & Status Text */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#F7F3EE] max-w-[100px] sm:max-w-[140px] truncate">
              {token.customerName}
            </span>
            <span className="text-[#4A4540]">•</span>
            {token.status === 'Waiting' ? (
              <span className="text-[#E4DBD0] font-semibold">
                #{queuePos} in line (~{waitStats?.waitMinutes ?? 0}m wait)
              </span>
            ) : token.status === 'Called' ? (
              <span className="text-[#F7F3EE] font-black animate-pulse">
                Proceed to Chair!
              </span>
            ) : token.status === 'In chair' ? (
              <span className="text-[#22c55e] font-black">
                In Chair (Active)
              </span>
            ) : (
              <span className="text-[#C2B4A3] font-semibold">{token.status}</span>
            )}
          </div>

          {/* Maximize Pill Icon */}
          <div className="w-6 h-6 rounded-full bg-[#4A4540]/50 flex items-center justify-center shrink-0">
            <Icon icon="solar:maximize-square-minimalistic-bold" className="w-3.5 h-3.5 text-[#E4DBD0]" />
          </div>

          {isDone && (
            <button
              onClick={handleDismiss}
              title="Close finished ticket"
              className="p-1 text-[#C2B4A3] hover:text-[#F7F3EE] cursor-pointer ml-1"
            >
              <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded iOS 27 Dynamic Island Capsule Modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-transparent select-none animate-in fade-in duration-200"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-md rounded-[36px] bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Dynamic Island Title */}
            <div className="flex items-center justify-between border-b border-[#4A4540]/50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F7F3EE] flex items-center justify-center text-[#1C1A18]">
                  <Icon icon="solar:clock-circle-bold" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#F7F3EE] uppercase tracking-wider">
                    Dynamic Island Ticket
                  </h3>
                  <p className="text-[10px] text-[#C2B4A3]">Live Queue Telemetry • Élan Atelier</p>
                </div>
              </div>

              <button
                onClick={() => setExpanded(false)}
                className="w-8 h-8 rounded-full bg-[#4A4540]/40 text-[#C2B4A3] hover:text-[#F7F3EE] flex items-center justify-center cursor-pointer transition-colors"
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            </div>

            {/* Main Wait Pill Card */}
            <div className="p-6 rounded-[28px] bg-[#4A4540]/25 border border-[#4A4540]/60 text-center space-y-2">
              <span className="inline-block bg-[#F7F3EE] text-[#1C1A18] text-xs font-black px-4 py-1 rounded-full mb-1">
                Token {token.tokenNumber}
              </span>
              <h4 className="text-xl font-black text-[#F7F3EE]">
                {token.customerName}
              </h4>

              {token.status === 'Waiting' ? (
                <div className="pt-2">
                  <p className="text-3xl font-black text-[#F7F3EE]">
                    ~{waitStats?.waitMinutes ?? 0} Mins
                  </p>
                  <p className="text-xs text-[#C2B4A3] mt-0.5 font-medium">
                    Estimated Wait Ahead
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 bg-[#1C1A18] text-[#F7F3EE] px-4 py-1.5 rounded-full text-xs font-bold border border-[#4A4540]">
                    <Icon icon="solar:users-group-rounded-bold" className="w-4 h-4 text-[#C2B4A3]" />
                    <span>
                      Position #{queuePos} ({queuePos === 1 ? 'Next in line!' : `${queuePos - 1} clients ahead`})
                    </span>
                  </div>
                </div>
              ) : token.status === 'Called' ? (
                <div className="pt-2">
                  <p className="text-xl font-black text-[#F7F3EE] animate-pulse">
                    Please Walk to Stylist Station!
                  </p>
                  <p className="text-xs text-[#C2B4A3] font-bold mt-1">
                    Stylist: {token.assignedBarberName || 'Station Stylist'}
                  </p>
                </div>
              ) : token.status === 'In chair' ? (
                <div className="pt-2">
                  <p className="text-sm font-bold text-[#F7F3EE]">
                    Styling Session In Progress with {token.assignedBarberName || 'Stylist'}
                  </p>
                </div>
              ) : (
                <div className="pt-2">
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

            {/* Services Pill Breakdown */}
            <div className="p-4 rounded-[28px] bg-[#4A4540]/20 border border-[#4A4540]/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold border-b border-[#4A4540]/30 pb-2">
                <span className="text-[#C2B4A3] uppercase text-[10px] tracking-wider">Booked Services</span>
                <span className="text-[#F7F3EE]">Total: ₹{token.totalPrice}</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {(token.services || []).map((srv, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-[#E4DBD0]">{srv.name}</span>
                    <span className="font-semibold text-[#F7F3EE]">₹{srv.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Protected Queue Spot Pill Note */}
            <div className="p-4 rounded-[24px] bg-[#4A4540]/25 border border-[#4A4540]/40 flex items-start gap-3">
              <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-[#C2B4A3] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[#F7F3EE] text-[11px]">Queue Spot Protection</p>
                <p className="text-[10px] text-[#C2B4A3] mt-0.5 leading-relaxed">
                  Your spot is live and locked. Self-removal is disabled to maintain queue integrity. To request modifications, please contact the front desk.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-1">
              {isDone ? (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-3 rounded-full bg-[#F7F3EE] text-[#1C1A18] font-bold text-xs hover:bg-[#E4DBD0] transition-colors cursor-pointer"
                >
                  Clear Completed Ticket
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="w-full py-3 rounded-full bg-[#F7F3EE] text-[#1C1A18] font-bold text-xs hover:bg-[#E4DBD0] transition-colors cursor-pointer"
                >
                  Minimize to Bottom Island
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
