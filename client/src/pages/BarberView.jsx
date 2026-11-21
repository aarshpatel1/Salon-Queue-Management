import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import CustomDropdown from '../components/CustomDropdown';
import RealTimeTimeline from '../components/RealTimeTimeline';
import CustomerProfileModal from '../components/CustomerProfileModal';

export default function BarberView() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { lastSyncTime } = useSocket();
  const { addToast } = useToast();

  const [barber, setBarber] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [nextForYou, setNextForYou] = useState(null);
  const [allWaiting, setAllWaiting] = useState([]);
  const [allBarbers, setAllBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProfileToken, setSelectedProfileToken] = useState(null);

  // Fetch Barber Info & Assigned Customer
  const fetchBarberData = async () => {
    try {
      const decodedParam = decodeURIComponent(name || 'Aarav Patel');
      const [barberRes, allBarbersRes] = await Promise.all([
        apiRequest(`/api/barbers/${encodeURIComponent(decodedParam)}`),
        apiRequest('/api/barbers')
      ]);

      if (barberRes.success) {
        setBarber(barberRes.barber);
        setCurrentToken(barberRes.currentToken);
        setNextForYou(barberRes.nextForYou);
        setAllWaiting(barberRes.allWaiting || []);
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
        addToast('Service started. Timer is now running.', 'success');
        fetchBarberData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to start service', 'error');
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
        addToast('Service completed successfully. Chair is now open!', 'success');
        fetchBarberData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete service', 'error');
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
        addToast(`Status updated: ${res.barber.status}`, 'info');
        fetchBarberData();
      }
    } catch (err) {
      addToast(err.message || 'Could not change break status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Call Next for this barber directly
  const handleCallNext = async () => {
    if (!barber) return;
    setActionLoading(true);
    try {
      const res = await apiRequest('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ barberId: barber._id })
      });
      if (res.success) {
        addToast(`Called ${res.token.customerName} to your chair`, 'success');
        fetchBarberData();
      }
    } catch (err) {
      addToast(err.message || 'No waiting customers match your station', 'warning');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <Icon icon="solar:refresh-bold" className="w-8 h-8 text-[#1C1A18] animate-spin mb-3" />
        <p className="text-xs font-bold text-[#1C1A18]">Loading Stylist Station...</p>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <Icon icon="solar:danger-triangle-bold" className="w-10 h-10 text-[#ef4444] mb-2" />
        <h2 className="text-base font-black text-[#1C1A18] mb-1">Stylist Station Not Found</h2>
        <p className="text-xs text-[#4A4540] mb-4">Please select an active stylist:</p>
        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
          {allBarbers.map((b) => (
            <button
              key={b._id}
              onClick={() => navigate(`/barber/${encodeURIComponent(b.name)}`)}
              className="px-4 py-2 rounded-full bg-[#1C1A18] text-[#F7F3EE] text-xs font-bold cursor-pointer"
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

  const stylistOptions = allBarbers.map((b) => ({
    value: b.name,
    label: `${b.name} (${b.status})`
  }));

  return (
    <div className="space-y-5 max-w-md mx-auto select-none py-1">
      {/* Switch Stylist Station Dropdown Pill */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-64">
          <CustomDropdown
            options={stylistOptions}
            value={barber.name}
            onChange={(newName) => navigate(`/barber/${encodeURIComponent(newName)}`)}
          />
        </div>

        <span className="text-[10px] uppercase font-black tracking-wider text-[#1C1A18] bg-[#E4DBD0] px-3.5 py-1.5 rounded-full border border-[#C2B4A3]">
          Staff Chair
        </span>
      </div>

      {/* Stylist Profile Pill Card & Break Toggle */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-5 border border-[#E4DBD0] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={barber.avatar}
            alt={barber.name}
            className="w-12 h-12 rounded-full object-cover border border-[#C2B4A3] shrink-0"
          />
          <div>
            <h1 className="text-base font-black text-[#1C1A18]">{barber.name}</h1>
            <p className="text-[11px] text-[#4A4540] font-medium">{barber.specialty}</p>
            <div className="mt-1">
              <span
                className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
                  barber.status === 'Available'
                    ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                    : barber.status === 'Busy'
                    ? 'bg-[#E4DBD0] text-[#1C1A18] border-[#C2B4A3]'
                    : 'bg-[#F7F3EE] text-[#4A4540] border-[#E4DBD0]'
                }`}
              >
                {barber.status}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleBreak}
          disabled={barber.status === 'Busy' || actionLoading}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isOnBreak
              ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
              : 'bg-[#F7F3EE] text-[#1C1A18] border-[#E4DBD0] hover:bg-[#E4DBD0]'
          }`}
        >
          <Icon icon={isOnBreak ? 'solar:play-circle-bold' : 'solar:cup-bold'} className="w-4 h-4" />
          <span>{isOnBreak ? 'Resume' : 'Rest'}</span>
        </button>
      </div>

      {/* Active Customer in Chair or Called Capsule */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-6 border border-[#E4DBD0] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4DBD0] pb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#1C1A18] flex items-center gap-1.5">
            <Icon icon="solar:chair-bold" className="w-4 h-4 text-[#4A4540]" />
            <span>Chair Session</span>
          </h2>

          {currentToken && (
            <span
              className={`text-[10px] font-black px-3 py-1 rounded-full ${
                isServing
                  ? 'bg-[#1C1A18] text-[#F7F3EE]'
                  : 'bg-[#E4DBD0] text-[#1C1A18]'
              }`}
            >
              {currentToken.status}
            </span>
          )}
        </div>

        {currentToken ? (
          <div className="space-y-4">
            <div
              onClick={() => setSelectedProfileToken(currentToken)}
              className="p-4 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center justify-between cursor-pointer hover:border-[#1C1A18] transition-colors"
            >
              <div>
                <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-3 py-0.5 rounded-full">
                  {currentToken.tokenNumber}
                </span>
                <h3 className="text-base font-black text-[#1C1A18] mt-2">
                  {currentToken.customerName}
                </h3>
                <p className="text-[11px] text-[#4A4540] mt-0.5 font-medium">
                  {(currentToken.services || []).map((s) => s.name).join(', ')}
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-[#1C1A18]">
                  ₹{currentToken.totalPrice}
                </span>
                <p className="text-[10px] text-[#4A4540]">
                  Est. {currentToken.totalDuration}m
                </p>
              </div>
            </div>

            {/* REAL-TIME LIVE TIMELINE: Starts when customer seats with barber! */}
            {isServing && (
              <RealTimeTimeline
                startedAt={currentToken.startedAt || new Date()}
                estimatedDuration={currentToken.totalDuration || 30}
                status="In chair"
                compact={false}
              />
            )}

            {/* Pill Action Buttons: Seat or Done */}
            <div className="flex gap-2.5 pt-1">
              {isCalled && (
                <button
                  onClick={handleStartService}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-full bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Icon icon="solar:play-circle-bold" className="w-4 h-4 text-[#C2B4A3]" />
                  <span>Seat Guest (Start Live Timer)</span>
                </button>
              )}

              {isServing && (
                <button
                  onClick={handleDoneService}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-full bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-[#C2B4A3]" />
                  <span>Complete Service (Done)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[#4A4540] space-y-3">
            <Icon icon="solar:scissors-bold" className="w-8 h-8 text-[#C2B4A3] mx-auto" />
            <div>
              <p className="text-xs font-bold text-[#1C1A18]">Chair is currently free</p>
              <p className="text-[11px] text-[#4A4540] mt-0.5 font-medium">
                Ready for next guest in queue
              </p>
            </div>

            <button
              onClick={handleCallNext}
              disabled={isOnBreak || actionLoading}
              className="px-6 py-2.5 rounded-full bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] font-bold text-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow-xs"
            >
              <Icon icon="solar:phone-calling-rounded-bold" className="w-4 h-4 text-[#C2B4A3]" />
              <span>Call Next to My Chair</span>
            </button>
          </div>
        )}
      </div>

      {/* Up Next For You Pill Card & Full Queue List */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-6 border border-[#E4DBD0] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E4DBD0] pb-2.5">
          <h3 className="text-xs font-black text-[#1C1A18] uppercase tracking-wider flex items-center gap-1.5">
            <Icon icon="solar:user-bold" className="w-4 h-4 text-[#1C1A18]" />
            <span>Next In Line For Your Station</span>
          </h3>
          <span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-2.5 py-0.5 rounded-full border border-[#C2B4A3]">
            Preview
          </span>
        </div>

        {nextForYou ? (
          <div
            onClick={() => setSelectedProfileToken(nextForYou)}
            className="p-3.5 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] flex items-center justify-between cursor-pointer hover:border-[#1C1A18] transition-colors px-4"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-2.5 py-0.5 rounded-full shrink-0">
                {nextForYou.tokenNumber}
              </span>
              <span className="text-xs font-bold text-[#1C1A18] truncate">
                {nextForYou.customerName}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#1C1A18] bg-[#FFFFFF] px-3 py-1 rounded-full border border-[#E4DBD0] shrink-0">
              ~{nextForYou.totalDuration}m
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] text-center">
            <p className="text-xs text-[#4A4540] font-medium">No direct booking ahead</p>
          </div>
        )}

        {/* Full Salon Waiting Queue in Pills */}
        {allWaiting.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-black text-[#1C1A18] mb-2 pl-1">
              All Salon Waiting Clients ({allWaiting.length})
            </p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
              {allWaiting.map((token) => (
                <div
                  key={token._id}
                  onClick={() => setSelectedProfileToken(token)}
                  className="p-2.5 rounded-full border border-[#E4DBD0] bg-[#FFFFFF] hover:border-[#1C1A18] flex items-center justify-between text-xs cursor-pointer transition-colors px-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-[#1C1A18]">{token.tokenNumber}</span>
                    <span className="font-semibold text-[#1C1A18]">{token.customerName}</span>
                  </div>
                  <span className="text-[10px] text-[#4A4540]">
                    Pref: {token.preferredBarberName || 'Any'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        token={selectedProfileToken}
        isOpen={!!selectedProfileToken}
        onClose={() => setSelectedProfileToken(null)}
        isStaffView={true}
      />
    </div>
  );
}
