import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { X, LogOut, CheckCircle2, Trash2, UploadCloud } from 'lucide-react';
import axios from 'axios';

import NavigationBar from './components/NavigationBar';
import Dashboard from './pages/Dashboard';
import ClientTracker from './pages/ClientTracker';
import LandingPage from './pages/LandingPage';
import DemoEmail from './pages/DemoEmail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Pricing from './pages/Pricing';
import Payment from './pages/Payment';
import ClientDetail from './pages/ClientDetail';
import ClientActivity from './pages/ClientActivity';
import Team from './pages/Team';
import TeamAccess from './pages/TeamAccess';
import TeamLogin from './pages/TeamLogin';
import StaffDashboard from './pages/StaffDashboard';
import StaffWorkReport from './pages/StaffWorkReport';
import API from './api';

function ClientUploadNotifications({ enabled }: { enabled: boolean }) {
  const checkingRef = useRef(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [currentNotification, setCurrentNotification] = useState<string | null>(null);

  useEffect(() => {
    if (currentNotification || queue.length === 0) return;
    setCurrentNotification(queue[0]);
    setQueue((current) => current.slice(1));
  }, [currentNotification, queue]);

  useEffect(() => {
    if (!currentNotification) return;
    const timer = window.setTimeout(() => setCurrentNotification(null), 5000);
    return () => window.clearTimeout(timer);
  }, [currentNotification]);

  useEffect(() => {
    if (!enabled) return;

    const checkForNewUploads = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const response = await API.get('/clients');
        const clients = response.data || [];
        const seenKey = 'taxmeld_last_seen_client_upload';
        const lastSeen = Number(localStorage.getItem(seenKey) || 0);
        const newUploads = clients.filter((client: any) => new Date(client.lastClientUploadAt || 0).getTime() > lastSeen);

        if (newUploads.length > 0) {
          const notifications = newUploads.map((client: any) => {
            const clientNumber = clients.findIndex((item: any) => item._id === client._id) + 1;
            return `Client #${clientNumber} — ${client.name} (${client.panNumber}) has uploaded documents.`;
          });
          setQueue((current) => [...current, ...notifications]);
          const newestUpload = Math.max(...newUploads.map((client: any) => new Date(client.lastClientUploadAt).getTime()));
          localStorage.setItem(seenKey, String(newestUpload));
        }
      } catch {
        // A background notification check must never interrupt the CA's work.
      } finally {
        checkingRef.current = false;
      }
    };

    void checkForNewUploads();
    const timer = window.setInterval(checkForNewUploads, 25000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  if (!currentNotification) return null;

  return (
    <div className="fixed right-4 top-4 z-[110] w-[min(24rem,calc(100vw-2rem))] animate-in fade-in slide-in-from-top-2 duration-200" role="status" aria-live="polite">
      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-950 shadow-xl">
        <UploadCloud size={20} className="mt-0.5 shrink-0 text-sky-600" />
        <p className="flex-1 leading-5">{currentNotification}</p>
        <button type="button" onClick={() => setCurrentNotification(null)} className="rounded p-0.5 text-sky-700/60 hover:bg-sky-100 hover:text-sky-900" aria-label="Close notification"><X size={17} /></button>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => sessionStorage.getItem('taxmeld_demo_mode') === 'true');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDemoUpgrade, setShowDemoUpgrade] = useState(false);
  const isStaffUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').role === 'staff'; } catch { return false; }
  })();

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('taxmeld_demo_mode');
    setIsAuthenticated(false);
    setIsDemoMode(false);
    setShowLogoutConfirm(false);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.delete('https://taxmeld-backend.vercel.app/api/auth/account', {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Error deleting account from backend:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('taxmeld_demo_mode');
      setIsAuthenticated(false);
      setIsDemoMode(false);
      setShowDeleteConfirm(false);
      window.location.href = '/login';
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <NavigationBar 
          isAuthenticated={isAuthenticated} 
          onLogoutRequest={() => setShowLogoutConfirm(true)} 
          onDeleteAccount={() => setShowDeleteConfirm(true)}
        />
        <ClientUploadNotifications enabled={isAuthenticated && !isDemoMode} />

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                <LogOut size={22} className="text-slate-600" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Confirm Logout</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to log out of your CA practice account?
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 size={22} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900">Delete Account Permanently?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This action cannot be undone. All your clients, workflow data, and subscription details will be deleted permanently.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showDemoUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
              <button onClick={() => setShowDemoUpgrade(false)} className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={18} /></button>
              <div className="mx-auto inline-flex rounded-full bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 size={25} /></div>
              <h2 className="mt-4 text-lg font-extrabold text-slate-950">Your free demo is complete</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Create an account to add more clients, send portal links, upload documents, and use the full workflow.</p>
              <div className="mt-5 grid gap-2">
                <a href="/register" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">Create account</a>
                <a href="/login" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Sign in</a>
                <button onClick={() => setShowDemoUpgrade(false)} className="py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">Continue viewing demo</button>
              </div>
            </div>
          </div>
        )}

        <main className="py-2 sm:py-4">
          <Routes>
            <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/register" element={<Register onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/forgot-password" element={<ForgotPassword onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment/:plan" element={<Payment />} />
            <Route path="/track/:token" element={<ClientTracker />} />
            <Route path="/demo" element={<DemoEmail onStart={() => setIsDemoMode(true)} />} />
            <Route path="/" element={isAuthenticated ? (isStaffUser ? <Navigate to="/staff-dashboard" replace /> : <Dashboard />) : isDemoMode ? <Dashboard isDemo onDemoLimit={() => setShowDemoUpgrade(true)} /> : <LandingPage />} />
            <Route path="/client/:id" element={<ClientDetail />} />
            <Route path="/activity" element={<ClientActivity />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/staff/:id" element={isAuthenticated && !isStaffUser ? <StaffWorkReport /> : <Navigate to="/" replace />} />
            <Route path="/team-access" element={<TeamAccess onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/team-login" element={<TeamLogin onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/staff-dashboard" element={isAuthenticated ? <StaffDashboard /> : <Navigate to="/team-login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
