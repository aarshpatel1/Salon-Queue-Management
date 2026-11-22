import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import apiRequest from '../api/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import ServiceModal from '../components/ServiceModal';

export default function AdminSettings() {
  const { lastSyncTime } = useSocket();
  const { addToast } = useToast();

  const [adminData, setAdminData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Settings form states
  const [salonName, setSalonName] = useState('Élan Atelier');
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
          setSalonName(cfg.salonName || 'Élan Atelier');
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
      addToast('Master queue switch updated', 'info');
      fetchAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to toggle queue', 'error');
    }
  };

  // Toggle Barber On-Duty Today
  const handleToggleDuty = async (barberId) => {
    try {
      await apiRequest('/api/barbers/toggle-duty', {
        method: 'POST',
        body: JSON.stringify({ barberId })
      });
      addToast('Stylist duty roster updated', 'info');
      fetchAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to toggle duty', 'error');
    }
  };

  // Toggle Service Active/Inactive
  const handleToggleServiceActive = async (serviceId) => {
    try {
      await apiRequest(`/api/services/${serviceId}/toggle-active`, { method: 'PATCH' });
      addToast('Service visibility toggled', 'info');
      fetchAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to toggle service status', 'error');
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
      addToast('Salon studio settings saved successfully!', 'success');
      fetchAdminData();
    } catch (err) {
      addToast(err.message || 'Failed to save settings', 'error');
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
        await apiRequest('/api/admin/settings', {
          method: 'POST',
          body: JSON.stringify({ bannerImage: res.url })
        });
        addToast('Studio image uploaded to Cloudinary!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const kpis = adminData?.kpis;
  const config = adminData?.config;
  const barbers = adminData?.barbers || [];
  const isMasterOpen = config?.isMasterQueueOpen !== false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none py-1">
      {/* Top Header Capsule Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] p-5 md:p-6 rounded-[32px] border border-[#E4DBD0] shadow-xs animate-fade-in-scale stagger-1">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center shadow-md">
            <Icon icon="solar:settings-bold" className="w-6 h-6 text-[#C2B4A3]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#1C1A18] tracking-tight">
              Owner Management & Studio KPIs
            </h1>
            <p className="text-xs text-[#4A4540] font-medium">
              Studio Configuration • Service Menu • Stylist Control
            </p>
          </div>
        </div>

        {/* Master Queue Switch: Open / Closed in Pill */}
        <div className="flex items-center gap-3 bg-[#F7F3EE] p-2 rounded-full border border-[#E4DBD0] px-3">
          <span className="text-xs font-bold text-[#1C1A18] ml-2">Master Switch:</span>
          <button
            onClick={handleToggleMasterQueue}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs ${
              isMasterOpen
                ? 'bg-[#1C1A18] text-[#F7F3EE]'
                : 'bg-[#4A4540] text-[#E4DBD0]'
            }`}
          >
            <Icon icon="solar:power-bold" className="w-4 h-4 text-[#C2B4A3]" />
            <span>{isMasterOpen ? 'Queue Open (Online On)' : 'Queue Closed (Online Off)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards in Pill Shapes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-2">
        {/* KPI 1 */}
        <div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
              <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3 py-1 rounded-full border border-[#C2B4A3]">
              Today
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-[#1C1A18]">{kpis?.customersServed ?? 0}</h3>
            <p className="text-xs text-[#4A4540] font-semibold">Customers Served</p>
            <p className="text-[11px] text-[#1C1A18] font-bold mt-1">
              ₹{kpis?.todayRevenue ?? 0} Revenue Generated
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
              <Icon icon="solar:clock-circle-bold" className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-black text-[#4A4540] bg-[#F7F3EE] px-3 py-1 rounded-full border border-[#E4DBD0]">
              FCFS Avg
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-[#1C1A18]">{kpis?.averageWaitMinutes ?? 0}m</h3>
            <p className="text-xs text-[#4A4540] font-semibold">Average Wait Time</p>
            <p className="text-[11px] text-[#4A4540] font-semibold mt-1">
              {kpis?.waitingNow ?? 0} clients currently in line
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
              <Icon icon="solar:danger-triangle-bold" className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-black text-[#4A4540] bg-[#F7F3EE] px-3 py-1 rounded-full border border-[#E4DBD0]">
              Dropouts
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-[#1C1A18]">{kpis?.noShows ?? 0}</h3>
            <p className="text-xs text-[#4A4540] font-semibold">No-shows Today</p>
            <p className="text-[11px] text-[#4A4540] mt-1">
              {kpis?.cancelled ?? 0} Cancellations
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#FFFFFF] p-5 rounded-[28px] border border-[#E4DBD0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="w-10 h-10 rounded-full bg-[#F7F3EE] text-[#1C1A18] flex items-center justify-center border border-[#E4DBD0]">
              <Icon icon="solar:scissors-bold" className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3 py-1 rounded-full border border-[#C2B4A3]">
              Roster
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-[#1C1A18]">{kpis?.activeEmployees ?? 0}</h3>
            <p className="text-xs text-[#4A4540] font-semibold">Active Stylists Today</p>
            <p className="text-[11px] text-[#1C1A18] font-bold mt-1">
              Total {barbers.length} Stylists Registered
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Service Manager & Staff On Duty */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Service Manager */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-[36px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between border-b border-[#E4DBD0] pb-3">
            <div>
              <h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
                <Icon icon="solar:scissors-bold" className="w-5 h-5 text-[#4A4540]" />
                <span>Service Menu Manager</span>
              </h2>
              <p className="text-xs text-[#4A4540]">Edit, add, or toggle active salon services</p>
            </div>
            <button
              onClick={() => {
                setServiceToEdit(null);
                setServiceModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] cursor-pointer shadow-xs"
            >
              <Icon icon="solar:add-circle-bold" className="w-4 h-4 text-[#C2B4A3]" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {services.map((service) => (
              <div
                key={service._id}
                className={`p-4 rounded-full border flex items-center justify-between transition-all px-5 ${
                  service.isActive
                    ? 'border-[#E4DBD0] bg-[#FFFFFF]'
                    : 'border-[#E4DBD0] bg-[#F7F3EE]/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1C1A18]">{service.name}</span>
                    <span className="text-[9px] font-black text-[#1C1A18] bg-[#E4DBD0] px-2.5 py-0.5 rounded-full border border-[#C2B4A3]">
                      {service.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A4540] mt-0.5">
                    {service.duration} mins • ₹{service.price}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setServiceToEdit(service);
                      setServiceModalOpen(true);
                    }}
                    className="w-8 h-8 rounded-full bg-[#F7F3EE] hover:bg-[#E4DBD0] border border-[#E4DBD0] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Edit service"
                  >
                    <Icon icon="solar:pen-bold" className="w-4 h-4 text-[#1C1A18]" />
                  </button>

                  <button
                    onClick={() => handleToggleServiceActive(service._id)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-black border transition-colors cursor-pointer ${
                      service.isActive
                        ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                        : 'bg-[#F7F3EE] text-[#4A4540] border-[#E4DBD0]'
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
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-[36px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs space-y-4 animate-fade-in-up stagger-4">
          <div className="border-b border-[#E4DBD0] pb-3">
            <h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
              <Icon icon="solar:users-group-rounded-bold" className="w-5 h-5 text-[#4A4540]" />
              <span>Stylists On Duty Today</span>
            </h2>
            <p className="text-xs text-[#4A4540]">Toggle active roster for queue distribution</p>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {barbers.map((barber) => (
              <div
                key={barber._id}
                className="p-3.5 rounded-full border border-[#E4DBD0] bg-[#FFFFFF] flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={barber.avatar}
                    alt={barber.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#C2B4A3] shrink-0"
                  />
                  <div>
                    <p className="text-xs font-black text-[#1C1A18]">{barber.name}</p>
                    <p className="text-[10px] text-[#4A4540]">{barber.status}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleDuty(barber._id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black border transition-all cursor-pointer ${
                    barber.isOnDuty
                      ? 'bg-[#1C1A18] text-[#F7F3EE] border-[#1C1A18]'
                      : 'bg-[#F7F3EE] text-[#4A4540] border-[#E4DBD0]'
                  }`}
                >
                  {barber.isOnDuty ? 'On Duty' : 'Off Duty'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Salon General Configurations & Cloudinary Image Upload in Pill Card */}
      <div className="bg-[#FFFFFF] rounded-[36px] p-6 md:p-8 border border-[#E4DBD0] shadow-xs space-y-5 animate-fade-in-up stagger-5">
        <div className="border-b border-[#E4DBD0] pb-3">
          <h2 className="text-base font-black text-[#1C1A18] flex items-center gap-2">
            <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-[#4A4540]" />
            <span>Salon Branding & Queue Defaults</span>
          </h2>
          <p className="text-xs text-[#4A4540]">
            Configure default closing time, online joining cutoff, and staff PIN
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
              Salon Name
            </label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-[#E4DBD0] bg-[#F7F3EE] text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
              Closing Time (24h)
            </label>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-[#E4DBD0] bg-[#F7F3EE] text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
              Online Cutoff (Mins before close)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              value={cutoffMins}
              onChange={(e) => setCutoffMins(Number(e.target.value))}
              className="w-full px-5 py-3 rounded-full border border-[#E4DBD0] bg-[#F7F3EE] text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
              Staff Security PIN (4 digits)
            </label>
            <input
              type="text"
              maxLength={4}
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-[#E4DBD0] bg-[#F7F3EE] text-xs font-bold text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-black text-[#4A4540] uppercase tracking-wider mb-1.5 pl-3">
              Banner Image URL (or upload via Cloudinary)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-5 py-3 rounded-full border border-[#E4DBD0] bg-[#F7F3EE] text-xs font-medium text-[#1C1A18] focus:outline-none focus:border-[#1C1A18] focus:bg-white transition-all"
              />
              <label className="px-6 py-3 rounded-full bg-[#1C1A18] text-[#F7F3EE] font-bold text-xs cursor-pointer hover:bg-[#4A4540] transition-colors flex items-center gap-2 shrink-0">
                <Icon icon="solar:upload-bold" className="w-4 h-4 text-[#C2B4A3]" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              disabled={updating}
              className="px-8 py-3.5 rounded-full bg-[#1C1A18] hover:bg-[#4A4540] text-[#F7F3EE] font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
            >
              {updating ? 'Saving Configuration...' : 'Save Studio Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Service Modal */}
      <ServiceModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSaved={fetchAdminData}
        service={serviceToEdit}
      />
    </div>
  );
}
