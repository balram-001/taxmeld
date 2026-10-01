import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, PlusCircle, UserPlus, Users, CheckSquare, Eye, X, Trash2 } from 'lucide-react';
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
  const [assigningTask, setAssigningTask] = useState(false);

  // Client Search & Selection States for Tasks (Multiple support)
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Staff Work Modal State
  const [activeStaffWork, setActiveStaffWork] = useState<any>(null);

  const loadTeam = async () => {
    try { 
      const response = await API.get('/team'); 
      setMembers(response.data.members || []); 
      setSeatLimit(response.data.seatLimit || 5); 

      // Robust client fetch logic
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
      // Silent catch
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

  const handleDeleteStaff = async (staffId: string, staffEmail: string, status: string) => {
    const actionText = status === 'active' ? 'permanently delete' : 'cancel the invitation for';
    const confirmDelete = window.confirm(`Are you sure you want to ${actionText} ${staffEmail}?`);
    if (!confirmDelete) return;

    try {
      await API.delete(`/team/${staffId}`);
      await loadTeam();
      // Confirm only after the refreshed list has removed the invite/staff row.
      showToast(status === 'active' ? 'Staff member removed successfully.' : 'Invitation cancelled successfully.', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not process request.', 'error');
    }
  };

  const filteredClients = clients.filter((c) => {
    const query = clientSearch.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(query);
    const panMatch = c.panNumber?.toLowerCase().includes(query);
    const phoneMatch = c.phone?.includes(query) || c.whatsappNumber?.includes(query);
    return (nameMatch || panMatch || phoneMatch) && !selectedClients.some((selected) => selected._id === c._id);
  });

  const handleSelectClient = (client: any) => {
    if (!selectedClients.some((c) => c._id === client._id)) {
      setSelectedClients([...selectedClients, client]);
    }
    setClientSearch('');
    setShowClientDropdown(false);
  };

  const handleRemoveClient = (clientId: string) => {
    setSelectedClients(selectedClients.filter((c) => c._id !== clientId));
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle || !assignedStaff || selectedClients.length === 0) {
      showToast('Please enter task title, select active staff, and choose at least one client.', 'error');
      return;
    }
    setAssigningTask(true);
    try {
      const firmId = members[0]?.firmId || 'default';
      
      for (const client of selectedClients) {
        await API.post('/tasks/team-task/add', {
          firmId,
          title: taskTitle,
          description: taskDesc,
          assignedTo: assignedStaff,
          client: client._id
        });
      }

      showToast('Tasks successfully assigned to staff!', 'success');
      setTaskTitle('');
      setTaskDesc('');
      setAssignedStaff('');
      setSelectedClients([]);
      setClientSearch('');
      await loadTasks();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not assign tasks.', 'error');
    } finally {
      setAssigningTask(false);
    }
  };

  // Only active staff can be assigned tasks
  const activeMembers = members.filter((m) => m.status === 'active');

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
              <p className="mt-1 text-sm text-slate-500">Invited staff verify their email and manage assigned client returns.</p>
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
        </section>

        {/* Team Members List with Live Tracker & Conditional Cancel/Delete */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-slate-700 flex justify-between items-center">
            <span>Registered Team Members & Live Tracker</span>
            <span className="text-[11px] text-slate-500">Staff must log in via link to receive tasks</span>
          </div>
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-emerald-600" /></div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No staff invitations yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => {
                const staffTasks = tasks.filter((t: any) => t.assignedTo?._id === member._id || t.assignedTo === member._id);
                const completedCount = staffTasks.filter((t: any) => t.status === 'Completed').length;
                const pendingCount = staffTasks.length - completedCount;
                const isActive = member.status === 'active';

                return (
                  <div key={member._id} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{member.email}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {isActive ? `Active · ${staffTasks.length} assigned · ${pendingCount} pending/in progress · ${completedCount} completed` : 'Login Pending (Not yet logged in)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <button 
                          onClick={() => setActiveStaffWork({ member, tasks: staffTasks })} 
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        >
                          <Eye size={14} /> View Work
                        </button>
                      ) : (
                        <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 border border-amber-200">
                          Login Pending
                        </span>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteStaff(member._id, member.email, member.status)} 
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                          isActive 
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200' 
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                        }`}
                        title={isActive ? 'Delete Staff' : 'Cancel Invitation'}
                      >
                        <Trash2 size={14} /> {isActive ? 'Delete' : 'Cancel Invite'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* --- TASK ASSIGNMENT SECTION --- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <CheckSquare size={16} /> Task & Client Allocation
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Assign Tasks to Staff</h2>
            <p className="mt-1 text-sm text-slate-500">Select active team members only. Pending staff cannot receive tasks until they log in.</p>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Task Title</label>
              <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g., File ITR / GST Return" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
            </div>

            {/* Selected Clients Chips */}
            {selectedClients.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="mb-2 text-xs font-extrabold text-emerald-800">{selectedClients.length} client{selectedClients.length === 1 ? '' : 's'} selected for this task</p>
                <div className="flex flex-wrap gap-2">
                {selectedClients.map((c) => (
                  <span key={c._id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                    {c.name} ({c.panNumber || 'No PAN'})
                    <button type="button" onClick={() => handleRemoveClient(c._id)} className="text-emerald-600 hover:text-red-600 font-extrabold ml-1">×</button>
                  </span>
                ))}
                </div>
              </div>
            )}

            {/* Client Multi Search */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Search & Add Clients (Select one or more)</label>
              <input 
                type="text" 
                value={clientSearch} 
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Click here, then select multiple clients one by one..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 bg-white" 
              />
              
              {showClientDropdown && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500">{selectedClients.length ? 'All matching clients are already selected.' : 'No matching clients found.'}</div>
                  ) : (
                    filteredClients.slice(0, 30).map((c) => (
                      <div 
                        key={c._id} 
                        onClick={() => handleSelectClient(c)} 
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
              <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Add instructions..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" rows={2} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Assign to Active Staff Member</label>
              <select required value={assignedStaff} onChange={(e) => setAssignedStaff(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none bg-white focus:border-emerald-600">
                <option value="">Select active staff member...</option>
                {activeMembers.length === 0 ? (
                  <option value="" disabled>No active staff available (Ask staff to login via email link)</option>
                ) : (
                  activeMembers.map((m) => (
                    <option key={m._id} value={m._id}>{m.email}</option>
                  ))
                )}
              </select>
            </div>

            <button disabled={assigningTask || activeMembers.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300 w-full sm:w-auto">
              <PlusCircle size={16} /> {assigningTask ? 'Assigning...' : 'Assign Task'}
            </button>
          </form>
        </section>

        {/* Staff Live Work Modal / Drawer */}
        {activeStaffWork && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{activeStaffWork.member.email}</h3>
                  <p className="text-xs text-slate-500">Live assigned tasks & client progress</p>
                </div>
                <button onClick={() => setActiveStaffWork(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs">
                <div><p className="font-extrabold text-slate-900">{activeStaffWork.tasks.length}</p><p className="mt-0.5 text-slate-500">Assigned</p></div>
                <div><p className="font-extrabold text-amber-700">{activeStaffWork.tasks.filter((task: any) => task.status !== 'Completed').length}</p><p className="mt-0.5 text-slate-500">Open</p></div>
                <div><p className="font-extrabold text-emerald-700">{activeStaffWork.tasks.filter((task: any) => task.status === 'Completed').length}</p><p className="mt-0.5 text-slate-500">Completed</p></div>
              </div>

              {activeStaffWork.tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No tasks currently assigned to this staff member.</div>
              ) : (
                <div className="space-y-3">
                  {activeStaffWork.tasks.map((t: any) => (
                    <div key={t._id} className="rounded-xl border border-slate-200 p-3.5 bg-slate-50 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {t.status || 'Pending'}
                        </span>
                      </div>
                      {t.client && (
                        <p className="text-[11px] text-slate-600">
                          Client: <span className="font-bold text-slate-800">{t.client.name}</span> (PAN: {t.client.panNumber || 'N/A'})
                        </p>
                      )}
                      {t.description && <p className="text-[11px] text-slate-500">{t.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-right">
                <button onClick={() => setActiveStaffWork(null)} className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <Link to="/pricing" className="inline-block text-xs font-bold text-emerald-700 hover:underline">View subscription plan</Link>
      </div>
    </div>
  );
}
