import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import CustomModal from './CustomModal';
import CustomDropdown from './CustomDropdown';
import Avatar from './Avatar';
import { useToast } from '../context/ToastContext';

export default function EditCustomerModal({
  isOpen,
  onClose,
  token,
  onUpdated,
  barbers = [],
  services = []
}) {
  const { addToast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredBarberId, setPreferredBarberId] = useState('');
  const [status, setStatus] = useState('Waiting');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      setCustomerName(token.customerName || '');
      setPhone(token.phone || '');
      setAvatar(token.avatar || '');
      setSelectedServiceIds(
        token.services?.map((s) => s.serviceId?._id || s.serviceId || s._id).filter(Boolean) || []
      );
      setPreferredBarberId(token.preferredBarber?._id || token.preferredBarber || '');
      setStatus(token.status || 'Waiting');
      setError('');
    }
  }, [token, isOpen]);

  if (!isOpen || !token) return null;

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
      setError('Select at least 1 service');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest(`/api/queue/token/${token._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: cleanPhone,
          avatar: (avatar || '').trim(),
          serviceIds: selectedServiceIds,
          preferredBarberId: preferredBarberId || null,
          status
        })
      });

      if (res.success) {
        addToast(`Ticket #${token.tokenNumber} updated successfully`, 'success');
        onUpdated(res.token);
        onClose();
      } else {
        setError(res.message || 'Failed to update queue token');
      }
    } catch (err) {
      setError(err.message || 'Error updating queue customer');
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

  const statusOptions = [
    { value: 'Waiting', label: 'Waiting in line' },
    { value: 'Called', label: 'Called (heading to chair)' },
    { value: 'In chair', label: 'In chair (active grooming)' },
    { value: 'Done', label: 'Done (completed)' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'No-show', label: 'No-show' }
  ];

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Guest • ${token.tokenNumber}`}
      subtitle="Staff Queue Management & Customer Details"
      icon="solar:pen-bold"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-bold flex items-center gap-2 px-5">
            <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Avatar Preview & Upload */}
        <div className="p-3 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center gap-3">
          <Avatar src={avatar} name={customerName || 'Guest'} size="lg" />
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
              Optional photo. Placeholder initials are used if blank.
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
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
        </div>

        {/* 10-Digit Phone */}
        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Mobile Number (10 digits) *
          </label>
          <input
            type="tel"
            required
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
        </div>

        {/* Services Multi-Select */}
        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Booked Services (Max 3)
          </label>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
            {services.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv._id);
              return (
                <div
                  key={srv._id}
                  onClick={() => handleToggleService(srv._id)}
                  className={`p-2.5 rounded-full border flex items-center justify-between cursor-pointer transition-all px-4 ${
                    isSelected
                      ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                      : 'bg-[#F7F3EE] text-[#1C1A18] border-[#E4DBD0] hover:border-[#C2B4A3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      icon={isSelected ? 'solar:check-circle-bold' : 'solar:circle-linear'}
                      className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C2B4A3]' : 'text-[#4A4540]'}`}
                    />
                    <span className="font-bold text-xs">{srv.name}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-[#F7F3EE]' : 'text-[#1C1A18]'}`}>
                    ₹{srv.price}
                  </span>
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

        {/* Status Dropdown */}
        <CustomDropdown
          label="Queue Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-full border border-[#E4DBD0] text-[#1C1A18] font-bold text-xs hover:bg-[#F7F3EE] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-black text-xs hover:bg-[#4A4540] transition-colors cursor-pointer shadow-md"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}
