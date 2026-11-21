import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PinModal from './components/PinModal';
import ProtectedRoute from './components/ProtectedRoute';

// 7 Screens
import Home from './pages/Home';
import JoinQueue from './pages/JoinQueue';
import MyStatus from './pages/MyStatus';
import Reception from './pages/Reception';
import BarberView from './pages/BarberView';
import WaitingTV from './pages/WaitingTV';
import AdminSettings from './pages/AdminSettings';

function AppLayout() {
  const location = useLocation();
  // Display screen (/display) is designed for 5m TV display, full-screen without sidebar/navbar
  const isDisplayScreen = location.pathname.startsWith('/display');

  if (isDisplayScreen) {
    return (
      <main className="min-h-screen bg-[#130324]">
        <Routes>
          <Route path="/display" element={<WaitingTV />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f6fc] text-slate-800">
      {/* Desktop Violet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-8">
          <Routes>
            {/* Public Screens */}
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<JoinQueue />} />
            <Route path="/status/:id" element={<MyStatus />} />

            {/* PIN-Protected Screens (persisted in sessionStorage) */}
            <Route
              path="/reception"
              element={
                <ProtectedRoute>
                  <Reception />
                </ProtectedRoute>
              }
            />
            <Route
              path="/barber/:name"
              element={
                <ProtectedRoute>
                  <BarberView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Global Staff PIN Modal */}
      <PinModal />
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </SocketProvider>
  );
}
