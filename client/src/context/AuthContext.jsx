import React, { createContext, useContext, useState, useEffect } from 'react';
import apiRequest from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('staff_pin') || !!sessionStorage.getItem('staff_jwt');
  });
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);
  const [error, setError] = useState('');

  const loginWithPin = async (pin) => {
    try {
      setError('');
      const data = await apiRequest('/api/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin })
      });

      if (data.success && data.token) {
        sessionStorage.setItem('staff_jwt', data.token);
        sessionStorage.setItem('staff_pin', pin);
        setIsAuthenticated(true);
        setPinModalOpen(false);
        return { success: true };
      } else {
        setError(data.message || 'Incorrect PIN');
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      return { success: false, message: err.message };
    }
  };

  const logoutStaff = () => {
    sessionStorage.removeItem('staff_jwt');
    sessionStorage.removeItem('staff_pin');
    setIsAuthenticated(false);
  };

  const openPinModal = (redirectPath = null) => {
    setPendingRoute(redirectPath);
    setPinModalOpen(true);
    setError('');
  };

  const closePinModal = () => {
    setPinModalOpen(false);
    setError('');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loginWithPin,
        logoutStaff,
        pinModalOpen,
        openPinModal,
        closePinModal,
        pendingRoute,
        error,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
