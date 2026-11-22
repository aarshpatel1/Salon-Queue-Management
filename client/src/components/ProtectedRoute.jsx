import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, openPinModal, pinModalOpen } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !pinModalOpen) {
      openPinModal(location.pathname);
    }
  }, [isAuthenticated, location.pathname, openPinModal, pinModalOpen]);

  const handleGoBack = () => {
    const lastPath = sessionStorage.getItem('elan_last_visited_path') || '/';
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(lastPath);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center mb-4 border border-[#4A4540] shadow-md">
          <Icon icon="solar:lock-bold" className="w-7 h-7 text-[#C2B4A3]" />
        </div>
        <h2 className="text-xl font-black text-[#1C1A18] mb-1.5">Staff Console Locked</h2>
        <p className="text-[#4A4540] text-xs max-w-sm mb-6 font-medium">
          This console is reserved for Élan Atelier stylists and reception staff. Please authenticate with your 4-digit PIN.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openPinModal(location.pathname)}
            className="px-6 py-2.5 rounded-full font-bold text-xs bg-[#1C1A18] text-[#F7F3EE] hover:bg-[#4A4540] transition-all cursor-pointer shadow-md"
          >
            Enter Staff PIN
          </button>
          <button
            onClick={handleGoBack}
            className="px-5 py-2.5 rounded-full font-bold text-xs bg-[#FFFFFF] border border-[#E4DBD0] text-[#1C1A18] hover:bg-[#F7F3EE] transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}
