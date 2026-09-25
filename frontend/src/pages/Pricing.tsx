import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Zap, Mail, MessageSquare, Users } from 'lucide-react';

const Pricing: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');
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
        const res = await axios.get('https://taxmeld-backend.onrender.com/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.subscriptionStatus) {
          setSubscriptionStatus(res.data.subscriptionStatus);
        }
      } catch (err) {
        console.error('Error fetching profile status...', err);
      }
    };

    fetchStatus();

    // Polling trigger: Check if payment is verified by MacroDroid webhook
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('https://taxmeld-backend.onrender.com/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.subscriptionStatus === 'active') {
          setSubscriptionStatus('active');
        }
      } catch (err) {
        console.error('Polling error...', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  // UPI configuration
  const upiId = "7999422714-m7e1@axl";
  const amount299 = "299";
  const payeeName = "TaxMeld";
  const upiDeepLink299 = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount299}&cu=INR`;

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
            Your TaxMeld Subscription is Active & Verified! 🎉
          </div>
        )}
      </div>

      {/* Side-by-Side Pricing Cards */}
      <div className="mt-12 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Card 1: Founding CA Plan (₹299) */}
        <div className={`bg-white rounded-2xl shadow-xl border ${subscriptionStatus === 'active' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-indigo-200 ring-2 ring-indigo-500/10'} p-8 flex flex-col justify-between relative overflow-hidden transition hover:shadow-2xl`}>
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            First 10 CAs Offer
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                Founding CA Plan
              </span>
              {subscriptionStatus === 'active' && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> Active Plan
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">₹299</span>
              <span className="ml-1 text-sm font-medium text-slate-500">/ month</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Special locked-in pricing for early adopting Chartered Accountants.</p>

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
            <div className="flex flex-col items-center">
              <img 
                src="/qrcode.png" 
                alt="UPI QR Code for ₹299" 
                className="w-36 h-36 object-contain border border-slate-200 rounded-xl p-1 bg-white shadow-sm mb-3" 
              />
              <p className="text-[11px] font-semibold text-slate-600 mb-3">UPI ID: {upiId}</p>
              
              <a 
                href={upiDeepLink299}
                className="w-full bg-emerald-600 text-white text-center py-3 px-4 rounded-xl font-semibold text-xs hover:bg-emerald-700 shadow-md transition flex items-center justify-center gap-2"
              >
                Pay ₹299 via Any UPI App
              </a>
            </div>
          </div>
        </div>

        {/* Card 2: Standard Professional Plan (₹399) */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col justify-between relative transition hover:shadow-xl">
          <div>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
              Standard Professional Plan
            </span>

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
                <span>Advanced Multi-User Firm Workflow Access</span>
              </li>
              <li className="flex items-center gap-3">
                <Zap size={16} className="text-amber-500 shrink-0" />
                <span>Priority 24/7 Practice Support</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => alert('Standard plan will be available for selection upon renewal.')}
              className="w-full bg-slate-900 text-white text-center py-3 px-4 rounded-xl font-semibold text-xs hover:bg-slate-800 shadow-sm transition"
            >
              Standard Plan (Next Renewal)
            </button>
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