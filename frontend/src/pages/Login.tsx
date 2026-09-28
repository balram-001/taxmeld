import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { email, password });
      
      // Intentional smooth transition delay (1.2s)
      setTimeout(() => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user || res.data));
        onLogin();
        navigate('/');
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-3 border border-emerald-100">
            <Shield size={30} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">CA Portal Login</h2>
          <p className="text-slate-500 text-xs mt-1">Sign in to manage client workflows & tracking</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm placeholder-slate-400"
                placeholder="ca.name@firm.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-emerald-700 hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:opacity-50 shadow-sm placeholder-slate-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
          New to TaxMeld?{' '}
          <Link to="/register" className="text-emerald-700 hover:underline font-semibold">
            Create an Account
          </Link>
        </p>
        <Link to="/team-login" className="mt-3 block text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          Team staff? Sign in securely with email OTP
        </Link>
      </div>
    </div>
  );
}
