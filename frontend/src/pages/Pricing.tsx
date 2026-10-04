import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import API from '../api';

type Billing = 'monthly' | 'annual';

const planKeys = {
  solo: { monthly: 'solo_399_monthly', annual: 'solo_399_annual' },
  team: { monthly: 'team_599_monthly', annual: 'team_599_annual' },
};

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<Billing>('monthly');
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [planType, setPlanType] = useState('free_trial');

  useEffect(() => {
    const load = async () => {
      try {
        const profile = (await API.get('/auth/profile')).data;
        setSubscriptionStatus(profile.subscriptionStatus || 'trial');
        setPlanType(profile.planType || 'free_trial');
      } catch { navigate('/login'); }
    };
    void load();
  }, [navigate]);

  const active = (type: string) => subscriptionStatus === 'active' && planType === type;
  const solo = billing === 'monthly' ? { amount: '399', label: '/ month', route: 'solo-monthly' } : { amount: '3,999', label: '/ year', route: 'solo-annual' };
  const team = billing === 'monthly' ? { amount: '599', label: '/ month', route: 'team-monthly' } : { amount: '5,999', label: '/ year', route: 'team-annual' };

  const card = (kind: 'solo' | 'team', title: string, subtitle: string, price: typeof solo, features: string[]) => {
    // An active plan must match its exact billing period. A Team monthly plan
    // must never make the annual card look purchased (and vice versa).
    const isActive = active(planKeys[kind][billing]);
    return <section className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl sm:p-8 ${kind === 'team' ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200'}`}>
      {kind === 'team' && <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">For growing firms</span>}
      <div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${kind === 'team' ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-700'}`}>{title}</span>{isActive && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><CheckCircle size={12} /> Active</span>}</div><p className="mt-4 text-sm leading-6 text-slate-500">{subtitle}</p><div className="mt-5 flex items-baseline"><span className="text-5xl font-extrabold text-slate-950">₹{price.amount}</span><span className="ml-1 text-sm font-semibold text-slate-500">{price.label}</span></div>{billing === 'annual' && <p className="mt-2 text-xs font-bold text-emerald-700">{kind === 'solo' ? 'Save ₹789 every year' : 'Save ₹1,189 every year'}</p>}<ul className="mt-7 space-y-3 text-sm text-slate-700">{features.map((feature) => <li key={feature} className="flex gap-2.5"><CheckCircle size={17} className="mt-0.5 shrink-0 text-emerald-600" /><span>{feature}</span></li>)}</ul></div><div className="mt-8 border-t border-slate-100 pt-5">{isActive ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">Your {title} is active.</div> : <button onClick={() => navigate(`/payment/${price.route}`)} className={`w-full rounded-full px-4 py-3.5 text-sm font-extrabold text-white shadow-md ${kind === 'team' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}>{kind === 'team' ? `Choose Team · ₹${price.amount}` : `Choose Solo · ₹${price.amount}`}</button>}</div></section>;
  };

  return <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto max-w-5xl"><div className="text-center"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Simple practice pricing</p><h1 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">Choose the TaxMeld plan for your firm</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Start monthly, or choose yearly billing for a lower effective monthly price. All plans include secure client workflows.</p></div><div className="mx-auto mt-7 flex w-fit rounded-full border border-slate-200 bg-white p-1 shadow-sm"><button onClick={() => setBilling('monthly')} className={`rounded-full px-4 py-2 text-xs font-extrabold ${billing === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Monthly</button><button onClick={() => setBilling('annual')} className={`rounded-full px-4 py-2 text-xs font-extrabold ${billing === 'annual' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Yearly <span className="ml-1 text-emerald-600">Save</span></button></div><div className="mt-10 grid gap-7 md:grid-cols-2">{card('solo', 'Solo CA', 'For an independent CA managing client work personally.', solo, ['Unlimited client profiles and workflows', 'Secure ITR, GST, TDS and Audit document portals', 'Client email updates and live status tracking', 'Custom document requirements'])}{card('team', 'Team CA', 'For CA firms managing client work with a staff team.', team, ['Everything in Solo CA', '5 staff members included', 'Staff workspaces and CA performance monitoring', 'Additional staff seats at ₹99 per member / month'])}</div><div className="mt-10 flex justify-center"><button onClick={() => navigate('/')} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100">← Back to CA Practice Dashboard</button></div></div></div>;
}
