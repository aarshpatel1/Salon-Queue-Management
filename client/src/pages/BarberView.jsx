import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import CustomDropdown from '../components/CustomDropdown';
import RealTimeTimeline from '../components/RealTimeTimeline';
import CustomerProfileModal from '../components/CustomerProfileModal';
import Avatar from '../components/Avatar';
import StylistLoader, { StylistTableSkeleton } from '../components/StylistLoader';

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

  // Mark No-Show for current called customer
  const handleMarkNoShow = async () => {
    if (!currentToken) return;
    setActionLoading(true);
    try {
      const res = await apiRequest('/api/queue/no-show', {
        method: 'POST',
        body: JSON.stringify({ tokenId: currentToken._id })
      });
      if (res.success) {
        addToast(`${currentToken.customerName} marked as No-show. Chair is now open.`, 'warning');
        fetchBarberData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to mark no-show', 'error');
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
    return <StylistLoader />;
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
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1">
      {/* Top Header Capsule Bar */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-5 md:p-6 border border-[#E4DBD0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-scale stagger-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shrink-0 shadow-md">
            <Icon icon="solar:scissors-bold" className="w-6 h-6 -rotate-45 text-[#C2B4A3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-[#1C1A18] tracking-tight">
                {barber.name}
              </h1>
              <span
                className={`text-[9px] font-black px-2.5 py-0.5 rounded-full inline-block border ${
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
            <p className="text-xs text-[#4A4540] font-medium mt-0.5">
              Stylist Station Console • {barber.specialty || 'Master Grooming'}
            </p>
          </div>
        </div>

        {/* Right Station Controls: Switch Stylist Dropdown & Break Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-56 sm:w-64">
            <CustomDropdown
              options={stylistOptions}
              value={barber.name}
              onChange={(newName) => navigate(`/barber/${encodeURIComponent(newName)}`)}
            />
          </div>

          <button
            onClick={handleToggleBreak}
            disabled={barber.status === 'Busy' || actionLoading}
            className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
              isOnBreak
                ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                : 'bg-[#F7F3EE] text-[#1C1A18] border-[#E4DBD0] hover:bg-[#E4DBD0]'
            }`}
          >
            <Icon icon={isOnBreak ? 'solar:play-circle-bold' : 'solar:cup-bold'} className="w-4 h-4 text-[#C2B4A3]" />
            <span>{isOnBreak ? 'Resume Work' : 'Take Break'}</span>
          </button>
        </div>
      </div>

      {/* Desktop Responsive Side-by-Side Cards Layout (like Join Queue) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Chair Session & Stylist Details) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Customer in Chair or Called Capsule */}
          <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs space-y-5 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between pb-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center">
                  <Icon icon="solar:chair-bold" className="w-4 h-4 text-[#C2B4A3]" />
                </span>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#1C1A18]">
                    Active Chair Session
                  </h2>
                  <p className="text-[11px] text-[#4A4540]">Current client stationed at your mirror</p>
                </div>
              </div>

              {currentToken && (
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                    isServing
                      ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                      : 'bg-[#E4DBD0] text-[#1C1A18] border-[#C2B4A3]'
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
                  className="p-5 rounded-[28px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center justify-between cursor-pointer hover:border-[#1C1A18] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar
                      src={currentToken.avatar}
                      name={currentToken.customerName}
                      size="w-12 h-12 text-sm"
                      className="border border-[#C2B4A3] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-3 py-0.5 rounded-full inline-block mb-1.5">
                        {currentToken.tokenNumber}
                      </span>
                      <h3 className="text-lg font-black text-[#1C1A18] truncate">
                        {currentToken.customerName}
                      </h3>
                      <p className="text-xs text-[#4A4540] mt-0.5 font-medium truncate">
                        {(currentToken.services || []).map((s) => s.name).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-[#1C1A18]">
                      ₹{currentToken.totalPrice}
                    </span>
                    <p className="text-xs text-[#4A4540] font-semibold mt-0.5">
                      Est. {currentToken.totalDuration}m
                    </p>
                  </div>
                </div>

                {/* Status Alert if Called */}
                {isCalled && (
                  <div className="p-4 rounded-[24px] bg-[#E4DBD0]/50 border border-[#C2B4A3] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1C1A18] animate-ping shrink-0" />
                      <div>
                        <p className="text-xs font-black text-[#1C1A18]">Guest Called to Station</p>
                        <p className="text-[10px] text-[#4A4540]">Awaiting guest to sit in your chair</p>
                      </div>
                    </div>
                    <button
                      onClick={handleMarkNoShow}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[#FFFFFF] border border-[#C2B4A3] text-[#4A4540] hover:text-[#ef4444] transition-colors cursor-pointer"
                    >
                      No-Show
                    </button>
                  </div>
                )}

                {/* REAL-TIME LIVE TIMELINE: Active when customer seats with barber */}
                {isServing && (
                  <RealTimeTimeline
                    startedAt={currentToken.startedAt || new Date()}
                    estimatedDuration={currentToken.totalDuration || 30}
                    status="In chair"
                    compact={false}
                  />
                )}

                {/* Action Buttons: Seat Guest or Complete Session */}
                <div className="flex gap-3 pt-2">
                  {isCalled && (
                    <button
                      onClick={handleStartService}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 rounded-full bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Icon icon="solar:play-circle-bold" className="w-4 h-4 text-[#C2B4A3]" />
                      <span>{actionLoading ? 'Starting...' : 'Seat Guest (Start Live Timer)'}</span>
                    </button>
                  )}

                  {isServing && (
                    <button
                      onClick={handleDoneService}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 rounded-full bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                    >
                      <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-[#C2B4A3]" />
                      <span>{actionLoading ? 'Completing...' : 'Complete Service (Conclude Session)'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#4A4540] space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#F7F3EE] text-[#C2B4A3] flex items-center justify-center mx-auto border border-[#E4DBD0]">
                  <Icon icon="solar:scissors-bold" className="w-7 h-7 text-[#1C1A18]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1A18]">Chair is currently free</h3>
                  <p className="text-xs text-[#4A4540] mt-0.5 font-medium">
                    {isOnBreak ? 'You are currently on break. Resume work to call next guest.' : 'Ready to welcome next guest from the live queue.'}
                  </p>
                </div>

                <button
                  onClick={handleCallNext}
                  disabled={isOnBreak || actionLoading}
                  className="px-8 py-3.5 rounded-full bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] font-black text-xs uppercase tracking-wider inline-flex items-center gap-2.5 cursor-pointer disabled:opacity-40 shadow-md transition-all"
                >
                  <Icon icon="solar:phone-calling-rounded-bold" className="w-4 h-4 text-[#C2B4A3]" />
                  <span>{actionLoading ? 'Calling...' : 'Call Next to My Chair'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Stylist Profile Card */}
          <div className="bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs flex items-center justify-between gap-4 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-3.5">
              <Avatar
                src={barber.avatar}
                name={barber.name}
                size="w-14 h-14 text-base"
                className="border border-[#C2B4A3] shrink-0"
              />
              <div>
                <h3 className="text-base font-black text-[#1C1A18]">{barber.name}</h3>
                <p className="text-xs text-[#4A4540] font-medium">{barber.specialty}</p>
                <p className="text-[11px] text-[#C2B4A3] font-semibold mt-0.5">
                  {barber.isOnDuty ? 'On Duty Today' : 'Off Duty'}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-black uppercase tracking-wider text-[#1C1A18] bg-[#F7F3EE] px-4 py-2 rounded-full border border-[#E4DBD0]">
              Mirror Station
            </span>
          </div>
        </div>

        {/* Right Column (Next Up & Full Live Queue Side-by-Side Cards) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
          {/* Up Next For You Card */}
          <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-3.5 animate-fade-in-scale stagger-2">
            <div className="flex items-center justify-between pb-2 mb-1">
              <h3 className="text-xs font-black text-[#1C1A18] uppercase tracking-wider flex items-center gap-2">
                <Icon icon="solar:user-bold" className="w-4 h-4 text-[#1C1A18]" />
                <span>Next Specific Request For You</span>
              </h3>
              <span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-2.5 py-0.5 rounded-full border border-[#C2B4A3]">
                Priority
              </span>
            </div>

            {nextForYou ? (
              <div
                onClick={() => setSelectedProfileToken(nextForYou)}
                className="p-4 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center justify-between cursor-pointer hover:border-[#1C1A18] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-3 py-1 rounded-full shrink-0">
                    {nextForYou.tokenNumber}
                  </span>
                  <Avatar
                    src={nextForYou.avatar}
                    name={nextForYou.customerName}
                    size="w-8 h-8 text-[11px]"
                    className="border border-[#C2B4A3] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#1C1A18] truncate">
                      {nextForYou.customerName}
                    </p>
                    <p className="text-[10px] text-[#4A4540] truncate">
                      {(nextForYou.services || []).map((s) => s.name).join(', ')}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-[#1C1A18] bg-[#FFFFFF] px-3 py-1 rounded-full border border-[#E4DBD0] shrink-0">
                  ~{nextForYou.totalDuration}m
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-[24px] bg-[#F7F3EE]/50 border border-dashed border-[#E4DBD0] text-center">
                <p className="text-xs text-[#4A4540] font-bold">No direct booking ahead</p>
                <p className="text-[10px] text-[#4A4540]/70 mt-0.5">Calling will select next 'Any Stylist' client</p>
              </div>
            )}
          </div>

          {/* Full Salon Waiting Queue List */}
          <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-3.5 animate-fade-in-scale stagger-4">
            <div className="flex items-center justify-between pb-2 mb-1">
              <h3 className="text-xs font-black text-[#1C1A18] uppercase tracking-wider flex items-center gap-2">
                <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-[#1C1A18]" />
                <span>Live Salon Queue ({allWaiting.length})</span>
              </h3>
              <span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-2.5 py-0.5 rounded-full border border-[#C2B4A3]">
                FCFS
              </span>
            </div>

            {loading ? (
              <StylistTableSkeleton count={4} />
            ) : allWaiting.length === 0 ? (
              <div className="py-8 text-center text-[#4A4540]">
                <Icon icon="solar:check-circle-bold" className="w-8 h-8 text-[#1C1A18] mx-auto mb-1.5" />
                <p className="text-xs font-bold">No clients currently waiting</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {allWaiting.map((token, index) => {
                  const isPrefCurrent = token.preferredBarber === barber._id || token.preferredBarberName === barber.name;
                  return (
                    <div
                      key={token._id}
                      onClick={() => setSelectedProfileToken(token)}
                      className={`p-3 rounded-full border flex items-center justify-between text-xs cursor-pointer transition-all px-4 ${
                        isPrefCurrent
                          ? 'border-[#1C1A18] bg-[#E4DBD0]/50'
                          : 'border-[#E4DBD0] bg-[#FFFFFF] hover:border-[#1C1A18]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-2.5 py-0.5 rounded-full shrink-0">
                          {token.tokenNumber}
                        </span>
                        <Avatar
                          src={token.avatar}
                          name={token.customerName}
                          size="w-7 h-7 text-[10px]"
                          className="border border-[#C2B4A3] shrink-0"
                        />
                        <span className="font-bold text-[#1C1A18] truncate max-w-[110px]">
                          {token.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-[#4A4540]">
                          Pref: {token.preferredBarberName || 'Any'}
                        </span>
                        <span className="text-[10px] font-bold text-[#1C1A18] bg-[#F7F3EE] px-2 py-0.5 rounded-full border border-[#E4DBD0]">
                          ~{token.totalDuration}m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Profile Inspection Modal */}
      <CustomerProfileModal
        token={selectedProfileToken}
        isOpen={!!selectedProfileToken}
        onClose={() => setSelectedProfileToken(null)}
        isStaffView={true}
      />
    </div>
  );
}
