import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PinModal() {
  const { pinModalOpen, closePinModal, loginWithPin, pendingRoute, error, setError } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Reset PIN when modal opens or closes
  useEffect(() => {
    if (pinModalOpen) {
      setPin('');
    }
  }, [pinModalOpen]);

  // Handle dismissal (by Escape key, close button, or backdrop click)
  // Closes modal and redirects to last visited page if on a protected route
  const handleDismiss = useCallback(() => {
    closePinModal();
    const lastPath = sessionStorage.getItem('elan_last_visited_path') || '/';
    const isProtected =
      ['/reception', '/admin'].some((p) => location.pathname.startsWith(p)) ||
      location.pathname.startsWith('/barber');

    if (isProtected || pendingRoute) {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate(lastPath);
      }
    }
  }, [closePinModal, location.pathname, pendingRoute, navigate]);

  // Unified PIN submission handler
  const submitWithPin = useCallback(
    async (pinCandidate) => {
      if (pinCandidate.length !== 4 || loading) {
        if (pinCandidate.length !== 4) setError('Please enter a 4-digit PIN');
        return;
      }

      setLoading(true);
      const result = await loginWithPin(pinCandidate);
      setLoading(false);

      if (result.success) {
        setPin('');
        if (pendingRoute) {
          navigate(pendingRoute);
        }
      } else {
        // Clear digits on error so user can re-type immediately
        setPin('');
      }
    },
    [loading, loginWithPin, pendingRoute, navigate, setError]
  );

  // Physical Keyboard listener for 0-9, Backspace, Enter, Escape
  useEffect(() => {
    if (!pinModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setError('');
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4) {
          submitWithPin(pin);
        }
        return;
      }

      // Handle numeric keys 0-9 (standard top-row and numpad)
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (pin.length < 4 && !loading) {
          const nextPin = pin + e.key;
          setPin(nextPin);
          setError('');
          if (nextPin.length === 4) {
            submitWithPin(nextPin);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinModalOpen, pin, loading, handleDismiss, setError, submitWithPin]);

  if (!pinModalOpen) return null;

  const handleDigitClick = (digit) => {
    if (pin.length < 4 && !loading) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        submitWithPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    submitWithPin(pin);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-transparent select-none animate-in fade-in duration-150"
      onClick={handleDismiss}
    >
      <div
        className="bg-[#FFFFFF] rounded-[36px] shadow-2xl max-w-sm w-full p-6 border border-[#E4DBD0] relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F7F3EE] text-[#4A4540] hover:text-[#1C1A18] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center mb-3 shadow-md">
            <Icon icon="solar:lock-bold" className="w-6 h-6 text-[#C2B4A3]" />
          </div>
          <h2 className="text-base font-black text-[#1C1A18]">Staff Authentication</h2>
          <p className="text-xs text-[#4A4540] mt-1 font-medium">
            Enter 4-digit PIN to unlock console
          </p>
          <div className="mt-2 text-[10px] font-black text-[#1C1A18] bg-[#E4DBD0] px-3.5 py-1 rounded-full border border-[#C2B4A3]">
            Default Studio PIN: 1234
          </div>
        </div>

        {error && (
          <div className="mt-4 p-2.5 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-bold text-center flex items-center justify-center gap-1.5 px-4">
            <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Dots Display in Pill */}
        <div className="flex justify-center gap-3 my-5 p-3 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] w-36 mx-auto">
          {[0, 1, 2, 3].map((idx) => {
            const hasDigit = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full border transition-all ${
                  hasDigit
                    ? 'bg-[#1C1A18] border-[#1C1A18] scale-110'
                    : 'bg-[#FFFFFF] border-[#C2B4A3]'
                }`}
              />
            );
          })}
        </div>

        {/* Minimalist Numeric Keypad with Pill Buttons */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit.toString())}
              className="h-11 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] text-sm font-black text-[#1C1A18] hover:bg-[#1C1A18] hover:text-[#F7F3EE] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleDelete}
            className="h-11 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] flex items-center justify-center text-[#4A4540] hover:bg-[#E4DBD0] transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Delete last digit"
          >
            <Icon icon="solar:backspace-bold" className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="h-11 rounded-full bg-[#F7F3EE] border border-[#E4DBD0] text-sm font-black text-[#1C1A18] hover:bg-[#1C1A18] hover:text-[#F7F3EE] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pin.length !== 4 || loading}
            className="h-11 rounded-full bg-[#1C1A18] text-[#F7F3EE] flex items-center justify-center font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4A4540] transition-all cursor-pointer shadow-md active:scale-95"
          >
            {loading ? (
              <Icon icon="solar:refresh-bold" className="w-5 h-5 animate-spin" />
            ) : (
              <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-[#C2B4A3]" />
            )}
          </button>
        </div>

        {/* Physical Keyboard Indicator Pill */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#4A4540] font-semibold mt-4">
          <Icon icon="solar:keyboard-bold" className="w-3.5 h-3.5 text-[#C2B4A3]" />
          <span>Keyboard enabled (0-9, Backspace, Enter)</span>
        </div>
      </div>
    </div>
  );
}
