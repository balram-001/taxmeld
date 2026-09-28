import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, UserPlus, Users } from 'lucide-react';
import API from '../api';
import { useToast } from '../toast';

export default function Team() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [seatLimit, setSeatLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const loadTeam = async () => {
    try { const response = await API.get('/team'); setMembers(response.data.members || []); setSeatLimit(response.data.seatLimit || 5); }
    catch (error: any) { showToast(error.response?.data?.message || 'Could not load your team.', 'error'); navigate('/'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadTeam(); }, []);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault(); if (inviting) return;
    setInviting(true);
    try { await API.post('/team/invite', { email }); setEmail(''); showToast('Staff invitation sent by email.', 'success'); await loadTeam(); }
    catch (error: any) { showToast(error.response?.data?.message || 'Could not invite staff.', 'error'); }
    finally { setInviting(false); }
  };

  return <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8"><div className="mx-auto max-w-3xl space-y-5">
    <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700"><ArrowLeft size={16} /> Back to Dashboard</button>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700"><Users size={16} /> Team workspace</div><h1 className="mt-2 text-2xl font-extrabold text-slate-900">Add team staff</h1><p className="mt-1 text-sm text-slate-500">Invited staff verify their own email OTP, then work inside your shared client workspace.</p></div><span className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-800">{members.length}/{seatLimit} seats</span></div>
      <form onSubmit={invite} className="mt-6 flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Mail size={16} className="absolute left-3 top-3 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@yourfirm.com" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600" /></div><button disabled={inviting || members.length >= seatLimit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300"><UserPlus size={16} /> {inviting ? 'Sending...' : 'Invite staff'}</button></form>
      <p className="mt-2 text-[11px] text-slate-500">₹399 CA Professional Plan includes 5 staff seats. Extra ₹99 seats will be enabled with payment verification.</p>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-emerald-600" /></div> : members.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No staff invitations yet.</div> : <div className="divide-y divide-slate-100">{members.map((member) => <div key={member._id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{member.email}</p><p className="mt-1 text-[11px] text-slate-500">{member.status === 'active' ? 'Email verified · Workspace access active' : 'Invitation sent · Awaiting email verification'}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{member.status === 'active' ? 'Active' : 'Pending'}</span></div>)}</div>}</section>
    <Link to="/pricing" className="text-xs font-bold text-emerald-700 hover:underline">View subscription plan</Link>
  </div></div>;
}
