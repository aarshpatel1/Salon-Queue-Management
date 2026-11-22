import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import CustomModal from './CustomModal';
import CustomDropdown from './CustomDropdown';
import Avatar from './Avatar';
import { useToast } from '../context/ToastContext';

export default function WalkInModal({ isOpen, onClose, onWalkInAdded, barbers = [], services = [] }) {
  const { addToast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiRequest('/api/queue/upload-avatar', {
        method: 'POST',
        body: formData
      });
      if (res.success && res.url) {
        setAvatar(res.url);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (evt) => setAvatar(evt.target.result);
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
    }
  };

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

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('A valid 10-digit mobile number is required');
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
          avatar: (avatar || '').trim(),
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
        setAvatar('');
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

        {/* Optional Photo / Avatar upload with Initials fallback */}
        <div className="p-3 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center gap-3">
          <Avatar src={avatar} name={customerName || 'Walk In'} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <label className="px-3.5 py-1.5 rounded-full bg-[#1C1A18] text-[#F7F3EE] hover:bg-[#4A4540] text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                <Icon icon="solar:camera-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
                <span>{uploadingAvatar ? 'Uploading...' : avatar ? 'Change Photo' : 'Upload Photo (Optional)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="px-2.5 py-1.5 rounded-full bg-white border border-[#E4DBD0] text-[#ef4444] text-[11px] font-bold hover:bg-[#F7F3EE] cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#4A4540] mt-1">
              Optional. If omitted, initials placeholder is used.
            </p>
          </div>
        </div>

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
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="e.g. 9876543210"
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
          <p className="text-[10px] text-[#4A4540] mt-1 pl-3 font-medium">
            Must be exactly 10 digits.
          </p>
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
