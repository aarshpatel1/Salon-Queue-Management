import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PinModal from './components/PinModal';
import ProtectedRoute from './components/ProtectedRoute';
import DynamicIsland from './components/DynamicIsland';

// Pages
import Home from './pages/Home';
import JoinQueue from './pages/JoinQueue';
import MyStatus from './pages/MyStatus';
import Reception from './pages/Reception';
import BarberView from './pages/BarberView';
import WaitingTV from './pages/WaitingTV';
import AdminSettings from './pages/AdminSettings';

function AppLayout() {
  const location = useLocation();
  const isDisplayScreen = location.pathname.startsWith('/display');

  // Track the last visited non-protected page for PIN modal escape/cancel redirection
  React.useEffect(() => {
    const isProtected = ['/reception', '/admin'].some(p => location.pathname.startsWith(p)) || location.pathname.startsWith('/barber/');
    if (!isProtected) {
      sessionStorage.setItem('elan_last_visited_path', location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  if (isDisplayScreen) {
    return (
      <main className="h-[100dvh] max-h-[100dvh] w-screen overflow-hidden bg-[#1C1A18] text-[#F7F3EE]">
        <Routes>
          <Route path="/display" element={<WaitingTV />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-screen overflow-hidden flex bg-[#F7F3EE] text-[#1C1A18] font-sans antialiased">
      {/* Dynamic Island Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Content Area - Strictly 100% dvh with Vertically Scrollable Inside */}
      <div className="flex-1 h-[100dvh] max-h-[100dvh] flex flex-col min-w-0 overflow-hidden relative">
        {/* Floating Navbar Header (Fixed at top inside 100% dvh) */}
        <div className="shrink-0 px-3 md:px-6 pt-3 md:pt-4 pb-1 z-30">
          <Navbar />
        </div>

        {/* Scrollable Viewport - Everything scrolls smoothly vertically */}
        <main className="flex-1 overflow-y-auto min-h-0 px-3 md:px-6 py-3 pb-28 md:pb-16 scrollbar-thin">
          <Routes>
            {/* Public Screens */}
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<JoinQueue />} />
            <Route path="/status/:id" element={<MyStatus />} />

            {/* PIN-Protected Screens */}
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

        {/* Floating Status Bar Centered at Bottom of Main Content Section (Without Sidebar) */}
        <DynamicIsland />
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
        <ToastProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </SocketProvider>
  );
}
