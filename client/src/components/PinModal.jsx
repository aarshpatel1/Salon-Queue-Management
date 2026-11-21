import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, X, AlertCircle } from 'lucide-react';

export default function PinModal() {
  const { pinModalOpen, closePinModal, loginWithPin, pendingRoute, error, setError } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!pinModalOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    const result = await loginWithPin(pin);
    setLoading(false);

    if (result.success) {
      setPin('');
      if (pendingRoute) {
        navigate(pendingRoute);
      }
    }
  };

  const handleDigitClick = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setError('');
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-purple-100 relative">
        <button
          onClick={closePinModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Staff Access Required</h2>
          <p className="text-xs text-gray-500 mt-1">
            Enter the 4-digit staff PIN to unlock this area.
          </p>
          <div className="mt-1 text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            Default PIN: 1234
          </div>
        </div>

        {error && (
          <div className="mt-4 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Dots Display */}
        <div className="flex justify-center gap-3 my-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-11 h-12 rounded-xl flex items-center justify-center text-xl font-bold border transition-all ${
                pin[idx]
                  ? 'border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              {pin[idx] ? '●' : ''}
            </div>
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit.toString())}
              disabled={loading}
              className="h-12 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-800 font-semibold text-lg transition-colors active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-12 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 font-medium text-xs transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            disabled={loading}
            className="h-12 rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-800 font-semibold text-lg transition-colors active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-xs transition-colors flex items-center justify-center"
          >
            Del
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || pin.length !== 4}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-md shadow-purple-300 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? 'Verifying...' : 'Unlock Staff Area'}
        </button>
      </div>
    </div>
  );
}
