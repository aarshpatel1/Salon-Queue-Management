import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import PinModal from './PinModal';
import { Icon } from '@iconify/react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, openPinModal, pinModalOpen } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !pinModalOpen) {
      openPinModal(location.pathname);
    }
  }, [isAuthenticated, location.pathname, openPinModal, pinModalOpen]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-[#034c3c] text-[#f5f3ef] flex items-center justify-center mb-4 border border-[#c4b496]">
          <Icon icon="solar:lock-bold" className="w-7 h-7 text-[#c2924e]" />
        </div>
        <h2 className="text-xl font-bold text-[#034c3c] mb-1.5">Staff Console Locked</h2>
        <p className="text-[#1a1a1a]/70 text-xs max-w-sm mb-5">
          This console is reserved for Élan Atelier stylists and reception staff. Please authenticate with your 4-digit PIN.
        </p>
        <button
          onClick={() => openPinModal(location.pathname)}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#93032e] text-[#f5f3ef] shadow-xs hover:bg-[#730224] transition-all cursor-pointer border border-[#730224]"
        >
          Enter Staff PIN
        </button>
        <PinModal />
      </div>
    );
  }

  return children;
}
