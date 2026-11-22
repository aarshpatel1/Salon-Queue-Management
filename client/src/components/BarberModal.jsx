import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import CustomModal from './CustomModal';
import Avatar from './Avatar';
import { useToast } from '../context/ToastContext';

export default function BarberModal({ isOpen, onClose, onSaved, barber = null }) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Senior Stylist');
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!barber;

  useEffect(() => {
    if (barber) {
      setName(barber.name || '');
      setSpecialty(barber.specialty || 'Senior Stylist');
      setAvatar(barber.avatar || '');
      setIsOnDuty(barber.isOnDuty !== false);
      setError('');
    } else {
      setName('');
      setSpecialty('Senior Stylist');
      setAvatar('');
      setIsOnDuty(true);
      setError('');
    }
  }, [barber, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiRequest('/api/barbers/upload-avatar', {
        method: 'POST',
        body: formData
      });
      if (res.success && res.url) {
        setAvatar(res.url);
        addToast('Stylist photo uploaded successfully!', 'success');
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAvatar(evt.target.result);
        addToast('Stylist photo attached!', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Stylist name is required');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isEdit ? `/api/barbers/${barber._id}` : '/api/barbers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          name: name.trim(),
          specialty: (specialty || 'Senior Stylist').trim(),
          avatar: (avatar || '').trim(),
          isOnDuty
        })
      });

      if (res.success) {
        addToast(isEdit ? 'Stylist updated successfully' : 'New stylist registered', 'success');
        onSaved();
        onClose();
      } else {
        setError(res.message || 'Failed to save stylist');
      }
    } catch (err) {
      setError(err.message || 'Error saving stylist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Stylist • ${barber.name}` : 'Add New Stylist'}
      subtitle="Staff & Barber Management"
      icon="solar:scissors-bold"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-bold flex items-center gap-2 px-5">
            <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Avatar Upload & Initials Placeholder Preview */}
        <div className="p-3.5 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center gap-3.5">
          <Avatar src={avatar} name={name || 'Stylist'} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
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
                  Use Initials
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#4A4540] mt-1">
              Image is optional. If left blank, first and last name initials placeholder is used.
            </p>
          </div>
        </div>

        {/* Barber Name */}
        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Leo Vance"
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Styling Specialty *
          </label>
          <input
            type="text"
            required
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="e.g. Master Barber, Senior Stylist, Fade Specialist"
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
        </div>

        {/* On Duty Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] px-5">
          <div>
            <p className="text-xs font-black text-[#1C1A18]">On Duty Today</p>
            <p className="text-[10px] text-[#4A4540]">Enable to assign guests in queue</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOnDuty(!isOnDuty)}
            className={`px-4 py-1.5 rounded-full text-xs font-black border transition-colors cursor-pointer ${
              isOnDuty
                ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                : 'bg-white text-[#4A4540] border-[#E4DBD0]'
            }`}
          >
            {isOnDuty ? 'On Duty' : 'Off Duty'}
          </button>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#E4DBD0] text-[#1C1A18] font-bold text-xs hover:bg-[#F7F3EE] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-black text-xs hover:bg-[#4A4540] transition-colors cursor-pointer shadow-md"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Stylist'}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}
