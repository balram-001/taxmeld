import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Clock, Search, User, Briefcase } from 'lucide-react';

interface TimeLog {
  _id: string;
  clientName: string;
  taskName: string;
  hoursSpent: number;
  date: string;
  notes?: string;
}

export default function TimeTracking() {
  const navigate = useNavigate();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [firmId, setFirmId] = useState('');
  
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  
  // Form State
  const [taskName, setTaskName] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number | ''>('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const teamRes = await axios.get('/api/team', { headers: { Authorization: `Bearer ${token}` } });
      const currentFirmId = teamRes.data.members?.[0]?.firmId?._id || teamRes.data.members?.[0]?.firmId;
      if (currentFirmId) {
        setFirmId(currentFirmId);
        fetchTimeLogs(currentFirmId, token);
        fetchClients(currentFirmId, token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimeLogs = async (fId: string, token: string | null) => {
    try {
      const res = await axios.get(`/api/timetracking?firmId=${fId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setTimeLogs(res.data.timeLogs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async (fId: string, token: string | null) => {
    try {
      const res = await axios.get(`/api/clients?firmId=${fId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setClients(res.data.clients || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.panNumber?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch)
  );

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Please search and select a client first.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/timetracking/create', {
        firmId,
        clientId: selectedClient._id,
        taskName,
        hoursSpent,
        date: logDate,
        notes
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setToast('Time log recorded successfully!');
        setViewMode('list');
        setTaskName('');
        setHoursSpent('');
        setNotes('');
        setSelectedClient(null);
        setClientSearch('');
        fetchTimeLogs(firmId, token);
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time log?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/timetracking/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setToast('Time log deleted successfully');
      fetchTimeLogs(firmId, token);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const totalHours = timeLogs.reduce((acc, log) => acc + Number(log.hoursSpent || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => viewMode === 'create' ? setViewMode('list') : navigate('/dashboard')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition cursor-pointer">
            <ArrowLeft size={18} /> {viewMode === 'create' ? 'Back to Time Logs' : 'Back to Dashboard'}
          </button>
          {viewMode === 'list' && (
            <button onClick={() => setViewMode('create')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition text-sm cursor-pointer">
              <Plus size={18} /> Log New Hours
            </button>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-bold flex items-center justify-between shadow-sm">
            <span>{toast}</span>
          </div>
        )}

        {/* VIEW MODE: CREATE TIME LOG */}
        {viewMode === 'create' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Clock size={16} /> Billable Hours Manager
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Log Task Working Hours</h1>
              <p className="text-sm text-slate-500 mt-1">Record time spent on client tax filing, audits, or advisory work.</p>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-6">
              
              {/* Client Selection */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase text-slate-700">1. Select Client (Search by Name, PAN or Phone)</label>
                
                {selectedClient ? (
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-emerald-300 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900">{selectedClient.name}</h4>
                        <p className="text-xs text-slate-500">PAN: <span className="font-mono text-slate-700">{selectedClient.panNumber || 'N/A'}</span></p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedClient(null)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
                      Change Client
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Search client by name, PAN or phone..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {clientSearch.trim().length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {filteredClients.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 text-center">No clients found matching "{clientSearch}"</div>
                        ) : (
                          filteredClients.map((c) => (
                            <div 
                              key={c._id} 
                              onClick={() => { setSelectedClient(c); setClientSearch(''); }}
                              className="p-3 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-900">{c.name}</p>
                                <p className="text-xs text-slate-500">PAN: {c.panNumber || 'N/A'}</p>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Select</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">2. Task Name / Description</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ITR-3 Computation & Filing" 
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">3. Hours Spent</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    placeholder="e.g. 2.5" 
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">4. Date</label>
                  <input 
                    type="date" 
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">5. Notes (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Any specific observations..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer">
                  Save Time Log
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* VIEW MODE: TIME LOGS LIST */
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <Clock size={16} /> Billable Hours Tracker
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">Time Tracking & Productivity</h1>
                <p className="text-sm text-slate-500 mt-1">Monitor staff hours spent across various client tasks.</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <span className="text-xs font-bold uppercase text-emerald-700 block">Total Hours Logged</span>
                <span className="text-2xl font-extrabold text-emerald-900">{totalHours} hrs</span>
              </div>
            </div>

            <div className="space-y-4">
              {timeLogs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500 shadow-sm">
                  No time logs recorded yet. Click on <strong>"Log New Hours"</strong> to add one.
                </div>
              ) : (
                timeLogs.map((log) => (
                  <div key={log._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-700">
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          <Briefcase size={12} /> {log.hoursSpent} Hours
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{log.clientName}</h3>
                      <p className="text-sm font-semibold text-slate-700">Task: {log.taskName}</p>
                      {log.notes && <p className="text-xs text-slate-500">Note: {log.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(log._id)} className="p-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer" title="Delete Log">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}