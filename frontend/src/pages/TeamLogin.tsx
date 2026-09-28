import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import API from '../api';

export default function TeamLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const sendOtp = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await API.post('/team/login/request-otp', { email }); setSent(true); }
    catch (err: any) { setError(err.response?.data?.message || 'Could not send an OTP.'); }
    finally { setLoading(false); }
  };
  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await API.post('/team/login/verify-otp', { email, otp });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(); navigate('/');
    } catch (err: any) { setError(err.response?.data?.message || 'Could not verify the OTP.'); }
    finally { setLoading(false); }
  };

  return <div className="min-h-[85vh] flex items-center justify-center px-4"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div className="text-center"><div className="inline-flex rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600"><KeyRound size={28} /></div><h1 className="mt-4 text-2xl font-extrabold text-slate-900">Team staff sign in</h1><p className="mt-2 text-xs leading-5 text-slate-500">Use the same email where your CA sent the team invitation. No password or separate account is needed.</p></div>{error && <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}{!sent ? <form onSubmit={sendOtp} className="mt-6 space-y-4"><label className="block text-xs font-bold text-slate-700">Staff email address<div className="relative mt-1.5"><Mail size={16} className="absolute left-3 top-3 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@firm.com" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-600" /></div></label><button disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300">{loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : 'Send secure OTP'}</button></form> : <form onSubmit={verify} className="mt-6 space-y-4"><p className="text-center text-xs font-semibold text-slate-600">OTP sent to {email}</p><input required maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="000000" className="w-full rounded-xl border border-slate-300 py-3 text-center font-mono text-2xl tracking-[0.45em] text-indigo-700 outline-none focus:border-indigo-600" /><button disabled={loading} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300">{loading ? 'Verifying...' : 'Verify & Open Workspace'}</button><button type="button" onClick={() => { setSent(false); setOtp(''); }} className="w-full text-xs font-semibold text-slate-500 hover:text-indigo-700">Use another email</button></form>}<Link to="/login" className="mt-6 block text-center text-xs font-semibold text-slate-500 hover:text-slate-800">Back to CA login</Link></div></div>;
}
