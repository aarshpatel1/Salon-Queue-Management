import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import CustomModal from './CustomModal';
import CustomDropdown from './CustomDropdown';
import { useToast } from '../context/ToastContext';

export default function ServiceModal({ isOpen, onClose, onSaved, service = null, onDelete = null }) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(150);
  const [category, setCategory] = useState('Hair');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!service;

  useEffect(() => {
    if (service) {
      setName(service.name || '');
      setDuration(service.duration || 30);
      setPrice(service.price || 150);
      setCategory(service.category || 'Hair');
      setIsActive(service.isActive !== false);
    } else {
      setName('');
      setDuration(30);
      setPrice(150);
      setCategory('Hair');
      setIsActive(true);
    }
  }, [service, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Service name is required');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isEdit ? `/api/services/${service._id}` : '/api/services';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          name: name.trim(),
          duration: Number(duration),
          price: Number(price),
          category,
          isActive
        })
      });

      if (res.success) {
        addToast(isEdit ? 'Service updated successfully' : 'New service created', 'success');
        onSaved();
        onClose();
      } else {
        setError(res.message || 'Failed to save service');
      }
    } catch (err) {
      setError(err.message || 'Error saving service');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'Hair', label: 'Hair Styling & Cuts' },
    { value: 'Beard', label: 'Beard Sculpt & Shave' },
    { value: 'Spa', label: 'Spa & Scalp Therapy' },
    { value: 'Facial', label: 'Facial & Skin Care' }
  ];

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Service' : 'Add New Service'}
      subtitle="Studio Service Menu Configuration"
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

        <div>
          <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
            Service Title *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royal Hair Cut & Scalp Treatment"
            className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="240"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
              Price (INR ₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18]"
            />
          </div>
        </div>

        <CustomDropdown
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />

        <div className="flex items-center gap-2.5 pt-1 pl-2">
          <input
            type="checkbox"
            id="serviceActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-[#1C1A18] rounded"
          />
          <label htmlFor="serviceActive" className="text-xs font-bold text-[#1C1A18] cursor-pointer">
            Active on Client Booking Menu
          </label>
        </div>

        <div className="pt-2 flex items-center justify-between gap-2.5">
          {isEdit && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(service);
              }}
              className="px-4 py-2.5 rounded-full bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Icon icon="solar:trash-bin-trash-bold" className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
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
              className="px-6 py-2.5 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-black text-xs hover:bg-[#4A4540] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? (
                <Icon icon="solar:refresh-bold" className="w-4 h-4 animate-spin" />
              ) : (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-[#C2B4A3]" />
              )}
              <span>{isEdit ? 'Save Changes' : 'Create Service'}</span>
            </button>
          </div>
        </div>
      </form>
    </CustomModal>
  );
}
