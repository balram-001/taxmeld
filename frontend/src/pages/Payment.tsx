import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, Loader2, ShieldCheck } from 'lucide-react';

const API_URL = 'https://taxmeld-backend.vercel.app/api';

const Payment: React.FC = () => {
  const { plan } = useParams<{ plan: string }>();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState(false);
  const [activePlan, setActivePlan] = useState('');

  const selectedPlan = useMemo(() => plan === 'professional' ? {
    key: 'professional_399',
    name: 'CA Professional Plan',
    amount: '399',
    cta: 'Pay ₹399 via Any UPI App',
    description: 'Unlimited clients, 5 included staff seats, and priority practice support.',
  } : {
    key: 'starter_299',
    name: 'Starter CA Plan',
    amount: '299',
    cta: 'Pay ₹299 via Any UPI App',
    description: 'Unlimited clients with document portals, workflow tracking, and reminders.',
  }, [plan]);

  const upiId = '7999422714-m7e1@axl';
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent('TaxMeld')}&am=${selectedPlan.amount}&cu=INR`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const checkSubscription = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActive(response.data.subscriptionStatus === 'active');
        setActivePlan(response.data.planType || '');
      } catch (error) {
        console.error('Could not check subscription:', error);
      } finally {
        setChecking(false);
      }
    };

    checkSubscription();
    const interval = window.setInterval(checkSubscription, 3000);
    return () => window.clearInterval(interval);
  }, [navigate]);

  const selectedPlanAlreadyActive = active && activePlan === selectedPlan.key;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:py-12">
      <main className="mx-auto w-full max-w-md">
        <button onClick={() => navigate('/pricing')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer">
          <ArrowLeft size={16} /> Back to plans
        </button>

        <section className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-7 text-white">
            <div className="inline-flex rounded-xl bg-white/10 p-3"><CreditCard size={23} /></div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">TaxMeld subscription</p>
            <h1 className="mt-2 text-2xl font-extrabold">{selectedPlan.name}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">{selectedPlan.description}</p>
            <p className="mt-5 text-4xl font-extrabold">₹{selectedPlan.amount}<span className="ml-1 text-sm font-medium text-slate-300">/ month</span></p>
          </div>

          <div className="p-6 text-center">
            {checking ? (
              <div className="py-14"><Loader2 size={28} className="mx-auto animate-spin text-emerald-600" /><p className="mt-3 text-xs font-semibold text-slate-500">Checking your subscription...</p></div>
            ) : selectedPlanAlreadyActive ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <CheckCircle size={34} className="mx-auto text-emerald-600" />
                <h2 className="mt-3 text-lg font-extrabold text-emerald-900">This plan is already active</h2>
                <p className="mt-2 text-xs leading-5 text-emerald-800">Your payment has been verified. No further payment is required.</p>
                <button onClick={() => navigate('/')} className="mt-5 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 cursor-pointer">Go to Dashboard</button>
              </div>
            ) : active ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <ShieldCheck size={34} className="mx-auto text-amber-600" />
                <h2 className="mt-3 text-lg font-extrabold text-amber-900">You already have an active plan</h2>
                <p className="mt-2 text-xs leading-5 text-amber-800">Your current subscription is active. Contact support before changing plans.</p>
                <button onClick={() => navigate('/pricing')} className="mt-5 w-full rounded-full border border-amber-300 bg-white py-3 text-sm font-bold text-amber-900 cursor-pointer">Back to Plans</button>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-800">Scan to pay securely via UPI</p>
                <img src="/qrcode.png" alt={`UPI QR code for ₹${selectedPlan.amount}`} className="mx-auto mt-4 h-48 w-48 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" />
                <p className="mt-4 text-xs font-semibold text-slate-600">UPI ID: {upiId}</p>
                <a href={upiLink} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99]">
                  {selectedPlan.cta}
                </a>
                <p className="mt-4 text-[11px] leading-5 text-slate-500">After payment, verification happens automatically. This page checks your payment status every few seconds.</p>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Payment;
