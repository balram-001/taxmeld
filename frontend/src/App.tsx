import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { X, LogOut, CheckCircle2, Trash2 } from 'lucide-react';
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => sessionStorage.getItem('taxmeld_demo_mode') === 'true');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDemoUpgrade, setShowDemoUpgrade] = useState(false);

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
            <Route path="/" element={isAuthenticated ? <Dashboard /> : isDemoMode ? <Dashboard isDemo onDemoLimit={() => setShowDemoUpgrade(true)} /> : <LandingPage />} />
            <Route path="/client/:id" element={<ClientDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
