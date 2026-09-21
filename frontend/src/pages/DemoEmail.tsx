import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { PlayCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function DemoEmail({ onStart }: { onStart: () => void }) {
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const startDemo = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await API.post('/demo-leads', { email: email.trim().toLowerCase(), marketingConsent });
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'We could not start the demo right now. Please try again.');
      setSubmitting(false);
      return;
    }
    localStorage.setItem('taxmeld_demo_email', email.trim().toLowerCase());
    localStorage.removeItem('taxmeld_demo_client');
    sessionStorage.setItem('taxmeld_demo_mode', 'true');
    onStart();
    navigate('/');
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
      <form onSubmit={startDemo} className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><PlayCircle size={25} /></div>
        <h1 className="mt-5 text-center text-2xl font-extrabold tracking-tight text-slate-950">Start your free demo</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">Enter your email to access the TaxMeld dashboard and create one client for free. No password or account is required.</p>
        <label className="mt-6 block text-xs font-semibold text-slate-700">Work email</label>
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@firm.com" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-500" />
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-5 text-slate-600"><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 accent-emerald-600" /> <span>I agree to receive follow-up information about TaxMeld. You can opt out at any time.</span></label>
        {error && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">{error}</p>}
        <button disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Open free demo dashboard</button>
        <p className="mt-3 text-center text-[11px] text-slate-500">Your email is saved securely as a demo lead. Demo client data stays in this browser.</p>
      </form>
    </div>
  );
}