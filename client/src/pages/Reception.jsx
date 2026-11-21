import React, { useState, useEffect } from 'react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import WalkInModal from '../components/WalkInModal';
import {
  Users,
  UserPlus,
  Scissors,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Coffee,
  Check
} from 'lucide-react';

export default function Reception() {
  const { lastSyncTime } = useSocket();
  const [waitingList, setWaitingList] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReceptionData = async () => {
    try {
      const [recData, servData] = await Promise.all([
        apiRequest('/api/queue/reception-data'),
        apiRequest('/api/services')
      ]);

      if (recData.success) {
        setWaitingList(recData.waitingList || []);
        setBarbers(recData.barbers || []);
      }
      if (servData.success) {
        setServices(servData.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch reception data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionData();
  }, [lastSyncTime]);

  // Call Next for a barber
  const handleCallNext = async (barberId) => {
    setActionLoading(`call-${barberId}`);
    try {
      const res = await apiRequest('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ barberId })
      });
      if (res.success) {
        fetchReceptionData();
      }
    } catch (err) {
      alert(err.message || 'Could not call next customer');
    } finally {
      setActionLoading(null);
    }
  };

  // Mark No-Show for a called token
  const handleMarkNoShow = async (tokenId) => {
    if (!window.confirm('Mark this customer as No-show? The barber will be freed up.')) return;
    setActionLoading(`noshow-${tokenId}`);
    try {
      const res = await apiRequest('/api/queue/no-show', {
        method: 'POST',
        body: JSON.stringify({ tokenId })
      });
      if (res.success) {
        fetchReceptionData();
      }
    } catch (err) {
      alert(err.message || 'Failed to mark no-show');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel token from waiting list
  const handleCancel = async (tokenId) => {
    if (!window.confirm('Cancel this waiting customer?')) return;
    setActionLoading(`cancel-${tokenId}`);
    try {
      const res = await apiRequest(`/api/queue/cancel/${tokenId}`, {
        method: 'POST'
      });
      if (res.success) {
        fetchReceptionData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate elapsed waiting minutes since joinedAt
  const getElapsedWaitMinutes = (joinedAt) => {
    if (!joinedAt) return 0;
    const diffMs = Date.now() - new Date(joinedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar for 10-inch Tablet */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-3xl border border-purple-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Reception Console
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              10" Tablet Landscape Mode · Staff PIN Verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Walk-in Button (Allowed 24/7) */}
          <button
            onClick={() => setWalkInModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-gray-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-300/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-purple-900" />
            <span>+ Add Walk-in Customer</span>
          </button>
        </div>
      </div>

      {/* Main Tablet Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stylist Stations (3-column grid) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-600 -rotate-45" />
              <span>Barber Stations & Chairs ({barbers.length})</span>
            </h2>
            <span className="text-xs text-gray-400">Live Progress</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {barbers.map((barber) => {
              const currentCust = barber.currentCustomer;
              const hasCustomer = currentCust && currentCust.tokenId;
              const isBreak = barber.status === 'On break';

              // Calculate progress bar
              let elapsedPercent = 0;
              let elapsedMins = 0;
              if (hasCustomer && currentCust.startedAt) {
                const startMs = new Date(currentCust.startedAt).getTime();
                elapsedMins = Math.max(1, Math.floor((Date.now() - startMs) / 60000));
                const totalMins = currentCust.estimatedDuration || 30;
                elapsedPercent = Math.min(100, Math.round((elapsedMins / totalMins) * 100));
              }

              return (
                <div
                  key={barber._id}
                  className={`bg-white rounded-3xl p-4 border transition-all flex flex-col justify-between shadow-sm ${
                    hasCustomer
                      ? 'border-purple-300 ring-1 ring-purple-200'
                      : isBreak
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-purple-100 hover:border-purple-300'
                  }`}
                >
                  {/* Barber Header */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-purple-100"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{barber.name}</p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                            barber.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : barber.status === 'Busy'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {barber.status}
                        </span>
                      </div>
                    </div>

                    {/* Current Customer or Empty State */}
                    {hasCustomer ? (
                      <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-purple-900">
                            {currentCust.tokenNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[100px]">
                            {currentCust.customerName}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">
                          {currentCust.services?.join(', ') || 'Styling in progress'}
                        </p>

                        {/* Progress Bar for Remaining Service Time */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span>Elapsed: {elapsedMins}m</span>
                            <span>Est: {currentCust.estimatedDuration || 30}m</span>
                          </div>
                          <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${elapsedPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center mb-3">
                        <p className="text-xs text-gray-400 font-medium">Chair is empty</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Ready for next customer</p>
                      </div>
                    )}
                  </div>

                  {/* Call Next Button */}
                  <button
                    onClick={() => handleCallNext(barber._id)}
                    disabled={isBreak || hasCustomer || actionLoading === `call-${barber._id}`}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>
                      {actionLoading === `call-${barber._id}` ? 'Calling...' : 'Call Next'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ordered Waiting List */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Live Waiting Queue ({waitingList.length})</span>
              </h2>
              <p className="text-[11px] text-gray-500">
                Ordered First-Come, First-Served (FCFS)
              </p>
            </div>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          {waitingList.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-medium">Queue is clear! No one waiting.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {waitingList.map((item, index) => {
                const waitMins = getElapsedWaitMinutes(item.joinedAt);
                // Highlighted in amber if wait duration > 60 min
                const isOver60 = waitMins > 60;
                const isCalled = item.status === 'Called';

                return (
                  <div
                    key={item._id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCalled
                        ? 'border-purple-600 bg-purple-50/80 shadow-md ring-1 ring-purple-600'
                        : isOver60
                        ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                        : 'border-gray-100 bg-[#faf9fe] hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-100">
                          {item.tokenNumber}
                        </span>
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {item.customerName}
                        </span>
                        {item.isWalkIn && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                            Walk-in
                          </span>
                        )}
                      </div>

                      {/* Status / Wait Duration Badge */}
                      {isCalled ? (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full animate-pulse">
                          ● Called for {item.assignedBarberName || 'Stylist'}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isOver60
                              ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 animate-pulse'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Waiting {waitMins}m {isOver60 ? '⚠️ (>60m)' : ''}
                        </span>
                      )}
                    </div>

                    {/* Service & Preferred Barber */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                      <span className="truncate max-w-[200px]">
                        {item.services.map(s => s.name).join(', ')} (₹{item.totalPrice})
                      </span>
                      <span className="font-medium text-purple-800">
                        Pref: {item.preferredBarberName || 'Any'}
                      </span>
                    </div>

                    {/* Actions: [ No-show ] and [ Cancel ] */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                      {isCalled && (
                        <button
                          onClick={() => handleMarkNoShow(item._id)}
                          disabled={actionLoading === `noshow-${item._id}`}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors cursor-pointer"
                        >
                          Mark No-show
                        </button>
                      )}

                      {item.status === 'Waiting' && (
                        <button
                          onClick={() => handleCancel(item._id)}
                          disabled={actionLoading === `cancel-${item._id}`}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Walk-in Modal */}
      <WalkInModal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        onWalkInAdded={() => fetchReceptionData()}
        barbers={barbers}
        services={services}
      />
    </div>
  );
}
