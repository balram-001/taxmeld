import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Clock3, Loader2, PlayCircle, RefreshCw, UsersRound } from 'lucide-react';
import API from '../api';
import { useToast } from '../toast';

type StaffTask = {
  _id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  client?: { name?: string; panNumber?: string; phone?: string; whatsappNumber?: string; serviceType?: string };
};

const statusStyle: Record<StaffTask['status'], string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  'In Progress': 'bg-sky-50 text-sky-800 border-sky-200',
  Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export default function StaffDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [data, setData] = useState<any>(null);

  const loadDashboard = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await API.get('/tasks/staff-dashboard');
      setData(response.data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not load your assigned work.', 'error');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => { void loadDashboard(); }, []);

  const changeStatus = async (taskId: string, status: StaffTask['status']) => {
    setUpdatingId(taskId);
    try {
      await API.put(`/tasks/staff-tasks/${taskId}/status`, { status });
      await loadDashboard(true);
      showToast(status === 'Completed' ? 'Client task marked complete.' : 'Task moved to in progress.', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not update this task.', 'error');
    } finally {
      setUpdatingId('');
    }
  };

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  const summary = data?.summary || { total: 0, pending: 0, inProgress: 0, completed: 0, assignedClients: 0 };
  const tasks: StaffTask[] = data?.tasks || [];
  const cards = [
    { label: 'Assigned clients', value: summary.assignedClients, icon: UsersRound, tone: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
    { label: 'New assignments', value: summary.pending, icon: Clock3, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
    { label: 'In progress', value: summary.inProgress, icon: PlayCircle, tone: 'text-sky-700 bg-sky-50 border-sky-100' },
    { label: 'Completed', value: summary.completed, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300">TaxMeld team workspace</p>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Hello, {data?.staff?.name || 'Team member'}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">This is your private work dashboard. Only client tasks assigned by your CA are shown here.</p>
            </div>
            <button onClick={() => void loadDashboard()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/20"><RefreshCw size={15} /> Refresh</button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className={`rounded-2xl border p-4 ${tone}`}><Icon size={18} /><p className="mt-4 text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p></div>)}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-base font-extrabold text-slate-900">My assigned client work</h2><p className="mt-1 text-xs text-slate-500">Update progress only after you have started or completed the assigned work.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{summary.total} tasks</span></div>
          {tasks.length === 0 ? <div className="p-12 text-center"><ClipboardList className="mx-auto text-slate-300" size={30} /><p className="mt-3 text-sm font-semibold text-slate-600">No client tasks assigned yet.</p><p className="mt-1 text-xs text-slate-500">Your CA will assign work here when it is ready.</p></div> : <div className="divide-y divide-slate-100">{tasks.map((task) => <article key={task._id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-extrabold text-slate-900">{task.client?.name || 'Client'}</h3><span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusStyle[task.status]}`}>{task.status}</span></div><p className="mt-1 text-xs font-semibold text-emerald-700">PAN: {task.client?.panNumber || 'Not provided'} · {task.client?.phone || task.client?.whatsappNumber || 'No mobile number'}</p><p className="mt-3 text-sm font-bold text-slate-800">{task.title}</p>{task.description && <p className="mt-1 text-sm leading-5 text-slate-500">{task.description}</p>}<p className="mt-3 text-[11px] text-slate-400">Assigned {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><div className="flex shrink-0 flex-wrap gap-2">{task.status === 'Pending' && <button disabled={updatingId === task._id} onClick={() => void changeStatus(task._id, 'In Progress')} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-60">Start work</button>}{task.status !== 'Completed' && <button disabled={updatingId === task._id} onClick={() => void changeStatus(task._id, 'Completed')} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{updatingId === task._id ? 'Saving...' : 'Mark complete'}</button>}</div></div></article>)}</div>}
        </section>
      </div>
    </div>
  );
}
