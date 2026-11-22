import React from 'react';
import { Icon } from '@iconify/react';
import CustomModal from './CustomModal';
import RealTimeTimeline from './RealTimeTimeline';
import Avatar from './Avatar';

export default function CustomerProfileModal({
  token,
  isOpen,
  onClose,
  isStaffView = false,
  onCancelSpot = null,
  onEditSpot = null
}) {
  if (!token) return null;

  const waitMins = token.joinedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(token.joinedAt).getTime()) / 60000))
    : 0;

  const maskPhone = (p) => {
    if (!p) return '';
    if (isStaffView) return p;
    return p.slice(0, 3) + '****' + p.slice(-3);
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Queue Spot Profile"
      subtitle={`Ticket ${token.tokenNumber} • Élan Atelier`}
      icon="solar:user-bold"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Token Header Pill Banner */}
        <div className="p-4 rounded-[28px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={token.avatar} name={token.customerName} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#F7F3EE] bg-[#1C1A18] px-2.5 py-0.5 rounded-full">
                  {token.tokenNumber}
                </span>
                <h4 className="font-black text-sm text-[#1C1A18]">{token.customerName}</h4>
              </div>
              <p className="text-[11px] text-[#4A4540] flex items-center gap-1 mt-0.5">
                <Icon icon="solar:phone-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
                <span>{maskPhone(token.phone)}</span>
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
              token.status === 'In chair'
                ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                : token.status === 'Called'
                ? 'bg-[#E4DBD0] text-[#1C1A18] border-[#C2B4A3]'
                : 'bg-[#FFFFFF] text-[#1C1A18] border-[#E4DBD0]'
            }`}
          >
            {token.status}
          </span>
        </div>

        {/* Real-time Timeline if in chair */}
        {token.status === 'In chair' && (
          <RealTimeTimeline
            startedAt={token.startedAt}
            estimatedDuration={token.totalDuration || 30}
            status="In chair"
          />
        )}

        {/* Service Details Pill Card */}
        <div className="p-5 rounded-[28px] bg-[#FFFFFF] border border-[#E4DBD0] space-y-2.5">
          <h5 className="font-bold text-[#1C1A18] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1">
            <Icon icon="solar:scissors-bold" className="w-4 h-4 text-[#C2B4A3]" />
            <span>Selected Grooming Services</span>
          </h5>

          <div className="space-y-1.5">
            {(token.services || []).map((srv, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1 text-xs"
              >
                <span className="font-semibold text-[#1C1A18]">{srv.name}</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-[#4A4540]">{srv.duration} min</span>
                  <span className="font-bold text-[#1C1A18]">₹{srv.price}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2.5 font-black text-xs">
            <span className="text-[#1C1A18]">Total Amount</span>
            <div className="text-right">
              <span className="text-[#1C1A18] text-sm font-black">₹{token.totalPrice}</span>
              <span className="text-[10px] text-[#4A4540] ml-1.5 font-normal">
                ({token.totalDuration} min)
              </span>
            </div>
          </div>
        </div>

        {/* Stylist & Timing Info in Pill Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0]">
            <span className="text-[10px] uppercase font-bold text-[#4A4540]">Stylist Choice</span>
            <p className="font-black text-[#1C1A18] mt-0.5 truncate text-xs">
              {token.preferredBarberName || 'Any stylist'}
            </p>
          </div>

          <div className="p-3.5 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0]">
            <span className="text-[10px] uppercase font-bold text-[#4A4540]">Elapsed Wait</span>
            <p className="font-black text-[#1C1A18] mt-0.5 text-xs">
              {waitMins} min ago
            </p>
          </div>
        </div>

        {/* Staff Controls */}
        {isStaffView && (
          <div className="pt-2 flex items-center justify-end gap-2">
            {onEditSpot && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditSpot(token);
                }}
                className="px-4 py-2 rounded-full border border-[#E4DBD0] text-[#1C1A18] font-bold text-xs hover:bg-[#F7F3EE] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Icon icon="solar:pen-bold" className="w-3.5 h-3.5" />
                <span>Edit Guest</span>
              </button>
            )}
            {onCancelSpot && (
              <button
                type="button"
                onClick={() => onCancelSpot(token._id)}
                className="px-4 py-2 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-bold text-xs hover:bg-[#4A4540] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Icon icon="solar:trash-bin-trash-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
                <span>Cancel Spot</span>
              </button>
            )}
          </div>
        )}
      </div>
    </CustomModal>
  );
}
