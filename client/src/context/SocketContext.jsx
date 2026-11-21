import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [lastCalledAlert, setLastCalledAlert] = useState(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const s = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('Connected to Salon Queue WebSocket server');
    });

    s.on('queue:updated', (data) => {
      setLastSyncTime(Date.now());
    });

    s.on('queue:called', (payload) => {
      setLastCalledAlert(payload);
      setLastSyncTime(Date.now());
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, lastSyncTime, lastCalledAlert, setLastCalledAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
