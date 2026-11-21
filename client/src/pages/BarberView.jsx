import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import {
  Scissors,
  Clock,
  Play,
  CheckCircle2,
  Coffee,
  User,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Phone,
  RefreshCw
} from 'lucide-react';

export default function BarberView() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { lastSyncTime } = useSocket();

  const [barber, setBarber] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [nextForYou, setNextForYou] = useState(null);
  const [allBarbers, setAllBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Barber Info & Assigned Customer
  const fetchBarberData = async () => {
    try {
      const [barberRes, allBarbersRes] = await Promise.all([
        apiRequest(`/api/barbers/${encodeURIComponent(name)}`),
        apiRequest('/api/barbers')
      ]);

      if (barberRes.success) {
        setBarber(barberRes.barber);
        setCurrentToken(barberRes.currentToken);
        setNextForYou(barberRes.nextForYou);
      }
      if (allBarbersRes.success) {
        setAllBarbers(allBarbersRes.barbers);
      }
    } catch (err) {
      console.error('Failed to load barber view:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarberData();
  }, [name, lastSyncTime]);

  // Live Timer for elapsed service duration
  useEffect(() => {
    let timer = null;
    if (currentToken && currentToken.status === 'In chair' && currentToken.startedAt) {
      const startMs = new Date(currentToken.startedAt).getTime();
      const updateTimer = () => {
        const sec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setElapsedSeconds(sec);
      };
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [currentToken]);

  // Start Service ([ Start ] -> In chair)
  const handleStartService = async () => {
    if (!currentToken) return;
    setActionLoading(true);
    try {
      const res = await apiRequest('/api/queue/start-service', {
        method: 'POST',
        body: JSON.stringify({ tokenId: currentToken._id })
      });
      if (res.success) {
        fetchBarberData();
      }
    } catch (err) {
      alert(err.message || 'Failed to start service');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Service ([ Done ] -> Done)
  const handleDoneService = async () => {
    if (!currentToken) return;
    setActionLoading(true);
    try {
      const res = await apiRequest('/api/queue/complete-service', {
        method: 'POST',
        body: JSON.stringify({ tokenId: currentToken._id })
      });
      if (res.success) {
        fetchBarberData();
      }
    } catch (err) {
      alert(err.message || 'Failed to complete service');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle On Break / Available
  const handleToggleBreak = async () => {
    if (!barber) return;
    setActionLoading(true);
    try {
      const res = await apiRequest('/api/barbers/toggle-break', {
        method: 'POST',
        body: JSON.stringify({ barberId: barber._id })
      });
      if (res.success) {
        fetchBarberData();
      }
    } catch (err) {
      alert(err.message || 'Could not change break status');
    } finally {
      setActionLoading(false);
    }
  };

  // Format mm:ss
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6fc] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-700 animate-spin mb-4"></div>
        <p className="text-xs font-semibold text-gray-500">Loading barber station...</p>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-[#f8f6fc] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Barber Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">Select another stylist from the list:</p>
        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
          {allBarbers.map((b) => (
            <button
              key={b._id}
              onClick={() => navigate(`/barber/${encodeURIComponent(b.name)}`)}
              className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 text-xs font-medium cursor-pointer"
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isOnBreak = barber.status === 'On break';
  const isServing = currentToken && currentToken.status === 'In chair';
  const isCalled = currentToken && currentToken.status === 'Called';

  return (
    <div className="min-h-screen bg-[#f8f6fc] py-6 px-4 md:px-6">
      <div className="max-w-md mx-auto space-y-5">
        {/* Switch Barber Station selector dropdown */}
        <div className="flex items-center justify-between">
          <select
            value={barber.name}
            onChange={(e) => navigate(`/barber/${encodeURIComponent(e.target.value)}`)}
            className="text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full cursor-pointer focus:outline-none"
          >
            {allBarbers.map((b) => (
              <option key={b._id} value={b.name}>
                Stylist: {b.name} ({b.status})
              </option>
            ))}
          </select>

          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100/60 px-2.5 py-1 rounded-full">
            Staff Console
          </span>
        </div>

        {/* Barber Profile Header & Break Toggle */}
        <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={barber.avatar}
              alt={barber.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-600/30 shadow-md shrink-0"
            />
            <div>
              <h1 className="text-base font-bold text-gray-900">{barber.name}</h1>
              <p className="text-xs text-gray-500">{barber.specialty || 'Senior Stylist'}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnBreak ? 'bg-amber-500' : isServing ? 'bg-purple-600' : 'bg-emerald-500'
                  }`}
                ></span>
                <span className="text-[11px] font-semibold text-gray-600">
                  {barber.status}
                </span>
              </div>
            </div>
          </div>

          {/* On Break / Available Toggle Button */}
          <button
            onClick={handleToggleBreak}
            disabled={actionLoading || isServing}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isOnBreak
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{isOnBreak ? 'End Break' : 'Take Break'}</span>
          </button>
        </div>

        {/* Main Current Customer Card */}
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-600 -rotate-45" />
              <span>Current Customer in Chair</span>
            </h2>
            {currentToken && (
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Status: {currentToken.status}
              </span>
            )}
          </div>

          {currentToken ? (
            <div className="space-y-4">
              {/* Token & Client Details */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-purple-900">
                    {currentToken.tokenNumber}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {currentToken.customerName}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <p className="font-medium">
                    Services: {currentToken.services.map((s) => s.name).join(', ')}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Total: ₹{currentToken.totalPrice} · Est: {currentToken.totalDuration} min
                  </p>
                </div>
              </div>

              {/* Live Elapsed Service Timer */}
              {isServing && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white text-center shadow-inner">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-purple-300">
                    Service In Progress · Live Elapsed Timer
                  </span>
                  <h3 className="text-4xl font-mono font-black tracking-tight my-1">
                    {formatTime(elapsedSeconds)}
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Expected ~{currentToken.totalDuration} mins
                  </p>
                </div>
              )}

              {/* Sequential Action Buttons: [ Start ] -> [ Done ] */}
              <div className="pt-2">
                {isCalled && (
                  <button
                    onClick={handleStartService}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white shadow-lg shadow-purple-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Service (Seat in Chair)</span>
                  </button>
                )}

                {isServing && (
                  <button
                    onClick={handleDoneService}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Service (Mark Done)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">No customer currently assigned to your chair.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Reception will call your next client or check the preview below.
              </p>
            </div>
          )}
        </div>

        {/* 'Next for you' Preview Card */}
        <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Next In Line For You</span>
            </h3>
            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-semibold">
              Preview
            </span>
          </div>

          {nextForYou ? (
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-900">
                    {nextForYou.tokenNumber}
                  </span>
                  <span className="text-xs font-bold text-gray-800">
                    {nextForYou.customerName}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {nextForYou.services.map((s) => s.name).join(', ')} (₹{nextForYou.totalPrice})
                </p>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-1 rounded-lg border border-purple-100">
                ~{nextForYou.totalDuration}m
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center">
              <p className="text-xs text-gray-400 font-medium">No waiting customers in line</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
