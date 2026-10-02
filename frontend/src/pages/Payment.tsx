import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import API from '../api';

const plans: Record<string, { key: string; name: string; amount: string; period: string; description: string }> = {
  'solo-monthly': { key: 'solo_399_monthly', name: 'Solo CA Plan', amount: '399', period: 'month', description: 'Unlimited clients, secure document portals and complete client workflow management.' },
  'solo-annual': { key: 'solo_399_annual', name: 'Solo CA Plan', amount: '3999', period: 'year', description: 'Annual Solo CA plan with unlimited clients and secure client workflows.' },
  'team-monthly': { key: 'team_599_monthly', name: 'Team CA Plan', amount: '599', period: 'month', description: 'Unlimited clients, five staff seats and live CA staff performance monitoring.' },
  'team-annual': { key: 'team_599_annual', name: 'Team CA Plan', amount: '5999', period: 'year', description: 'Annual Team CA plan with five staff seats and complete team workflow control.' },
};

export default function Payment() {
  const { plan = '' } = useParams<{ plan: string }>();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [activePlan, setActivePlan] = useState('');
  const selected = useMemo(() => plans[plan] || plans['solo-monthly'], [plan]);
  const upiId = '7999422714-m7e1@axl';
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent('TaxMeld')}&am=${selected.amount}&cu=INR`;

  useEffect(() => {
    const check = async () => {
      try { const profile = (await API.get('/auth/profile')).data; setActivePlan(profile.subscriptionStatus === 'active' ? profile.planType || '' : ''); }
      catch { navigate('/login'); }
      finally { setChecking(false); }
    };
    void check();
    const timer = window.setInterval(() => void check(), 5000);
    return () => window.clearInterval(timer);
  }, [navigate]);

  const alreadyActive = activePlan === selected.key;
  return <div className="min-h-screen bg-slate-950 px-4 py-8 sm:py-12"><main className="mx-auto w-full max-w-md"><button onClick={() => navigate('/pricing')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"><ArrowLeft size={16} /> Back to plans</button><section className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl"><div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-7 text-white"><div className="inline-flex rounded-xl bg-white/10 p-3"><CreditCard size={23} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">TaxMeld subscription</p><h1 className="mt-2 text-2xl font-extrabold">{selected.name}</h1><p className="mt-2 text-sm leading-6 text-slate-300">{selected.description}</p><p className="mt-5 text-4xl font-extrabold">₹{Number(selected.amount).toLocaleString('en-IN')}<span className="ml-1 text-sm font-medium text-slate-300">/ {selected.period}</span></p></div><div className="p-6 text-center">{checking ? <div className="py-14"><Loader2 size={28} className="mx-auto animate-spin text-emerald-600" /><p className="mt-3 text-xs font-semibold text-slate-500">Checking your subscription...</p></div> : alreadyActive ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><CheckCircle size={34} className="mx-auto text-emerald-600" /><h2 className="mt-3 text-lg font-extrabold text-emerald-900">This plan is already active</h2><p className="mt-2 text-xs leading-5 text-emerald-800">Your payment has been verified. No further payment is required.</p><button onClick={() => navigate('/')} className="mt-5 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700">Go to Dashboard</button></div> : <><p className="text-sm font-bold text-slate-800">Scan to pay securely via UPI</p><img src="/qrcode.png" alt={`UPI QR code for ₹${selected.amount}`} className="mx-auto mt-4 h-48 w-48 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" /><p className="mt-4 text-xs font-semibold text-slate-600">UPI ID: {upiId}</p><a href={upiLink} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-md hover:bg-slate-800">Pay ₹{Number(selected.amount).toLocaleString('en-IN')} via Any UPI App</a><p className="mt-4 text-[11px] leading-5 text-slate-500">After payment, verification happens automatically. This page checks your status every few seconds.</p></>}</div></section></main></div>;
}
