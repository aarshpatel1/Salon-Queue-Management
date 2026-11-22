import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';

export default function JoinQueue() {
  const navigate = useNavigate();
  const { lastSyncTime } = useSocket();
  const { addToast } = useToast();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [preferredBarberId, setPreferredBarberId] = useState('');

  // Data State
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [activeExistingToken, setActiveExistingToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingActive, setCancellingActive] = useState(false);
  const [error, setError] = useState('');

  // Load initial services & barbers & check existing active turn
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

        // Check active local token
        const storedTokenId = localStorage.getItem('elan_active_token_id');
        if (storedTokenId) {
          try {
            const stRes = await apiRequest(`/api/queue/status/${storedTokenId}`);
            if (stRes.success && stRes.token && ['Waiting', 'Called', 'In chair'].includes(stRes.token.status)) {
              setActiveExistingToken(stRes.token);
            } else {
              localStorage.removeItem('elan_active_token_id');
            }
          } catch {
            // ignore
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

  const handleCancelExistingTurn = async () => {
    if (!activeExistingToken?._id) return;
    setCancellingActive(true);
    try {
      await apiRequest(`/api/queue/cancel/${activeExistingToken._id}`, { method: 'POST' });
      localStorage.removeItem('elan_active_token_id');
      window.dispatchEvent(new Event('elan_token_updated'));
      setActiveExistingToken(null);
      addToast('Your previous spot has been cancelled. You can now enter the queue.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to cancel previous spot', 'error');
    } finally {
      setCancellingActive(false);
    }
  };

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
        addToast('Profile image uploaded!', 'success');
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAvatar(evt.target.result);
        addToast('Profile image attached!', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
    }
  };

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

    if (activeExistingToken) {
      setError(`You already have an active turn (Token #${activeExistingToken.tokenNumber}). You cannot join again until you cancel your current turn.`);
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
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
        avatar: (avatar || '').trim(),
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

        addToast(`Spot ${res.token.tokenNumber} reserved! Queue tracking activated.`, 'success');
        navigate(`/status/${res.token._id}`);
      } else if (res.alreadyActive && res.token) {
        setActiveExistingToken(res.token);
        setError(res.message || 'You already have an active turn in the queue. You cannot join again until you cancel your current turn.');
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
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1">
      {/* Top Navigation Pill & Status Badge */}
      <div className="flex items-center justify-between animate-fade-in-up stagger-1">
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
      <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-scale stagger-2">
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

      {/* Active Existing Turn Warning Banner */}
      {activeExistingToken && (
        <div className="p-5 rounded-[32px] bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar src={activeExistingToken.avatar} name={activeExistingToken.customerName} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-[#F7F3EE] text-[#1C1A18] px-2.5 py-0.5 rounded-full text-xs font-black">
                  {activeExistingToken.tokenNumber}
                </span>
                <span className="text-xs font-bold text-[#F7F3EE] truncate">
                  {activeExistingToken.customerName}
                </span>
                <span className="text-[10px] text-[#C2B4A3]">({activeExistingToken.status})</span>
              </div>
              <p className="text-xs text-[#C2B4A3] mt-1">
                You already have an active turn! You cannot join again until you cancel your current turn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/status/${activeExistingToken._id}`)}
              className="px-4 py-2 rounded-full bg-[#F7F3EE] text-[#1C1A18] font-bold text-xs hover:bg-[#E4DBD0] transition-colors cursor-pointer"
            >
              Track My Spot
            </button>
            <button
              type="button"
              disabled={cancellingActive}
              onClick={handleCancelExistingTurn}
              className="px-4 py-2 rounded-full bg-[#ef4444] text-white font-bold text-xs hover:bg-[#dc2626] transition-colors cursor-pointer"
            >
              {cancellingActive ? 'Cancelling...' : 'Cancel / Opt Out'}
            </button>
          </div>
        </div>
      )}

      {/* Notice if Online Queue is Closed */}
      {!isOnlineAllowed && (
        <div className="p-4 rounded-full bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] flex items-center gap-3 px-6 shadow-md animate-fade-in-up">
          <Icon icon="solar:danger-triangle-bold" className="w-5 h-5 text-[#C2B4A3] shrink-0" />
          <p className="text-xs font-semibold">
            {joiningNotice || 'Online queue entry is closed. Walk-ins are accepted at reception.'}
          </p>
        </div>
      )}

      {/* Responsive Layout for Laptop/Desktop (2-Column Grid) and Mobile (Stacked) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Form Inputs: Steps 1, 2, 3) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Information in Pill Card */}
          <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-2.5 pb-1">
              <span className="w-6 h-6 rounded-full bg-[#1C1A18] text-[#F7F3EE] text-[11px] font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1C1A18]">
                Your Information
              </h2>
            </div>

            {/* Optional Photo / Avatar Upload Preview */}
            <div className="p-4 rounded-[24px] bg-[#F7F3EE] border border-[#E4DBD0] flex items-center gap-4">
              <Avatar src={avatar} name={customerName || 'Guest'} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-4 py-2 rounded-full bg-[#1C1A18] text-[#F7F3EE] hover:bg-[#4A4540] text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
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
                      className="px-3.5 py-2 rounded-full bg-white border border-[#E4DBD0] text-[#ef4444] text-xs font-bold hover:bg-[#F7F3EE] transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#4A4540] mt-1 font-medium">
                  {avatar
                    ? 'Photo attached successfully'
                    : 'Image is optional. If left blank, your initials will appear automatically on your queue ticket.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isOnlineAllowed || submitting || !!activeExistingToken}
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
                  maxLength={10}
                  disabled={!isOnlineAllowed || submitting || !!activeExistingToken}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210"
                  className="w-full px-5 py-3 bg-[#F7F3EE] border border-[#E4DBD0] rounded-full text-xs font-medium text-[#1C1A18] placeholder-[#4A4540]/50 focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all shadow-inner"
                />
                <p className="text-[10px] text-[#4A4540] mt-1 pl-3 font-medium">
                  Exactly 10 digits required. One spot per number.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Select Services in Pill Card */}
          <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between pb-1">
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
                    onClick={() => isOnlineAllowed && !activeExistingToken && handleToggleService(service._id)}
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
          <div className="bg-[#FFFFFF] rounded-[32px] p-6 md:p-7 border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-5">
            <div className="flex items-center gap-2.5 pb-1">
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
                      <Avatar src={barber.avatar} name={barber.name} size="sm" />
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

        {/* Right Column (Sticky Summary on Laptop Screen) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
          <div className="bg-[#1C1A18] text-[#F7F3EE] rounded-[36px] p-6 md:p-7 border border-[#4A4540] shadow-2xl space-y-5 animate-fade-in-scale stagger-3">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#F7F3EE]">
                  Live Ticket Preview
                </h3>
              </div>
              <span className="text-[10px] bg-[#4A4540] text-[#E4DBD0] px-3 py-1 rounded-full font-bold">
                Live Ticket
              </span>
            </div>

            {/* Ticket Preview Details in Pill Container */}
            <div className="p-4 rounded-[28px] bg-[#4A4540]/30 border border-[#4A4540]/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C2B4A3]">Guest</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#F7F3EE]">{customerName.trim() || '—'}</span>
                  <Avatar src={avatar} name={customerName || 'Guest'} size="xs" />
                </div>
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
            {activeExistingToken ? (
              <button
                type="button"
                onClick={() => navigate(`/status/${activeExistingToken._id}`)}
                className="w-full py-4 rounded-full bg-[#F7F3EE] hover:bg-[#E4DBD0] text-[#1C1A18] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Icon icon="solar:ticket-bold" className="w-5 h-5 text-[#1C1A18]" />
                <span>Active Turn #{activeExistingToken.tokenNumber} Exists — View Status</span>
              </button>
            ) : (
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
                <span>{submitting ? 'Confirming Spot...' : 'Confirm & Join Live Queue'}</span>
              </button>
            )}

            <p className="text-[10px] text-[#C2B4A3] text-center leading-relaxed">
              Once submitted, your live queue status bar will monitor your wait time in real-time.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
