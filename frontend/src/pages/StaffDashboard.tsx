import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList, Clock3, ExternalLink, Loader2, PlayCircle, Plus, RefreshCw, Search, UsersRound, X } from 'lucide-react';
import API from '../api';
import { useToast } from '../toast';

type StaffTask = {
  _id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  client?: { _id?: string; name?: string; panNumber?: string; phone?: string; whatsappNumber?: string };
};

export default function StaffDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', panNumber: '', phone: '', email: '', serviceType: 'ITR Filing' });

  const loadDashboard = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setData((await API.get('/tasks/staff-dashboard')).data); }
    catch (error: any) { showToast(error.response?.data?.message || 'Could not load your assigned work.', 'error'); }
    finally { if (!quiet) setLoading(false); }
  };
  useEffect(() => { void loadDashboard(); }, []);

  const openWorkspace = async (task: StaffTask) => {
    if (!task.client?._id) return;
    setUpdatingId(task._id);
    try {
      if (task.status === 'Pending') await API.put(`/tasks/staff-tasks/${task._id}/status`, { status: 'In Progress' });
      navigate(`/client/${task.client._id}`);
    } catch (error: any) { showToast(error.response?.data?.message || 'Could not open this client workspace.', 'error'); }
    finally { setUpdatingId(''); }
  };

  const markCompleted = async (taskId: string) => {
    setUpdatingId(taskId);
    try { await API.put(`/tasks/staff-tasks/${taskId}/status`, { status: 'Completed' }); await loadDashboard(true); showToast('Task marked complete.', 'success'); }
    catch (error: any) { showToast(error.response?.data?.message || 'Could not update this task.', 'error'); }
    finally { setUpdatingId(''); }
  };

  const addClient = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingClient(true);
    try {
      await API.post('/clients', newClient);
      setNewClient({ name: '', panNumber: '', phone: '', email: '', serviceType: 'ITR Filing' });
      setShowAddClient(false);
      await loadDashboard(true);
      showToast('Client added to your worklist and the CA dashboard.', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not add client.', 'error');
    } finally { setSavingClient(false); }
  };

  const summary = data?.summary || { total: 0, pending: 0, inProgress: 0, completed: 0, assignedClients: 0 };
  const tasks: StaffTask[] = data?.tasks || [];
  const clientGroups = useMemo(() => {
    const groups = new Map<string, { client: StaffTask['client']; tasks: StaffTask[] }>();
    tasks.forEach((task) => {
      const id = task.client?._id || task._id;
      const group = groups.get(id) || { client: task.client, tasks: [] };
      group.tasks.push(task); groups.set(id, group);
    });
    const query = search.trim().toLowerCase();
    return [...groups.values()].filter(({ client }) => !query || [client?.name, client?.panNumber, client?.phone, client?.whatsappNumber].some((item) => item?.toLowerCase().includes(query)));
  }, [tasks, search]);

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
  const cards = [
    { label: 'My clients', value: summary.assignedClients, icon: UsersRound, tone: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
    { label: 'New work', value: summary.pending, icon: Clock3, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
    { label: 'In progress', value: summary.inProgress, icon: PlayCircle, tone: 'border-sky-100 bg-sky-50 text-sky-700' },
    { label: 'Completed', value: summary.completed, icon: CheckCircle2, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  ];

  return <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8"><div className="mx-auto max-w-6xl space-y-6">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">TaxMeld · CA team workspace</p><h1 className="mt-2 text-3xl font-extrabold text-slate-950">My Client Dashboard</h1><p className="mt-2 text-sm text-slate-500">Hello, {data?.staff?.name || 'Team member'} — only your assigned clients are available here.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setShowAddClient(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"><Plus size={16} /> Add New Client</button><button onClick={() => void loadDashboard()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} /> Refresh</button></div></section>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className={`rounded-2xl border p-4 ${tone}`}><Icon size={18} /><p className="mt-4 text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs font-semibold">{label}</p></div>)}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="relative block"><Search size={18} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my assigned clients by name, PAN or mobile..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600" /></label></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-base font-extrabold text-slate-900">Assigned client workspace</h2><p className="mt-1 text-xs text-slate-500">Open a client to review documents, update workflow and deliver final files.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{clientGroups.length} clients</span></div>{clientGroups.length === 0 ? <div className="p-12 text-center"><ClipboardList className="mx-auto text-slate-300" size={30} /><p className="mt-3 text-sm font-semibold text-slate-600">No assigned clients found.</p><p className="mt-1 text-xs text-slate-500">Your CA will allocate clients from the Team page.</p></div> : <div className="divide-y divide-slate-100">{clientGroups.map(({ client, tasks: clientTasks }, index) => { const openCount = clientTasks.filter((task) => task.status !== 'Completed').length; const completedCount = clientTasks.filter((task) => task.status === 'Completed').length; const primary = clientTasks.find((task) => task.status !== 'Completed') || clientTasks[0]; return <article key={client?._id || index} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-slate-400">CLIENT #{index + 1}</span>{openCount ? <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-800">{openCount} active task{openCount > 1 ? 's' : ''}</span> : <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Completed</span>}</div><h3 className="mt-2 text-lg font-extrabold text-slate-900">{client?.name || 'Client'}</h3><p className="mt-1 text-xs font-bold text-emerald-700">PAN: {client?.panNumber || 'Not provided'} · {client?.phone || client?.whatsappNumber || 'No mobile number'}</p><p className="mt-3 text-sm font-semibold text-slate-700">{clientTasks.map((task) => task.title).join(' · ')}</p><p className="mt-1 text-xs text-slate-500">{completedCount} completed · {openCount} open</p></div><div className="flex shrink-0 flex-wrap gap-2">{client?._id && <button onClick={() => void openWorkspace(primary)} disabled={updatingId === primary._id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><ExternalLink size={14} /> {updatingId === primary._id ? 'Opening...' : 'Open client workspace'}</button>}{primary.status !== 'Completed' && <button onClick={() => void markCompleted(primary._id)} disabled={updatingId === primary._id} className="min-h-10 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100">Mark task complete</button>}</div></div></article>; })}</div>}</section>
    {showAddClient && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><form onSubmit={addClient} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">CA team client</p><h2 className="mt-1 text-xl font-extrabold text-slate-900">Add new client</h2><p className="mt-1 text-xs leading-5 text-slate-500">This client will be assigned to you and appear in your CA's main dashboard.</p></div><button type="button" onClick={() => setShowAddClient(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><label className="block text-xs font-bold text-slate-700">Client name<input required value={newClient.name} onChange={(event) => setNewClient({ ...newClient, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="Full name" /></label><label className="block text-xs font-bold text-slate-700">PAN number<input required value={newClient.panNumber} onChange={(event) => setNewClient({ ...newClient, panNumber: event.target.value.toUpperCase() })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-emerald-600" placeholder="ABCDE1234F" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-slate-700">Mobile number<input required value={newClient.phone} onChange={(event) => setNewClient({ ...newClient, phone: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="9876543210" /></label><label className="block text-xs font-bold text-slate-700">Email <span className="font-normal text-slate-400">(optional)</span><input type="email" value={newClient.email} onChange={(event) => setNewClient({ ...newClient, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="client@email.com" /></label></div><label className="block text-xs font-bold text-slate-700">Service<select value={newClient.serviceType} onChange={(event) => setNewClient({ ...newClient, serviceType: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"><option>ITR Filing</option><option>GST Return</option><option>TDS Compliance</option><option>Accounting & Audit</option></select></label><div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowAddClient(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button disabled={savingClient} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300">{savingClient ? 'Adding...' : 'Add Client'}</button></div></form></div>}
  </div></div>;
}
