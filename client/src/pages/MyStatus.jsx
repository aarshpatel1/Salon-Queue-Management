import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { playChime, triggerVibration } from '../utils/audioChime';
import {
  Scissors,
  Clock,
  User,
  Phone,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  XCircle,
  MapPin,
  CheckCircle2,
  Bell
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MyStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lastSyncTime, lastCalledAlert } = useSocket();

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await apiRequest(`/api/queue/status/${id}`);
      if (res.success) {
        setTokenData(res);
        // If status transitioned to Called, trigger vibration & chime
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
  const isCancelled = token?.status === 'Cancelled';
  const isNoShow = token?.status === 'No-show';

  // Format position string (1st, 2nd, 3rd, 4th...)
  const formatOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Handle Cancel Spot
  const handleCancelSpot = async () => {
    setCancelling(true);
    try {
      const res = await apiRequest(`/api/queue/cancel/${token._id}`, {
        method: 'POST'
      });
      if (res.success) {
        setCancelModalOpen(false);
        fetchStatus();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel spot');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6fc] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-gray-600">Retrieving live token status...</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-[#f8f6fc] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Token Not Found</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
          {error || 'We could not locate this queue token. It may have expired or been removed.'}
        </p>
        <NavLink
          to="/join"
          className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-purple-700 hover:bg-purple-800 transition-all"
        >
          Join Queue Again
        </NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6fc] py-6 px-4 md:px-8">
      {/* Full-screen Gold Called Alert Overlay when token is Called */}
      {isCalled && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 flex flex-col items-center justify-center p-6 text-center text-gray-950 animate-in fade-in duration-300">
          <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center mb-6 animate-bounce shadow-2xl">
            <Sparkles className="w-12 h-12 text-purple-950" />
          </div>

          <span className="text-xs font-black tracking-widest uppercase bg-purple-950 text-amber-300 px-4 py-1.5 rounded-full shadow-lg mb-4">
            It's Your Turn Now!
          </span>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
            Token {token.tokenNumber}
          </h1>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl max-w-sm w-full my-4 shadow-2xl border border-amber-300">
            <p className="text-sm font-semibold text-gray-600">Please proceed directly to:</p>
            <h2 className="text-2xl font-black text-purple-950 my-1">
              {token.assignedBarberName || 'Main Styling Station'}
            </h2>
            <div className="text-xs text-gray-700 mt-2 flex items-center justify-center gap-1 font-medium">
              <MapPin className="w-4 h-4 text-purple-700" />
              <span>Chair 1 - Branja Barber Studio</span>
            </div>
          </div>

          <p className="text-xs text-purple-950/80 font-medium max-w-xs mt-2">
            Your stylist is waiting for you at the station. Have a seat and enjoy your fresh look!
          </p>
        </div>
      )}

      <div className="max-w-md mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Studio Home</span>
          </NavLink>

          <span className="text-[11px] font-bold text-purple-900 bg-purple-100/60 px-2.5 py-1 rounded-full">
            Live Queue Tracker
          </span>
        </div>

        {/* 2nd in line Alert: "Start coming to the salon" */}
        {isSecondInLine && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 shadow-lg flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-gray-950" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm leading-tight">Start Coming to the Salon!</h4>
              <p className="text-xs font-medium text-gray-900/90 mt-0.5">
                You are 2nd in line. Your turn is coming up very shortly!
              </p>
            </div>
          </div>
        )}

        {/* Status Completed / Cancelled / In Chair Badges */}
        {isInChair && (
          <div className="p-4 rounded-3xl bg-purple-600 text-white shadow-lg flex items-center gap-3">
            <Scissors className="w-6 h-6 -rotate-45" />
            <div>
              <h4 className="font-bold text-sm">Currently in Chair</h4>
              <p className="text-xs text-purple-200">
                You are being styled by {token.assignedBarberName || 'your barber'}.
              </p>
            </div>
          </div>
        )}

        {isDone && (
          <div className="p-4 rounded-3xl bg-emerald-600 text-white shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h4 className="font-bold text-sm">Service Completed</h4>
              <p className="text-xs text-emerald-100">
                Thank you for visiting Branja Barber Studio! Hope you love your new style.
              </p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="p-4 rounded-3xl bg-red-100 text-red-800 border border-red-200 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <h4 className="font-bold text-sm">Spot Cancelled</h4>
              <p className="text-xs text-red-700">This queue spot has been cancelled.</p>
            </div>
          </div>
        )}

        {isNoShow && (
          <div className="p-4 rounded-3xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h4 className="font-bold text-sm">Marked No-show</h4>
              <p className="text-xs text-amber-800">
                Your spot was called but no one checked in. Please re-join the queue at reception if you have returned.
              </p>
            </div>
          </div>
        )}

        {/* Main Token Badge Card */}
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xl space-y-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-400"></div>

          {/* Token Number Display */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              Your Queue Token
            </span>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight mt-3">
              {token.tokenNumber}
            </h1>
            <p className="text-sm font-semibold text-gray-700 mt-1">{token.customerName}</p>
          </div>

          {/* Live Position & Auto-Updating Circular Wait Countdown */}
          {token.status === 'Waiting' && (
            <div className="py-4 border-y border-purple-50 flex items-center justify-around">
              {/* Queue Position */}
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 font-medium">Queue Position</span>
                <span className="text-3xl font-extrabold text-purple-700 mt-0.5">
                  {formatOrdinal(queuePosition)}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">in line</span>
              </div>

              {/* Circular Wait Countdown */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-purple-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-600 transition-all duration-1000"
                    strokeDasharray="100, 100"
                    strokeDashoffset="25"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-gray-900 leading-none">
                    ~{waitStats?.waitMinutes ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                    mins wait
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Services & Barber Details */}
          <div className="space-y-3 text-left bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Selected Services:</span>
              <span className="font-bold text-gray-900">
                {token.services.map(s => s.name).join(', ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Preferred Barber:</span>
              <span className="font-bold text-purple-800">
                {token.preferredBarberName || 'Any barber (fastest)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-100">
              <span className="text-gray-500">Total Price:</span>
              <span className="font-extrabold text-gray-900 text-sm">₹{token.totalPrice}</span>
            </div>
          </div>

          {/* Cancel Spot Button */}
          {token.status === 'Waiting' && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel my spot</span>
            </button>
          )}
        </div>

        {/* Live sync footnote */}
        <div className="text-center text-[11px] text-gray-400">
          Auto-updates instantly within 5 seconds without refreshing.
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Cancel Your Spot?</h3>
              <p className="text-xs text-gray-500 mt-1">
                You will lose your current position in the queue. You can re-join later at the end of the line.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              >
                Keep My Spot
              </button>
              <button
                onClick={handleCancelSpot}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
