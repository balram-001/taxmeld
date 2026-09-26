import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Zap, Mail, MessageSquare, Users } from 'lucide-react';

const Pricing: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');
  const [planType, setPlanType] = useState<string>('free_trial');
  const navigate = useNavigate();

  // Fetch profile to check real-time subscription status
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await axios.get('https://taxmeld-backend.vercel.app/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubscriptionStatus(res.data.subscriptionStatus || 'trial');
        setPlanType(res.data.planType || 'free_trial');
      } catch (err) {
        console.error('Error fetching profile status...', err);
      }
    };

    fetchStatus();

    // Polling trigger: Check if payment is verified by MacroDroid webhook
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('https://taxmeld-backend.vercel.app/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSubscriptionStatus(res.data.subscriptionStatus || 'trial');
        setPlanType(res.data.planType || 'free_trial');
      } catch (err) {
        console.error('Polling error...', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Older paid accounts did not store planType. They are treated as Starter
  // accounts so an already-paid CA never sees another ₹299 payment request.
  const starterPlanActive = subscriptionStatus === 'active' && planType !== 'professional_399';
  const professionalPlanActive = subscriptionStatus === 'active' && planType === 'professional_399';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Upgrade Your TaxMeld Subscription
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600">
          Secure your CA practice automation with zero gateway fees. Compare plans and manage your firm seamlessly.
        </p>

        {subscriptionStatus === 'active' && (
          <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-700 text-sm font-semibold shadow-sm animate-bounce">
            <CheckCircle size={18} className="text-emerald-600" />
            Your {professionalPlanActive ? '₹399 CA Professional' : '₹299 Starter CA'} Plan is Active & Verified! 🎉
          </div>
        )}
      </div>

      {/* Side-by-Side Pricing Cards */}
      <div className="mt-12 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Card 1: Starter CA Plan (₹299) */}
        <div className={`bg-white rounded-2xl shadow-xl border ${starterPlanActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-indigo-200 ring-2 ring-indigo-500/10'} p-8 flex flex-col justify-between relative overflow-hidden transition hover:shadow-2xl`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                Starter CA Plan
              </span>
              {starterPlanActive && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> Active Plan
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">₹299</span>
              <span className="ml-1 text-sm font-medium text-slate-500">/ month</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Essential practice automation for independent Chartered Accountants.</p>

            {/* Features List */}
            <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
              <li className="flex items-center gap-3">
                <Users size={16} className="text-indigo-600 shrink-0" />
                <span><strong>Unlimited</strong> Client Profiles & Management</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageSquare size={16} className="text-emerald-600 shrink-0" />
                <span>Automated <strong>WhatsApp Reminders</strong> & Alerts</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-blue-600 shrink-0" />
                <span>Instant <strong>Email Compliance</strong> Updates</span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                <span>Secure Client Document Portal (ITR, GST, TDS)</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap size={16} className="text-amber-500 shrink-0" />
                <span>Zero Gateway Fees (Direct UPI Payment)</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            {starterPlanActive ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <CheckCircle size={24} className="mx-auto text-emerald-600" />
                <p className="mt-2 text-sm font-bold text-emerald-800">Your ₹299 Starter Plan is active</p>
                <p className="mt-1 text-[11px] text-emerald-700">Payment received. No further action is needed right now.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/payment/starter')}
                className="w-full rounded-full bg-slate-900 px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] cursor-pointer"
              >
                Start with ₹299 Plan
              </button>
            )}
          </div>
        </div>

        {/* Card 2: CA Professional Plan (₹399) */}
        <div className={`bg-white rounded-2xl shadow-lg border p-8 flex flex-col justify-between relative transition hover:shadow-xl ${professionalPlanActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                CA Professional Plan
              </span>
              {professionalPlanActive && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> Active Plan
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">₹399</span>
              <span className="ml-1 text-sm font-medium text-slate-500">/ month</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">For growing CA firms requiring advanced practice management automation.</p>

            {/* Features List */}
            <ul className="mt-6 space-y-3.5 text-sm text-slate-700">
              <li className="flex items-center gap-3">
                <Users size={16} className="text-indigo-600 shrink-0" />
                <span><strong>Unlimited</strong> Client Profiles & Management</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageSquare size={16} className="text-emerald-600 shrink-0" />
                <span>Automated <strong>WhatsApp Reminders</strong> & Alerts</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-blue-600 shrink-0" />
                <span>Instant <strong>Email Compliance</strong> Updates</span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                <span><strong>5 Staff Members</strong> included in the plan</span>
              </li>
              <li className="flex items-center gap-3">
                <Users size={16} className="text-violet-600 shrink-0" />
                <span>Additional staff at <strong>₹99 per member / month</strong></span>
              </li>
              <li className="flex items-center gap-3">
                <Zap size={16} className="text-amber-500 shrink-0" />
                <span>Priority 24/7 Practice Support</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            {professionalPlanActive ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <CheckCircle size={24} className="mx-auto text-emerald-600" />
                <p className="mt-2 text-sm font-bold text-emerald-800">Your ₹399 Professional Plan is active</p>
                <p className="mt-1 text-[11px] text-emerald-700">5 staff member seats are included. Extra seats are ₹99/member/month.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/payment/professional')}
                className="w-full rounded-full bg-slate-900 px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] cursor-pointer"
              >
                Get CA Professional Plan
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Dashboard Navigation Button */}
      <div className="mt-10 text-center">
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white py-3 px-8 rounded-xl font-semibold text-sm hover:bg-indigo-700 shadow-md transition cursor-pointer"
        >
          ← Back to CA Practice Dashboard
        </button>
      </div>
    </div>
  );
};

export default Pricing;
