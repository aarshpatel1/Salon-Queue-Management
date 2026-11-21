import React, { useState, useEffect } from 'react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import ServiceModal from '../components/ServiceModal';
import {
  Settings,
  Scissors,
  Users,
  Clock,
  TrendingUp,
  Shield,
  Upload,
  Plus,
  Edit2,
  Power,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminSettings() {
  const { lastSyncTime } = useSocket();

  const [adminData, setAdminData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Settings form states
  const [salonName, setSalonName] = useState('');
  const [closingTime, setClosingTime] = useState('21:00');
  const [cutoffMins, setCutoffMins] = useState(30);
  const [staffPin, setStaffPin] = useState('1234');
  const [bannerImage, setBannerImage] = useState('');

  const fetchAdminData = async () => {
    try {
      const [admRes, srvRes] = await Promise.all([
        apiRequest('/api/admin/data'),
        apiRequest('/api/services?includeInactive=true')
      ]);

      if (admRes.success) {
        setAdminData(admRes);
        const cfg = admRes.config;
        if (cfg) {
          setSalonName(cfg.salonName || 'Branja Barber Studio');
          setClosingTime(cfg.closingTime || '21:00');
          setCutoffMins(cfg.onlineJoiningCutoffMinutes || 30);
          setStaffPin(cfg.staffPin || '1234');
          setBannerImage(cfg.bannerImage || '');
        }
      }

      if (srvRes.success) {
        setServices(srvRes.services || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [lastSyncTime]);

  // Master Queue Toggle (Open / Closed)
  const handleToggleMasterQueue = async () => {
    try {
      await apiRequest('/api/admin/toggle-queue', { method: 'POST' });
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to toggle queue');
    }
  };

  // Toggle Barber On-Duty Today
  const handleToggleDuty = async (barberId) => {
    try {
      await apiRequest('/api/barbers/toggle-duty', {
        method: 'POST',
        body: JSON.stringify({ barberId })
      });
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to toggle duty');
    }
  };

  // Toggle Service Active/Inactive
  const handleToggleServiceActive = async (serviceId) => {
    try {
      await apiRequest(`/api/services/${serviceId}/toggle-active`, { method: 'PATCH' });
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to toggle service status');
    }
  };

  // Save General Salon Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          salonName,
          closingTime,
          onlineJoiningCutoffMinutes: cutoffMins,
          staffPin,
          bannerImage
        })
      });
      alert('Salon settings saved successfully!');
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setUpdating(false);
    }
  };

  // Cloudinary Banner Image Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiRequest('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });

      if (res.success && res.url) {
        setBannerImage(res.url);
        // Also immediately save to config
        await apiRequest('/api/admin/settings', {
          method: 'POST',
          body: JSON.stringify({ bannerImage: res.url })
        });
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to upload image to Cloudinary');
    } finally {
      setUploadingImage(false);
    }
  };

  const kpis = adminData?.kpis;
  const config = adminData?.config;
  const barbers = adminData?.barbers || [];
  const isMasterOpen = config?.isMasterQueueOpen !== false;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Master Queue Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Owner Management & KPIs
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Salon Configurations · Service Menu · Staff Control
            </p>
          </div>
        </div>

        {/* Master Queue Switch: Open / Closed */}
        <div className="flex items-center gap-3 bg-purple-50/70 p-2 rounded-2xl border border-purple-100">
          <span className="text-xs font-bold text-gray-700 ml-2">Master Queue:</span>
          <button
            onClick={handleToggleMasterQueue}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isMasterOpen
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-red-600 text-white shadow-red-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isMasterOpen ? 'Open (Online Joining On)' : 'Closed (Online Joining Off)'}</span>
          </button>
        </div>
      </div>

      {/* Today's KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Customers served */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Today
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900">{kpis?.customersServed ?? 0}</h3>
            <p className="text-xs text-gray-500 font-medium">Customers Served</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              ₹{kpis?.todayRevenue ?? 0} revenue earned
            </p>
          </div>
        </div>

        {/* KPI 2: Average wait */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
              FCFS Avg
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900">{kpis?.averageWaitMinutes ?? 0}m</h3>
            <p className="text-xs text-gray-500 font-medium">Average Customer Wait</p>
            <p className="text-[11px] text-purple-600 font-medium mt-1">
              {kpis?.waitingNow ?? 0} clients currently in line
            </p>
          </div>
        </div>

        {/* KPI 3: No-shows & Cancelled */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              Dropouts
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900">{kpis?.noShows ?? 0}</h3>
            <p className="text-xs text-gray-500 font-medium">No-shows Today</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {kpis?.cancelled ?? 0} cancellations
            </p>
          </div>
        </div>

        {/* KPI 4: Active employees */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Scissors className="w-5 h-5 -rotate-45" />
            </span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Roster
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900">{kpis?.activeEmployees ?? 0}</h3>
            <p className="text-xs text-gray-500 font-medium">Active Stylists Today</p>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              Total {barbers.length} stylists registered
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Service Manager & Staff On Duty */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Service Manager */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-50 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-600 -rotate-45" />
                <span>Service Manager</span>
              </h2>
              <p className="text-xs text-gray-500">Edit, add, or toggle active salon services</p>
            </div>
            <button
              onClick={() => {
                setServiceToEdit(null);
                setServiceModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {services.map((service) => (
              <div
                key={service._id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  service.isActive
                    ? 'border-gray-100 bg-[#faf9fe]'
                    : 'border-gray-200 bg-gray-50/70 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{service.name}</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {service.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {service.duration} mins · ₹{service.price}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Edit button */}
                  <button
                    onClick={() => {
                      setServiceToEdit(service);
                      setServiceModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-purple-100 hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Active toggle button */}
                  <button
                    onClick={() => handleToggleServiceActive(service._id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                      service.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-200 text-gray-600 border-gray-300'
                    }`}
                  >
                    {service.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Barbers on duty today toggles */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
          <div className="border-b border-purple-50 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Barbers On Duty Today</span>
            </h2>
            <p className="text-xs text-gray-500">Toggle active roster for queue distribution</p>
          </div>

          <div className="space-y-3">
            {barbers.map((barber) => (
              <div
                key={barber._id}
                className="p-3.5 rounded-2xl border border-gray-100 bg-[#faf9fe] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={barber.avatar}
                    alt={barber.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{barber.name}</p>
                    <p className="text-[10px] text-gray-500">{barber.status}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleDuty(barber._id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    barber.isOnDuty
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {barber.isOnDuty ? 'On Duty' : 'Off Duty'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salon General Configurations & Cloudinary Image Upload */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-5">
        <div className="border-b border-purple-50 pb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Salon Defaults & Cloudinary Branding</span>
          </h2>
          <p className="text-xs text-gray-500">
            Configure default closing time, online joining cutoff, and staff PIN
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Salon Name</label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Closing Time (24h)
            </label>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">Default 21:00 (9:00 PM)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Online Cutoff Minutes Prior
            </label>
            <input
              type="number"
              value={cutoffMins}
              onChange={(e) => setCutoffMins(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">Default 30m (Closes at 8:30 PM)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Staff 4-Digit PIN
            </label>
            <input
              type="text"
              maxLength={4}
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold"
            />
            <p className="text-[10px] text-gray-400 mt-1">Default: 1234</p>
          </div>

          {/* Cloudinary Banner Upload */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Studio Banner Image (Cloudinary CDN)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="Cloudinary image URL"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs truncate"
              />
              <label className="px-4 py-2 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="md:col-span-3 pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-700 hover:bg-purple-800 text-white shadow-md cursor-pointer"
            >
              {updating ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Service Modal */}
      <ServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSaved={() => fetchAdminData()}
        serviceToEdit={serviceToEdit}
      />
    </div>
  );
}
