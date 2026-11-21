import React, { useState, useEffect } from 'react';
import apiRequest from '../api/apiClient';
import { X, Scissors, Plus, Check } from 'lucide-react';

export default function ServiceModal({ isOpen, onClose, onSaved, serviceToEdit }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(150);
  const [category, setCategory] = useState('Hair');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name || '');
      setDuration(serviceToEdit.duration || 30);
      setPrice(serviceToEdit.price || 150);
      setCategory(serviceToEdit.category || 'Hair');
    } else {
      setName('');
      setDuration(30);
      setPrice(150);
      setCategory('Hair');
    }
    setError('');
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Service name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (serviceToEdit) {
        await apiRequest(`/api/services/${serviceToEdit._id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: name.trim(), duration, price, category })
        });
      } else {
        await apiRequest('/api/services', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), duration, price, category })
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-purple-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {serviceToEdit ? 'Edit Service' : 'Add New Service'}
          </h3>
        </div>

        {error && <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-600 text-xs">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Service Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skin Fade"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                required
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹ INR)</label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
            >
              <option value="Hair">Hair</option>
              <option value="Beard">Beard</option>
              <option value="Spa">Spa & Treatment</option>
              <option value="Grooming">Facial Grooming</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
