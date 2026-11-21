import React, { useState, useEffect } from 'react';
import apiRequest from '../api/apiClient';
import { X, UserPlus, Scissors, Sparkles } from 'lucide-react';

export default function WalkInModal({ isOpen, onClose, onWalkInAdded, barbers, services }) {
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
      setSelectedServiceIds(prev => prev.filter(sId => sId !== id));
    } else {
      if (selectedServiceIds.length >= 3) return;
      setSelectedServiceIds(prev => [...prev, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Name is required');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Valid 10-digit phone required');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError('Select at least 1 service');
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
        onWalkInAdded(res.token);
        onClose();
      } else {
        setError(res.message || 'Failed to add walk-in');
      }
    } catch (err) {
      setError(err.message || 'Error creating walk-in entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-purple-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Add Walk-in Customer</h3>
            <p className="text-xs text-gray-500">Reception Quick Entry (Allowed 24/7)</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Client"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">10-Digit Phone</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Services (1 - 3)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {services.map((s) => {
                const isSelected = selectedServiceIds.includes(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => handleToggleService(s._id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-gray-200 hover:border-purple-300 text-gray-700'
                    }`}
                  >
                    <p className="truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-500 font-normal">₹{s.price} · {s.duration}m</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Barber</label>
            <select
              value={preferredBarberId}
              onChange={(e) => setPreferredBarberId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="">Any barber (fastest)</option>
              {barbers.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.status})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md cursor-pointer"
            >
              {submitting ? 'Adding...' : 'Issue Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
