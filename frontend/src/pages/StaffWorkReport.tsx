import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ExternalLink, Loader2, Search, UsersRound } from 'lucide-react';
import API from '../api';
import { useToast } from '../toast';

const statusTone: Record<string, string> = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-800',
  'In Progress': 'border-sky-200 bg-sky-50 text-sky-800',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const daysText = (days: number) => days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;

export default function StaffWorkReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [onlyAttention, setOnlyAttention] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try { setReport((await API.get(`/team/${id}/workload`)).data); }
      catch (error: any) { showToast(error.response?.data?.message || 'Could not load this staff report.', 'error'); }
      finally { setLoading(false); }
    };
    void load();
  }, [id]);

  const tasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (report?.tasks || []).filter((task: any) => {
      const matches = !query || [task.client?.name, task.client?.panNumber, task.title, task.status].some((item) => String(item || '').toLowerCase().includes(query));
      return matches && (!onlyAttention || task.isOverdue);
    });
  }, [report, search, onlyAttention]);

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={30} /></div>;
  if (!report) return <div className="p-8 text-center"><p className="font-bold text-slate-700">Staff report is not available.</p><button onClick={() => navigate('/team')} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Back to Team</button></div>;
  const summary = report.summary;
  const cards = [
    { label: 'Assigned clients', value: summary.assignedClients, icon: UsersRound, tone: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
    { label: 'Open tasks', value: summary.openTasks, icon: Clock3, tone: 'border-sky-100 bg-sky-50 text-sky-700' },
    { label: 'Completed', value: summary.completedTasks, icon: CheckCircle2, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
    { label: 'Needs attention', value: summary.overdueTasks, icon: AlertTriangle, tone: 'border-rose-100 bg-rose-50 text-rose-700' },
  ];

  return <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8"><div className="mx-auto max-w-6xl space-y-6">
    <button onClick={() => navigate('/team')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700"><ArrowLeft size={16} /> Back to Team</button>
    <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-300">CA staff performance report</p><div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-extrabold sm:text-3xl">{report.staff.name}</h1><p className="mt-1 text-sm text-slate-300">{report.staff.email} · Team member since {new Date(report.staff.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><p className="text-xs font-semibold text-slate-400">Live client and task activity under your CA workspace</p></div></section>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className={`rounded-2xl border p-4 ${tone}`}><Icon size={18} /><p className="mt-4 text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p></div>)}</section>
    {summary.overdueTasks > 0 && <section className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-extrabold text-rose-900">{summary.overdueTasks} task{summary.overdueTasks > 1 ? 's' : ''} open for 7+ days</p><p className="mt-1 text-xs text-rose-700">These client jobs have not been marked completed for more than one week.</p></div><button onClick={() => setOnlyAttention(!onlyAttention)} className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-800">{onlyAttention ? 'Show all tasks' : 'Show only attention items'}</button></section>}
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="relative block"><Search size={18} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client, PAN, task or status..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600" /></label></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-base font-extrabold text-slate-900">Client-by-client work detail</h2><p className="mt-1 text-xs text-slate-500">Each row shows who the client is, the assigned work, when it was assigned, latest activity and completion status.</p></div>{tasks.length === 0 ? <div className="p-12 text-center text-sm font-semibold text-slate-500">No matching staff work found.</div> : <div className="divide-y divide-slate-100">{tasks.map((task: any) => <article key={task._id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold text-slate-900">{task.client?.name || 'Client'}</h3><span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusTone[task.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{task.status}</span>{task.isOverdue && <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-extrabold text-rose-700">Needs attention</span>}</div><p className="mt-1 text-xs font-bold text-emerald-700">PAN: {task.client?.panNumber || 'Not provided'} · {task.client?.phone || task.client?.whatsappNumber || 'No phone'}</p><div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-3"><p><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Assigned work</span><span className="mt-1 block font-bold text-slate-800">{task.title}</span></p><p><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Assigned</span><span className="mt-1 block font-semibold">{daysText(task.assignedDaysAgo)}</span></p><p><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Last updated</span><span className="mt-1 block font-semibold">{daysText(task.updatedDaysAgo)}</span></p></div>{task.description && <p className="mt-3 text-sm text-slate-500">{task.description}</p>}</div>{task.client?._id && <button onClick={() => navigate(`/client/${task.client._id}`)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><ExternalLink size={14} /> Open client</button>}</div></article>)}</div>}</section>
  </div></div>;
}
