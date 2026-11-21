import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import WalkInModal from '../components/WalkInModal';
import CustomerProfileModal from '../components/CustomerProfileModal';
import RealTimeTimeline from '../components/RealTimeTimeline';
import CustomModal from '../components/CustomModal';

export default function Reception() {
  const { lastSyncTime } = useSocket();
  const { addToast } = useToast();
  const [waitingList, setWaitingList] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  // Custom Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const fetchReceptionData = async () => {
    try {
      const recData = await apiRequest('/api/queue/reception-data').catch(async () => {
        const summary = await apiRequest('/api/queue/summary');
        return {
          success: true,
          waitingList: summary.waitingTokens || summary.upNext || [],
          barbers: summary.barbers || []
        };
      });

      const servData = await apiRequest('/api/services').catch(() => ({ success: false }));

      if (recData && recData.success) {
        setWaitingList(recData.waitingList || []);
        setBarbers(recData.barbers || []);
      }
      if (servData && servData.success) {
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
  const handleCallNext = async (barberId, barberName) => {
    setActionLoading(`call-${barberId}`);
    try {
      const res = await apiRequest('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ barberId })
      });
      if (res.success) {
        addToast(`Called next guest for ${barberName}`, 'success');
        fetchReceptionData();
      }
    } catch (err) {
      addToast(err.message || 'Could not call next guest', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Mark No-Show for a called token
  const handleMarkNoShow = (tokenId, customerName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm No-Show',
      message: `Mark ${customerName} as No-Show? This releases the stylist station.`,
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
        setActionLoading(`noshow-${tokenId}`);
        try {
          const res = await apiRequest('/api/queue/no-show', {
            method: 'POST',
            body: JSON.stringify({ tokenId })
          });
          if (res.success) {
            addToast('Guest marked as No-show', 'warning');
            fetchReceptionData();
          }
        } catch (err) {
          addToast(err.message || 'Failed to mark no-show', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Cancel token from waiting list (Reception staff action)
  const handleCancel = (tokenId, customerName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Cancellation',
      message: `Cancel ${customerName} from the waiting queue?`,
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
        setActionLoading(`cancel-${tokenId}`);
        try {
          const res = await apiRequest(`/api/queue/cancel/${tokenId}`, {
            method: 'POST'
          });
          if (res.success) {
            addToast('Waiting spot cancelled', 'info');
            fetchReceptionData();
          }
        } catch (err) {
          addToast(err.message || 'Failed to cancel', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const getElapsedWaitMinutes = (joinedAt) => {
    if (!joinedAt) return 0;
    const diffMs = Date.now() - new Date(joinedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1">
      {/* Top Header Capsule Bar for Reception */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] p-5 md:p-6 rounded-[32px] border border-[#E4DBD0] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shadow-md">
            <Icon icon="solar:calendar-bold" className="w-6 h-6 text-[#C2B4A3]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#1C1A18] tracking-tight">
              Reception Console
            </h1>
            <p className="text-xs text-[#4A4540] font-medium">
              Front Desk Management • Staff PIN Authenticated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWalkInModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs text-[#F7F3EE] bg-[#1C1A18] hover:bg-[#4A4540] transition-all shadow-md cursor-pointer"
          >
            <Icon icon="solar:user-plus-bold" className="w-4 h-4 text-[#C2B4A3]" />
            <span>+ Add Walk-in Guest</span>
          </button>
        </div>
      </div>

      {/* Main Tablet Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stylist Stations (with Real-Time Timelines in Pills) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
              <Icon icon="solar:scissors-bold" className="w-5 h-5 text-[#4A4540]" />
              <span>Stylist Stations ({barbers.length})</span>
            </h2>
            <span className="text-xs text-[#4A4540] font-semibold">Live Real-Time Chairs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {barbers.map((barber) => {
              const currentCust = barber.currentCustomer;
              const hasCustomer = currentCust && currentCust.tokenId;
              const isBreak = barber.status === 'On break';
              const isServing = hasCustomer && currentCust.startedAt;

              return (
                <div
                  key={barber._id}
                  className={`bg-[#FFFFFF] rounded-[32px] p-4.5 border transition-all flex flex-col justify-between shadow-xs ${
                    hasCustomer
                      ? 'border-[#1C1A18] shadow-sm'
                      : isBreak
                      ? 'border-[#E4DBD0] bg-[#F7F3EE]/50'
                      : 'border-[#E4DBD0]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#C2B4A3]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-[#1C1A18] truncate">{barber.name}</p>
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
                    </div>

                    {/* Current Customer or Empty Chair in Capsule */}
                    {hasCustomer ? (
                      <div className="p-3.5 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#1C1A18] bg-white px-2.5 py-0.5 rounded-full border border-[#E4DBD0]">
                            {currentCust.tokenNumber}
                          </span>
                          <span className="text-[11px] font-bold text-[#1C1A18] truncate max-w-[90px]">
                            {currentCust.customerName}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#4A4540] truncate">
                          {currentCust.services?.join(', ') || 'Grooming session'}
                        </p>

                        {/* Real-Time Live Timeline for In-Chair Guest */}
                        <div className="pt-1">
                          <RealTimeTimeline
                            startedAt={currentCust.startedAt || new Date()}
                            estimatedDuration={currentCust.estimatedDuration || 30}
                            status="In chair"
                            compact={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-[24px] bg-[#F7F3EE]/40 border border-dashed border-[#E4DBD0] text-center mb-3">
                        <p className="text-xs text-[#4A4540] font-bold">Chair is empty</p>
                        <p className="text-[10px] text-[#4A4540]/60 mt-0.5">Ready for next guest</p>
                      </div>
                    )}
                  </div>

                  {/* Call Next Pill Button */}
                  <button
                    onClick={() => handleCallNext(barber._id, barber.name)}
                    disabled={isBreak || hasCustomer || actionLoading === `call-${barber._id}`}
                    className="w-full py-2.5 rounded-full text-xs font-bold bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Icon icon="solar:phone-calling-rounded-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
                    <span>
                      {actionLoading === `call-${barber._id}` ? 'Calling...' : 'Call Next Client'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ordered Waiting Queue (Pill Shapes) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4DBD0] pb-3">
            <div>
              <h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
                <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-[#1C1A18]" />
                <span>Live Waiting Queue ({waitingList.length})</span>
              </h2>
              <p className="text-[11px] text-[#4A4540]">
                Click any profile pill to inspect (Self-removal disabled)
              </p>
            </div>
            <span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3 py-1 rounded-full border border-[#C2B4A3]">
              FCFS Live
            </span>
          </div>

          {waitingList.length === 0 ? (
            <div className="py-12 text-center text-[#4A4540]">
              <Icon icon="solar:check-circle-bold" className="w-10 h-10 text-[#1C1A18] mx-auto mb-2" />
              <p className="text-xs font-bold">Queue is clear! No guests waiting.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
              {waitingList.map((item, index) => {
                const waitMins = getElapsedWaitMinutes(item.joinedAt);
                const isOver60 = waitMins > 60;
                const isCalled = item.status === 'Called';

                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedToken(item)}
                    className={`p-3.5 rounded-full border transition-all cursor-pointer flex items-center justify-between px-4 ${
                      isCalled
                        ? 'border-[#1C1A18] bg-[#E4DBD0] shadow-xs'
                        : isOver60
                        ? 'border-[#C2B4A3] bg-[#F7F3EE]'
                        : 'border-[#E4DBD0] bg-[#FFFFFF] hover:border-[#1C1A18]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-2.5 py-0.5 rounded-full shrink-0">
                        {item.tokenNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#1C1A18] truncate">
                          {item.customerName}
                        </p>
                        <p className="text-[10px] text-[#4A4540] truncate">
                          Pref: {item.preferredBarberName || 'Any'}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isCalled ? (
                        <button
                          onClick={() => handleMarkNoShow(item._id, item.customerName)}
                          disabled={actionLoading === `noshow-${item._id}`}
                          className="px-3 py-1 rounded-full text-[10px] font-bold text-[#F7F3EE] bg-[#1C1A18] hover:bg-[#4A4540] transition-colors cursor-pointer"
                        >
                          No-show
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCancel(item._id, item.customerName)}
                          disabled={actionLoading === `cancel-${item._id}`}
                          className="px-3 py-1 rounded-full text-[10px] font-bold text-[#1C1A18] bg-[#E4DBD0] hover:bg-[#C2B4A3] border border-[#C2B4A3] transition-colors cursor-pointer"
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

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        token={selectedToken}
        isOpen={!!selectedToken}
        onClose={() => setSelectedToken(null)}
        isStaffView={true}
        onCancelSpot={(id) => {
          setSelectedToken(null);
          handleCancel(id, selectedToken?.customerName);
        }}
      />

      {/* Add Walk-in Modal */}
      <WalkInModal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        onWalkInAdded={() => fetchReceptionData()}
        barbers={barbers}
        services={services}
      />

      {/* Custom Confirmation Modal */}
      <CustomModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
        title={confirmDialog.title}
        subtitle="Staff Action Required"
        icon="solar:danger-triangle-bold"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#1C1A18] text-sm leading-relaxed font-medium">
            {confirmDialog.message}
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
              className="px-5 py-2.5 rounded-full border border-[#E4DBD0] text-[#1C1A18] font-bold text-xs hover:bg-[#F7F3EE] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDialog.onConfirm}
              className="px-5 py-2.5 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-bold text-xs hover:bg-[#4A4540] transition-colors cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
