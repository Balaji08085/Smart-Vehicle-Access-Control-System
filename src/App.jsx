import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/auth/Login';
import SecurityDashboard from './pages/dashboard/SecurityDashboard';
import Scanner from './pages/Scanner';
import SearchPage from './pages/search/SearchPage';
import EntryHistory from './pages/history/EntryHistory';
import ReportsPage from './pages/reports/ReportsPage';
import CreateRequest from './pages/superadmin/CreateRequest';
import ApprovalDashboard from './pages/admin/ApprovalDashboard';
import VerifyToken from './pages/VerifyToken';
import OwnerApprovalPage from './pages/owner/OwnerApprovalPage';
import { EntryProvider, useEntry } from './context/EntryContext';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

const RestrictedAccessScreen = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-[#080C16]">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-red-500/30 bg-slate-950/90 text-center space-y-5">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
          Security Access Restricted
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Mobile QR Scanner & Gate Operations are strictly restricted to authorized Security Officers and Admin staff. Students are not permitted to access security controls.
        </p>
        <Link
          to="/login"
          className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" /> Switch to Security Guard / Admin Login
        </Link>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userRole } = useEntry();
  if (!allowedRoles.includes(userRole)) {
    return <RestrictedAccessScreen />;
  }
  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const isScanner = location.pathname === '/scanner';
  const { theme } = useEntry();

  return (
    <div className={`flex flex-col min-h-screen relative font-sans antialiased transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#180305] text-slate-100 dark' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Fixed Navbar */}
      {!isScanner && <Navbar />}
      
      {/* Main Route Content */}
      <main className="flex-grow relative z-10">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:role" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['guard', 'admin', 'superadmin']}>
              <SecurityDashboard />
            </ProtectedRoute>
          } />

          <Route path="/scanner" element={
            <ProtectedRoute allowedRoles={['guard', 'admin', 'superadmin']}>
              <Scanner />
            </ProtectedRoute>
          } />

          <Route path="/superadmin/create" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateRequest />
            </ProtectedRoute>
          } />

          <Route path="/admin/approval" element={<ApprovalDashboard />} />

          <Route path="/owner/approve" element={<OwnerApprovalPage />} />

          <Route path="/verify/:token" element={
            <ProtectedRoute allowedRoles={['guard', 'admin', 'superadmin']}>
              <VerifyToken />
            </ProtectedRoute>
          } />

          <Route path="/search" element={<SearchPage />} />

          <Route path="/history" element={
            <ProtectedRoute allowedRoles={['guard', 'admin', 'superadmin']}>
              <EntryHistory />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['guard', 'admin', 'superadmin']}>
              <ReportsPage />
            </ProtectedRoute>
          } />

          {/* Legacy route fallbacks */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/qr-validation" element={<Navigate to="/scanner" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {!isScanner && <Footer />}
      
      {/* Background Ambient Security Lighting */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

    </div>
  );
};

function App() {
  return (
    <EntryProvider>
      <Router>
        <AppLayout />
      </Router>
    </EntryProvider>
  );
}

export default App;
