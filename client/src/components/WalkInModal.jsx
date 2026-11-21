import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import CustomModal from './CustomModal';
import CustomDropdown from './CustomDropdown';
import { useToast } from '../context/ToastContext';

export default function WalkInModal({ isOpen, onClose, onWalkInAdded, barbers = [], services = [] }) {
  const { addToast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredBarberId, setPreferredBarberId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && services.length > 0 && selectedServiceIds.length === 0) {
      setSelectedServiceIds([services[0]._id]);
    }
  }, [isOpen, services]);

  if (!isOpen) return null;

  const handleToggleService = (id) => {
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length === 1) return;
      setSelectedServiceIds((prev) => prev.filter((sId) => sId !== id));
    } else {
      if (selectedServiceIds.length >= 3) return;
      setSelectedServiceIds((prev) => [...prev, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Valid 10-digit phone number is required');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError('Please select at least 1 service');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/queue/walk-in', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: cleanPhone,
          serviceIds: selectedServiceIds,
          preferredBarberId: preferredBarberId || null,
          isWalkIn: true
        })
      });

      if (res.success) {
        addToast(`Walk-in added: ${res.token.customerName} (${res.token.tokenNumber})`, 'success');
        onWalkInAdded(res.token);
        onClose();
        setCustomerName('');
        setPhone('');
      } else {
        setError(res.message || 'Failed to add walk-in');
      }
    } catch (err) {
      setError(err.message || 'Error creating walk-in entry');
    } finally {
      setSubmitting(false);
    }
  };

  const barberOptions = [
    { value: '', label: 'Any Stylist (Fastest Available)' },
    ...barbers.map((b) => ({
      value: b._id,
      label: `${b.name} (${b.status})`
    }))
  ];

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Walk-in Customer"
      subtitle="Reception Quick Check-in (24/7 Active)"
      icon="solar:user-plus-bold"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-bold flex items-center gap-2 px-5">
            <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Name */}
        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Customer Name *
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Liam Patel"
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Phone Number (10 digits) *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
        </div>

        {/* Services Multi-Select in Pills */}
        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Select Services (Max 3)
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
            {services.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv._id);
              return (
                <div
                  key={srv._id}
                  onClick={() => handleToggleService(srv._id)}
                  className={`p-3 rounded-full border flex items-center justify-between cursor-pointer transition-all px-4 ${
                    isSelected
                      ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                      : 'bg-[#F7F3EE] text-[#1C1A18] border-[#E4DBD0] hover:border-[#C2B4A3]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      icon={isSelected ? 'solar:check-circle-bold' : 'solar:circle-linear'}
                      className={`w-4 h-4 ${isSelected ? 'text-[#C2B4A3]' : 'text-[#4A4540]'}`}
                    />
                    <span className="font-bold text-xs">{srv.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={isSelected ? 'text-[#C2B4A3]' : 'text-[#4A4540]'}>
                      {srv.duration}m
                    </span>
                    <span className={`font-black ${isSelected ? 'text-[#F7F3EE]' : 'text-[#1C1A18]'}`}>
                      ₹{srv.price}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preferred Stylist */}
        <CustomDropdown
          label="Preferred Stylist"
          options={barberOptions}
          value={preferredBarberId}
          onChange={setPreferredBarberId}
        />

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-black text-xs hover:bg-[#4A4540] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {submitting ? (
              <Icon icon="solar:refresh-bold" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon icon="solar:user-plus-bold" className="w-4 h-4 text-[#C2B4A3]" />
            )}
            <span>{submitting ? 'Adding Walk-in...' : 'Confirm Walk-in Spot'}</span>
          </button>
        </div>
      </form>
    </CustomModal>
  );
}
