import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

export default function JoinQueue() {
  const navigate = useNavigate();
  const { lastSyncTime } = useSocket();
  const { addToast } = useToast();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredBarberId, setPreferredBarberId] = useState('');

  // Data State
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load initial services & barbers
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [servicesRes, barbersRes, summaryRes] = await Promise.all([
          apiRequest('/api/services'),
          apiRequest('/api/barbers'),
          apiRequest('/api/queue/summary')
        ]);

        if (servicesRes.success) setServices(servicesRes.services || []);
        if (barbersRes.success) setBarbers(barbersRes.barbers || []);
        if (summaryRes.success) {
          setSummaryData(summaryRes);
          if (servicesRes.services?.length > 0 && selectedServiceIds.length === 0) {
            setSelectedServiceIds([servicesRes.services[0]._id]);
          }
        }
      } catch (err) {
        console.error('Failed to load queue join data:', err);
        setError('Failed to load services. Please check connection.');
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [lastSyncTime]);

  const isOnlineAllowed = summaryData?.isOnlineJoiningAllowed !== false;
  const joiningNotice = summaryData?.joiningNotice;

  // Toggle service selection (min 1, max 3)
  const handleToggleService = (id) => {
    if (selectedServiceIds.includes(id)) {
      if (selectedServiceIds.length === 1) {
        setError('At least 1 service must be selected');
        return;
      }
      setSelectedServiceIds((prev) => prev.filter((sId) => sId !== id));
      setError('');
    } else {
      if (selectedServiceIds.length >= 3) {
        setError('Maximum 3 services can be selected per visit');
        return;
      }
      setSelectedServiceIds((prev) => [...prev, id]);
      setError('');
    }
  };

  // Calculations for summary card
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s._id));
  const totalMinutes = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const activeBarbersCount = barbers.filter((b) => b.isOnDuty && b.status !== 'On break').length;
  const queueMinutesAhead = summaryData?.waitStats?.totalMinutesAhead || 0;
  const estimatedWait = activeBarbersCount > 0 ? Math.round(queueMinutesAhead / activeBarbersCount) : 0;

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError('Please choose at least 1 service');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        phone: cleanPhone,
        serviceIds: selectedServiceIds,
        preferredBarberId: preferredBarberId || null,
        isWalkIn: false
      };

      const res = await apiRequest('/api/queue/join', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.token) {
        localStorage.setItem('elan_active_token_id', res.token._id);
        window.dispatchEvent(new Event('elan_token_updated'));

        addToast(
          res.alreadyActive
            ? 'Active ticket found. Welcome back!'
            : `Spot ${res.token.tokenNumber} reserved! Queue tracking activated.`,
          'success'
        );

        navigate(`/status/${res.token._id}`);
      } else {
        setError(res.message || 'Could not join queue');
      }
    } catch (err) {
      setError(err.message || 'Failed to join queue. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-2 px-2 md:px-4 max-w-6xl mx-auto select-none space-y-6">
      {/* Top Navigation Pill & Status Badge */}
      <div className="flex items-center justify-between">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#1C1A18] bg-[#FFFFFF] hover:bg-[#E4DBD0] px-4 py-2 rounded-full transition-all border border-[#E4DBD0] shadow-xs"
        >
          <Icon icon="solar:arrow-left-linear" className="w-4 h-4 text-[#4A4540]" />
          <span>Dashboard</span>
        </NavLink>

        <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1A18] bg-[#E4DBD0] px-3.5 py-1.5 rounded-full border border-[#C2B4A3]">
          Self Check-In
        </span>
      </div>

      {/* Header Capsule Banner */}
      <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shrink-0 shadow-md">
            <Icon icon="solar:scissors-bold" className="w-6 h-6 -rotate-45 text-[#C2B4A3]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#1C1A18] tracking-tight">
              Join the Queue
            </h1>
            <p className="text-xs text-[#4A4540] font-medium mt-0.5">
              Élan Atelier • Live Salon Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#1C1A18] bg-[#F7F3EE] px-4 py-1.5 rounded-full border border-[#E4DBD0]">
            ~{estimatedWait}m wait ahead
          </span>
          <span className="text-xs font-bold text-[#4A4540] bg-[#F7F3EE] px-4 py-1.5 rounded-full border border-[#E4DBD0]">
            {activeBarbersCount} Stylists On Duty
          </span>
        </div>
      </div>

      {/* Notice if Online Queue is Closed */}
      {!isOnlineAllowed && (
        <div className="p-4 rounded-full bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] flex items-center gap-3 px-6 shadow-md">
          <Icon icon="solar:danger-triangle-bold" className="w-5 h-5 text-[#C2B4A3] shrink-0" />
          <p className="text-xs font-semibold">
            {joiningNotice || 'Online queue entry is closed. Walk-ins are accepted at reception.'}
          </p>
        </div>
      )}

      {/* Responsive Layout for Laptop/Desktop (2-Column Grid) and Mobile (Stacked) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column (Form Inputs: Steps 1, 2, 3) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Information in Pill Card */}
          <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#E4DBD0] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#1C1A18] text-[#F7F3EE] text-[11px] font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1C1A18]">
                Your Information
              </h2>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isOnlineAllowed || submitting}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Aryan Shah"
                  className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-medium text-[#1C1A18] placeholder-[#4A4540]/50 focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  disabled={!isOnlineAllowed || submitting}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-medium text-[#1C1A18] placeholder-[#4A4540]/50 focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all shadow-inner"
                />
                <p className="text-[10px] text-[#4A4540] mt-1 pl-3 font-medium">
                  One spot per phone number. Used to restore your active ticket.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Select Services in Pill Card */}
          <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4DBD0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#1C1A18] text-[#F7F3EE] text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-xs font-black uppercase tracking-wider text-[#1C1A18]">
                  Select Services (Max 3)
                </h2>
              </div>
              <span className="text-[10px] font-bold bg-[#E4DBD0] text-[#1C1A18] px-3 py-1 rounded-full border border-[#C2B4A3]">
                {selectedServiceIds.length} / 3 Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {services.map((service) => {
                const isSelected = selectedServiceIds.includes(service._id);
                return (
                  <div
                    key={service._id}
                    onClick={() => isOnlineAllowed && handleToggleService(service._id)}
                    className={`p-4 rounded-[24px] border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18] shadow-md transform -translate-y-0.5'
                        : 'bg-[#F7F3EE] text-[#1C1A18] border-[#E4DBD0] hover:border-[#C2B4A3]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#F7F3EE] border-[#F7F3EE] text-[#1C1A18]'
                            : 'border-[#C2B4A3] bg-white'
                        }`}
                      >
                        {isSelected && <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">{service.name}</p>
                        <p className={`text-[10px] ${isSelected ? 'text-[#C2B4A3]' : 'text-[#4A4540]'}`}>
                          {service.duration} mins • {service.category}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-black shrink-0 ml-2 ${isSelected ? 'text-[#F7F3EE]' : 'text-[#1C1A18]'}`}>
                      ₹{service.price}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Preferred Stylist in Pill Card */}
          <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#E4DBD0] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#1C1A18] text-[#F7F3EE] text-[11px] font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1C1A18]">
                Stylist Preference
              </h2>
            </div>

            {/* Any Stylist Option Pill */}
            <label
              className={`p-4 rounded-full border flex items-center justify-between cursor-pointer transition-all ${
                preferredBarberId === ''
                  ? 'border-[#1C1A18] bg-[#1C1A18] text-[#F7F3EE] shadow-md'
                  : 'border-[#E4DBD0] hover:border-[#C2B4A3] bg-[#F7F3EE]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center font-bold text-xs">
                  <Icon icon="solar:bolt-bold" className="w-4 h-4 text-[#1C1A18]" />
                </div>
                <div>
                  <p className="text-xs font-bold">Any Available Stylist (Fastest)</p>
                  <p className={`text-[10px] ${preferredBarberId === '' ? 'text-[#C2B4A3]' : 'text-[#4A4540]'}`}>
                    Earliest opening chair takes your ticket
                  </p>
                </div>
              </div>
              <input
                type="radio"
                name="barber"
                value=""
                checked={preferredBarberId === ''}
                onChange={() => setPreferredBarberId('')}
                className="accent-[#1C1A18] w-4 h-4 mr-2"
              />
            </label>

            {/* Individual Stylists Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {barbers.map((barber) => {
                const isOnBreak = barber.status === 'On break';
                const isSelected = preferredBarberId === barber._id;

                return (
                  <label
                    key={barber._id}
                    className={`p-3 rounded-full border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#1C1A18] bg-[#1C1A18] text-[#F7F3EE] shadow-md'
                        : 'border-[#E4DBD0] hover:border-[#C2B4A3] bg-[#F7F3EE]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 ml-1">
                      <img
                        src={barber.avatar}
                        alt={barber.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#C2B4A3] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{barber.name}</p>
                        <span
                          className={`text-[9px] font-semibold ${
                            isSelected
                              ? 'text-[#C2B4A3]'
                              : isOnBreak
                              ? 'text-[#4A4540]'
                              : 'text-[#1C1A18]'
                          }`}
                        >
                          {barber.status}
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="barber"
                      value={barber._id}
                      checked={isSelected}
                      onChange={() => setPreferredBarberId(barber._id)}
                      className="accent-[#1C1A18] w-4 h-4 shrink-0 mr-2"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Sticky Floating Dynamic Island Summary on Laptop Screen) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
          <div className="bg-[#1C1A18] text-[#F7F3EE] rounded-[36px] p-6 md:p-7 border border-[#4A4540] shadow-2xl space-y-5">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-[#4A4540]/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#F7F3EE]">
                  Live Ticket Preview
                </h3>
              </div>
              <span className="text-[10px] bg-[#4A4540] text-[#E4DBD0] px-3 py-1 rounded-full font-bold">
                Smart Island
              </span>
            </div>

            {/* Ticket Preview Details in Pill Container */}
            <div className="p-4 rounded-[28px] bg-[#4A4540]/30 border border-[#4A4540]/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C2B4A3]">Guest Name</span>
                <span className="font-bold text-[#F7F3EE]">{customerName.trim() || '—'}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C2B4A3]">Services Selected</span>
                <span className="font-bold text-[#F7F3EE] text-right max-w-[160px] truncate">
                  {selectedServices.map((s) => s.name).join(', ') || 'None'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C2B4A3]">Total Duration</span>
                <span className="font-bold text-[#F7F3EE]">{totalMinutes} mins</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C2B4A3]">Estimated Wait</span>
                <span className="font-bold text-[#E4DBD0]">~{estimatedWait} mins ahead</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#4A4540]/40 text-sm font-black">
                <span className="text-[#C2B4A3]">Total Payable</span>
                <span className="text-base text-[#F7F3EE]">₹{totalPrice}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] text-xs font-bold flex items-center gap-2 px-5">
                <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Big Action Pill Button */}
            <button
              type="submit"
              disabled={!isOnlineAllowed || submitting}
              className="w-full py-4 rounded-full bg-[#F7F3EE] hover:bg-[#E4DBD0] text-[#1C1A18] font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg transform hover:-translate-y-0.5 active:scale-98"
            >
              {submitting ? (
                <Icon icon="solar:refresh-bold" className="w-5 h-5 animate-spin" />
              ) : (
                <Icon icon="solar:ticket-bold" className="w-5 h-5 text-[#1C1A18]" />
              )}
              <span>{submitting ? 'Confirming Spot...' : 'Confirm & Enter Island Queue'}</span>
            </button>

            <p className="text-[10px] text-[#C2B4A3] text-center leading-relaxed">
              Once submitted, your live queue status bar will monitor your wait time in real-time.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
