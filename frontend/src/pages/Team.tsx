import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, PlusCircle, UserPlus, Users, CheckSquare } from 'lucide-react';
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

  // Task Management States
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [assigningTask, setAssigningTask] = useState(false);

  // Client Search & Selection States for Tasks
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const loadTeam = async () => {
    try { 
      const response = await API.get('/team'); 
      setMembers(response.data.members || []); 
      setSeatLimit(response.data.seatLimit || 5); 

      // Robust client fetch logic (handles both array and object response)
      const clientRes = await API.get('/clients');
      const fetchedClients = Array.isArray(clientRes.data) 
        ? clientRes.data 
        : (clientRes.data.clients || clientRes.data.data || []);
      setClients(fetchedClients);
    }
    catch (error: any) { 
      showToast(error.response?.data?.message || 'Could not load your team.', 'error'); 
      navigate('/'); 
    }

  };

  const loadTasks = async () => {
    try {
      const firmId = members[0]?.firmId || 'default';
      const res = await API.get(`/tasks/team-tasks/${firmId}`);
      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (error) {
      // Handle silent error
    } finally {
      setTaskLoading(false);
    }
  };

  useEffect(() => { 
    const initData = async () => {
      setLoading(true);
      await loadTeam();
      setLoading(false);
    };
    void initData();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      void loadTasks();
    }
  }, [members]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault(); 
    if (inviting) return;
    setInviting(true);
    try { 
      await API.post('/team/invite', { email }); 
      setEmail(''); 
      showToast('Staff invitation sent by email.', 'success'); 
      await loadTeam(); 
    }
    catch (error: any) { 
      showToast(error.response?.data?.message || 'Could not invite staff.', 'error'); 
    }
    finally { 
      setInviting(false); 
    }
  };

  // Filter clients based on search query (Name, PAN, or Phone)
  const filteredClients = clients.filter((c) => {
    const query = clientSearch.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(query);
    const panMatch = c.panNumber?.toLowerCase().includes(query);
    const phoneMatch = c.phone?.includes(query) || c.whatsappNumber?.includes(query);
    return nameMatch || panMatch || phoneMatch;
  });

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle || !assignedStaff || !selectedClient) {
      showToast('Please enter a task title, select staff, and choose a client.', 'error');
      return;
    }
    setAssigningTask(true);
    try {
      const firmId = members[0]?.firmId || 'default';
      const res = await API.post('/tasks/team-task/add', {
        firmId,
        title: taskTitle,
        description: taskDesc,
        assignedTo: assignedStaff,
        client: selectedClient._id
      });
      if (res.data.success) {
        showToast('Task successfully assigned to staff!', 'success');
        setTaskTitle('');
        setTaskDesc('');
        setAssignedStaff('');
        setSelectedClient(null);
        setClientSearch('');
        await loadTasks();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not assign task.', 'error');
    } finally {
      setAssigningTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {/* Back Button */}
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Team Invitation Section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <Users size={16} /> Team workspace
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Add team staff</h1>
              <p className="mt-1 text-sm text-slate-500">Invited staff verify their own email OTP, then work inside your shared client workspace.</p>
            </div>
            <span className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-800">
              {members.length}/{seatLimit} seats
            </span>
          </div>
          
          <form onSubmit={invite} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="staff@yourfirm.com" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600" />
            </div>
            <button disabled={inviting || members.length >= seatLimit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300">
              <UserPlus size={16} /> {inviting ? 'Sending...' : 'Invite staff'}
            </button>
          </form>
          <p className="mt-2 text-[11px] text-slate-500">₹399 CA Professional Plan includes 5 staff seats. Extra ₹99 seats will be enabled with payment verification.</p>
        </section>

        {/* Team Members List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Registered Team Members
          </div>
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-emerald-600" /></div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No staff invitations yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{member.email}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {member.status === 'active' ? 'Email verified · Workspace access active' : 'Invitation sent · Awaiting email verification'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {member.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- TASK & TEAM MANAGEMENT SECTION WITH CLIENT SEARCH --- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <CheckSquare size={16} /> Task & Team Management
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Assign Tasks to Staff</h2>
            <p className="mt-1 text-sm text-slate-500">Create and allocate specific tasks or returns processing work to your team members.</p>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Task Title</label>
              <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g., File ITR for Client X" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
            </div>

            {/* Smart Client Search & Selection Box */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Search & Select Client</label>
              <input 
                type="text" 
                value={selectedClient ? `${selectedClient.name} (PAN: ${selectedClient.panNumber || 'N/A'}, Ph: ${selectedClient.phone || selectedClient.whatsappNumber || 'N/A'})` : clientSearch} 
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setSelectedClient(null);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Type client name, PAN or mobile number to search..." 
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 bg-white" 
              />
              
              {showClientDropdown && clientSearch && !selectedClient && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500">No matching clients found.</div>
                  ) : (
                    filteredClients.map((c) => (
                      <div 
                        key={c._id} 
                        onClick={() => {
                          setSelectedClient(c);
                          setClientSearch('');
                          setShowClientDropdown(false);
                        }} 
                        className="cursor-pointer border-b border-slate-100 p-2.5 text-xs hover:bg-emerald-50"
                      >
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-[11px] text-slate-500">PAN: {c.panNumber || 'N/A'} | Ph: {c.phone || c.whatsappNumber || 'N/A'}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Description (Optional)</label>
              <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Add instructions or document references..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" rows={2} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Assign to Staff Member</label>
              <select required value={assignedStaff} onChange={(e) => setAssignedStaff(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none bg-white focus:border-emerald-600">
                <option value="">Select staff member...</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.email} ({m.status})</option>
                ))}
              </select>
            </div>

            <button disabled={assigningTask || members.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300 w-full sm:w-auto">
              <PlusCircle size={16} /> {assigningTask ? 'Assigning...' : 'Assign Task'}
            </button>
          </form>

          {/* Assigned Tasks List */}
          <div className="border-t border-slate-100 pt-5 mt-6">
            <h3 className="text-sm font-extrabold text-slate-800 mb-3">Active Team Tasks</h3>
            {taskLoading ? (
              <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-emerald-600" size={20} /></div>
            ) : tasks.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200">No tasks assigned to team members yet.</div>
            ) : (
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div key={t._id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{t.title}</h4>
                      {t.description && <p className="mt-0.5 text-xs text-slate-600">{t.description}</p>}
                      <p className="mt-2 text-[11px] font-medium text-slate-500">
                        Assigned to: <span className="font-bold text-slate-700">{t.assignedTo?.email || 'Staff Member'}</span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                      {t.status || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Link to="/pricing" className="inline-block text-xs font-bold text-emerald-700 hover:underline">View subscription plan</Link>
      </div>
    </div>
  );
}