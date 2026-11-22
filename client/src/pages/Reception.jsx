import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import WalkInModal from '../components/WalkInModal';
import CustomerProfileModal from '../components/CustomerProfileModal';
import EditCustomerModal from '../components/EditCustomerModal';
import RealTimeTimeline from '../components/RealTimeTimeline';
import Avatar from '../components/Avatar';
import CustomModal from '../components/CustomModal';

export default function Reception() {
  const { lastSyncTime } = useSocket();
  const { addToast } = useToast();
  const [waitingList, setWaitingList] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

  // Start Service / Seat Guest for a barber station
  const handleStartService = async (tokenId, customerName) => {
    setActionLoading(`start-${tokenId}`);
    try {
      const res = await apiRequest('/api/queue/start-service', {
        method: 'POST',
        body: JSON.stringify({ tokenId })
      });
      if (res.success) {
        addToast(`Seated ${customerName}. Live session started.`, 'success');
        fetchReceptionData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to seat guest', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Complete Service (Done) for a barber station
  const handleCompleteService = async (tokenId, customerName) => {
    setActionLoading(`complete-${tokenId}`);
    try {
      const res = await apiRequest('/api/queue/complete-service', {
        method: 'POST',
        body: JSON.stringify({ tokenId })
      });
      if (res.success) {
        addToast(`Service concluded for ${customerName}. Chair is now available!`, 'success');
        fetchReceptionData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete service', 'error');
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

  // Delete token permanently from queue
  const handleDeleteToken = (tokenId, customerName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Guest',
      message: `Permanently remove ${customerName} from the queue?`,
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
        setActionLoading(`delete-${tokenId}`);
        try {
          const res = await apiRequest(`/api/queue/token/${tokenId}`, {
            method: 'DELETE'
          });
          if (res.success) {
            addToast(`Removed ${customerName} from queue`, 'info');
            fetchReceptionData();
          }
        } catch (err) {
          addToast(err.message || 'Failed to remove guest', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Drag and Drop Handlers for Queue Rearranging
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    const sourceIndex = draggedIndex;
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (sourceIndex === null || sourceIndex === dropIndex) return;

    const reordered = [...waitingList];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setWaitingList(reordered);

    try {
      const orderedTokenIds = reordered.map((t) => t._id);
      await apiRequest('/api/queue/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderedTokenIds })
      });
      addToast('Queue order updated', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save queue rearrangement', 'error');
      fetchReceptionData();
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getElapsedWaitMinutes = (joinedAt) => {
    if (!joinedAt) return 0;
    const diffMs = Date.now() - new Date(joinedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1">
      {/* Top Header Capsule Bar for Reception */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] p-5 md:p-6 rounded-[32px] border border-[#E4DBD0] shadow-xs animate-fade-in-scale stagger-1">
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
        <div className="lg:col-span-7 space-y-4 animate-fade-in-up stagger-2">
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
              const hasCustomer = !!(currentCust && currentCust.tokenId);
              const isBreak = barber.status === 'On break';
              const isServing = hasCustomer && !!currentCust.startedAt;
              const isCalled = hasCustomer && !currentCust.startedAt;

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
                      <Avatar
                        src={barber.avatar}
                        name={barber.name}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-[#1C1A18] truncate">{barber.name}</p>
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded-full inline-block border ${
                            isServing
                              ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                              : isCalled
                              ? 'bg-[#E4DBD0] text-[#1C1A18] border-[#C2B4A3]'
                              : barber.status === 'Available'
                              ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                              : 'bg-[#F7F3EE] text-[#4A4540] border-[#E4DBD0]'
                          }`}
                        >
                          {isServing ? 'In Chair' : isCalled ? 'Called' : barber.status}
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
                          <span className="text-[11px] font-bold text-[#1C1A18] truncate max-w-[100px]">
                            {currentCust.customerName}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#4A4540] truncate">
                          {currentCust.services?.join(', ') || 'Grooming session'}
                        </p>

                        {/* If Called (awaiting arrival/seating in chair) */}
                        {isCalled && (
                          <div className="pt-1.5 space-y-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4DBD0] text-[#1C1A18] text-[10px] font-black border border-[#C2B4A3]">
                              <span className="w-2 h-2 rounded-full bg-[#1C1A18] animate-ping shrink-0" />
                              <span className="truncate">Client Called • Walking to Chair</span>
                            </div>

                            <div className="flex gap-1.5 pt-0.5">
                              <button
                                onClick={() => handleStartService(currentCust.tokenId, currentCust.customerName)}
                                disabled={actionLoading === `start-${currentCust.tokenId}`}
                                className="flex-1 py-1.5 px-2 rounded-full text-[10px] font-black bg-[#1C1A18] text-[#F7F3EE] hover:bg-[#4A4540] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Icon icon="solar:play-circle-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
                                <span>{actionLoading === `start-${currentCust.tokenId}` ? 'Starting...' : 'Seat Guest'}</span>
                              </button>
                              <button
                                onClick={() => handleMarkNoShow(currentCust.tokenId, currentCust.customerName)}
                                disabled={actionLoading === `noshow-${currentCust.tokenId}`}
                                className="py-1.5 px-2.5 rounded-full text-[10px] font-bold bg-[#FFFFFF] border border-[#E4DBD0] text-[#4A4540] hover:text-[#ef4444] transition-colors cursor-pointer"
                              >
                                No-Show
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If In Chair (Service Active) */}
                        {isServing && (
                          <div className="pt-1 space-y-2">
                            <RealTimeTimeline
                              startedAt={currentCust.startedAt}
                              estimatedDuration={currentCust.estimatedDuration || 30}
                              status="In chair"
                              compact={true}
                            />
                            <button
                              onClick={() => handleCompleteService(currentCust.tokenId, currentCust.customerName)}
                              disabled={actionLoading === `complete-${currentCust.tokenId}`}
                              className="w-full py-1.5 rounded-full text-[10px] font-black bg-[#1C1A18] text-[#F7F3EE] hover:bg-[#4A4540] transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                            >
                              <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
                              <span>{actionLoading === `complete-${currentCust.tokenId}` ? 'Completing...' : 'Complete (Done)'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-5 rounded-[24px] bg-[#F7F3EE]/40 border border-dashed border-[#E4DBD0] text-center mb-3">
                        <p className="text-xs text-[#4A4540] font-bold">Chair is empty</p>
                        <p className="text-[10px] text-[#4A4540]/60 mt-0.5">Ready for next guest</p>
                      </div>
                    )}
                  </div>

                  {/* Call Next Pill Button - Only shown when chair is empty */}
                  {!hasCustomer && (
                    <button
                      onClick={() => handleCallNext(barber._id, barber.name)}
                      disabled={isBreak || actionLoading === `call-${barber._id}`}
                      className="w-full py-2.5 rounded-full text-xs font-bold bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Icon icon="solar:phone-calling-rounded-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
                      <span>
                        {actionLoading === `call-${barber._id}` ? 'Calling...' : 'Call Next Client'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ordered Waiting Queue (Pill Shapes & Drag-and-Drop) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-[36px] p-6 border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
                <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-[#1C1A18]" />
                <span>Live Waiting Queue ({waitingList.length})</span>
              </h2>
              <p className="text-[11px] text-[#4A4540]">
                Drag & drop to rearrange • Click to view • Edit & manage
              </p>
            </div>
            <span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3 py-1 rounded-full border border-[#C2B4A3]">
              Drag & Reorder
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
                const isDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={item._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedToken(item)}
                    className={`p-3 rounded-full border transition-all cursor-pointer flex items-center justify-between px-3.5 select-none ${
                      isDragged
                        ? 'opacity-40 scale-95 border-dashed border-[#1C1A18]'
                        : isDragOver
                        ? 'border-[#1C1A18] bg-[#F7F3EE] scale-[1.02] shadow-sm'
                        : isCalled
                        ? 'border-[#1C1A18] bg-[#E4DBD0] shadow-xs'
                        : isOver60
                        ? 'border-[#C2B4A3] bg-[#F7F3EE]'
                        : 'border-[#E4DBD0] bg-[#FFFFFF] hover:border-[#1C1A18]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Drag Handle Grip Icon */}
                      <span
                        title="Drag to rearrange position"
                        className="cursor-grab active:cursor-grabbing p-1 text-[#C2B4A3] hover:text-[#1C1A18] shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon icon="solar:reorder-bold" className="w-4 h-4" />
                      </span>

                      {/* Customer Avatar */}
                      <Avatar src={item.avatar} name={item.customerName} size="sm" />

                      {/* Token Number */}
                      <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-2.5 py-0.5 rounded-full shrink-0">
                        {item.tokenNumber}
                      </span>

                      {/* Customer Info */}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#1C1A18] truncate">
                          {item.customerName}
                        </p>
                        <p className="text-[10px] text-[#4A4540] truncate">
                          Pref: {item.preferredBarberName || 'Any'}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Edit, Delete, No-Show, Cancel */}
                    <div
                      className="flex items-center gap-1.5 shrink-0 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingToken(item)}
                        title="Edit Customer"
                        className="w-7 h-7 rounded-full bg-[#F7F3EE] hover:bg-[#E4DBD0] border border-[#E4DBD0] text-[#1C1A18] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Icon icon="solar:pen-bold" className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteToken(item._id, item.customerName)}
                        title="Remove from Queue"
                        className="w-7 h-7 rounded-full bg-[#F7F3EE] hover:bg-[#ef4444]/20 border border-[#E4DBD0] text-[#4A4540] hover:text-[#ef4444] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="w-3.5 h-3.5" />
                      </button>

                      {isCalled ? (
                        <button
                          type="button"
                          onClick={() => handleMarkNoShow(item._id, item.customerName)}
                          disabled={actionLoading === `noshow-${item._id}`}
                          className="px-3 py-1 rounded-full text-[10px] font-bold text-[#F7F3EE] bg-[#1C1A18] hover:bg-[#4A4540] transition-colors cursor-pointer"
                        >
                          No-show
                        </button>
                      ) : (
                        <button
                          type="button"
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
        onEditSpot={(tok) => setEditingToken(tok)}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={!!editingToken}
        onClose={() => setEditingToken(null)}
        token={editingToken}
        onUpdated={() => fetchReceptionData()}
        barbers={barbers}
        services={services}
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
