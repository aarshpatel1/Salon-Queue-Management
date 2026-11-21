import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import {
  Scissors,
  Check,
  User,
  Phone,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Coffee,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';

export default function JoinQueue() {
  const navigate = useNavigate();
  const { lastSyncTime } = useSocket();

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

        if (servicesRes.success) setServices(servicesRes.services);
        if (barbersRes.success) setBarbers(barbersRes.barbers);
        if (summaryRes.success) {
          setSummaryData(summaryRes);
          // Auto select first service if available
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
      setSelectedServiceIds(prev => prev.filter(sId => sId !== id));
      setError('');
    } else {
      if (selectedServiceIds.length >= 3) {
        setError('Maximum 3 services can be selected per visit');
        return;
      }
      setSelectedServiceIds(prev => [...prev, id]);
      setError('');
    }
  };

  // Calculations for live summary card
  const selectedServices = services.filter(s => selectedServiceIds.includes(s._id));
  const totalMinutes = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Active barbers count for wait calculation
  const activeBarbersCount = barbers.filter(b => b.isOnDuty && b.status !== 'On break').length;
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

      if (res.success) {
        // If customer already has an active token, redirects there
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
    <div className="min-h-screen bg-[#f8f6fc] py-6 px-4 md:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-between">
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Studio</span>
          </NavLink>

          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100/60 px-2.5 py-1 rounded-full">
            Mobile Queue Registration
          </span>
        </div>

        {/* Studio Card Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-amber-300 -rotate-45" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Join the Live Queue</h1>
              <p className="text-xs text-purple-200">Branja Barber Studio</p>
            </div>
          </div>
          <p className="text-xs text-purple-200/90 mt-2">
            No physical waiting needed! Get your live token, monitor your position, and walk in right when called.
          </p>
        </div>

        {/* Queue Closed / Cutoff Warning */}
        {!isOnlineAllowed && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Online Joining Closed</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {joiningNotice || 'Online queue closes at 8:30 PM (30 minutes before salon closes at 9:00 PM).'}
              </p>
              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                Walk-ins are still accepted directly at the reception tablet.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Customer Details */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <span>Your Details</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Karan Mehta"
                    disabled={!isOnlineAllowed}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 rounded-xl text-sm border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    disabled={!isOnlineAllowed}
                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50/50 rounded-xl text-sm border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Used exclusively to look up your active spot and send real-time alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Active Services Selection (Min 1, Max 3) */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-600 -rotate-45" />
                <span>Select Services</span>
              </h3>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {selectedServiceIds.length}/3 Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {services.map((service) => {
                const isSelected = selectedServiceIds.includes(service._id);
                return (
                  <button
                    key={service._id}
                    type="button"
                    disabled={!isOnlineAllowed}
                    onClick={() => handleToggleService(service._id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-600'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-gray-900">{service.name}</span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-purple-600 text-white' : 'border border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 text-gray-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-purple-600" />
                        {service.duration} min
                      </span>
                      <span className="font-bold text-gray-900">₹{service.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Barber Selector */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Choose Stylist</span>
            </h3>

            <div className="space-y-2">
              {/* Option 1: Any Barber (Fastest) */}
              <label
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  preferredBarberId === ''
                    ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600'
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    ⚡
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Any barber (fastest)</p>
                    <p className="text-[11px] text-gray-500">
                      Assigned to the first available stylist
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="barber"
                  value=""
                  checked={preferredBarberId === ''}
                  onChange={() => setPreferredBarberId('')}
                  className="accent-purple-600 w-4 h-4"
                />
              </label>

              {/* Individual Barber Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {barbers.map((barber) => {
                  const isOnBreak = barber.status === 'On break';
                  const isSelected = preferredBarberId === barber._id;

                  return (
                    <label
                      key={barber._id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600'
                          : isOnBreak
                          ? 'border-amber-200 bg-amber-50/30'
                          : 'border-gray-200 hover:border-purple-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={barber.avatar}
                          alt={barber.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {barber.name}
                          </p>
                          {isOnBreak ? (
                            <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                              <Coffee className="w-3 h-3" />
                              {barber.name} is on break
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              ● {barber.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <input
                        type="radio"
                        name="barber"
                        value={barber._id}
                        checked={isSelected}
                        onChange={() => setPreferredBarberId(barber._id)}
                        className="accent-purple-600 w-4 h-4 shrink-0 ml-2"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Live Summary Card */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-wider text-purple-300">
              Live Queue Estimate
            </h4>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 text-center">
              <div>
                <p className="text-xl font-bold">{totalMinutes}m</p>
                <p className="text-[10px] text-purple-200">Service Duration</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-300">₹{totalPrice}</p>
                <p className="text-[10px] text-purple-200">Total Price</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-300">~{estimatedWait}m</p>
                <p className="text-[10px] text-purple-200">Est. Wait</p>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              disabled={submitting || !isOnlineAllowed}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-gray-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-amber-200 shadow-xl shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <span>Confirming Spot...</span>
              ) : (
                <>
                  <span>Confirm & Join Queue</span>
                  <ArrowRight className="w-4 h-4 text-gray-950" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
