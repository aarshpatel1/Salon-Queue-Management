import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import PinModal from './PinModal';
import { Lock } from 'lucide-react';

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
      <div className="min-h-screen bg-[#f8f6fc] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Staff Access Locked</h2>
        <p className="text-gray-500 text-sm max-w-sm mb-6">
          This screen is restricted to salon personnel. Please authenticate with your staff PIN.
        </p>
        <button
          onClick={() => openPinModal(location.pathname)}
          className="px-6 py-2.5 rounded-xl font-medium bg-purple-700 text-white shadow-md hover:bg-purple-800 transition-all cursor-pointer"
        >
          Enter Staff PIN
        </button>
        <PinModal />
      </div>
    );
  }

  return children;
}
