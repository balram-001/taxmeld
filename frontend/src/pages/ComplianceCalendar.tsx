import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Calendar, CheckCircle, Tag } from 'lucide-react';

interface ComplianceItem {
  _id: string;
  title: string;
  category: 'GST' | 'Income Tax' | 'TDS' | 'ROC' | 'Other';
  dueDate: string;
  description?: string;
  status: 'Upcoming' | 'Completed' | 'Overdue';
}

export default function ComplianceCalendar() {
  const navigate = useNavigate();
  const [compliances, setCompliances] = useState<ComplianceItem[]>([]);
  const [firmId, setFirmId] = useState('');
  
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'GST' | 'Income Tax' | 'TDS' | 'ROC' | 'Other'>('GST');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const profileRes = await axios.get('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }));
      let currentFirmId = profileRes.data?.firmId;

      if (!currentFirmId) {
        const teamRes = await axios.get('/api/team', { headers: { Authorization: `Bearer ${token}` } });
        currentFirmId = teamRes.data.members?.[0]?.firmId?._id || teamRes.data.members?.[0]?.firmId;
      }

      if (currentFirmId) {
        setFirmId(currentFirmId);
        fetchCompliances(currentFirmId, token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompliances = async (fId: string, token: string | null) => {
    try {
      const res = await axios.get(`/api/compliance?firmId=${fId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setCompliances(res.data.compliances);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId) {
      alert('Firm ID is missing. Please refresh.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/compliance/create', {
        firmId,
        title,
        category,
        dueDate,
        description
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setToast('Compliance deadline added successfully!');
        setViewMode('list');
        setTitle('');
        setDueDate('');
        setDescription('');
        fetchCompliances(firmId, token);
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save deadline.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`/api/compliance/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setToast(`Compliance status updated to ${newStatus}!`);
        fetchCompliances(firmId, token);
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this compliance deadline?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/compliance/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setToast('Compliance deadline deleted successfully');
      fetchCompliances(firmId, token);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <button onClick={() => viewMode === 'create' ? setViewMode('list') : navigate('/dashboard')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition cursor-pointer">
            <ArrowLeft size={18} /> {viewMode === 'create' ? 'Back to Calendar' : 'Back to Dashboard'}
          </button>
          {viewMode === 'list' && (
            <button onClick={() => setViewMode('create')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition text-sm cursor-pointer">
              <Plus size={18} /> Add Tax Deadline
            </button>
          )}
        </div>

        {toast && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-bold flex items-center justify-between shadow-sm">
            <span>{toast}</span>
          </div>
        )}

        {viewMode === 'create' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Calendar size={16} /> Statutory Due Date Manager
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Add Compliance Deadline</h1>
              <p className="text-sm text-slate-500 mt-1">Track GST, TDS, Income Tax or ROC filing deadlines for your firm.</p>
            </div>

            <form onSubmit={handleCreateCompliance} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Deadline Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. GSTR-3B Filing for March" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Category / Tax Type</label>
                  <select 
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="GST">GST</option>
                    <option value="Income Tax">Income Tax</option>
                    <option value="TDS">TDS</option>
                    <option value="ROC">ROC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description / Notes (Optional)</label>
                  <textarea 
                    placeholder="Add any specific guidelines or applicability notes..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer">
                  Save Deadline
                </button>
              </div>

            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <Calendar size={16} /> CA Practice Compliance Calendar
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">Tax Deadlines & Statutory Calendar</h1>
                <p className="text-sm text-slate-500 mt-1">Never miss a statutory due date with centralized tracking.</p>
              </div>
            </div>

            <div className="space-y-4">
              {compliances.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500 shadow-sm">
                  No compliance deadlines added yet. Click on <strong>"Add Tax Deadline"</strong> to add one.
                </div>
              ) : (
                compliances.map((item) => (
                  <div key={item._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-700 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          <Tag size={12} /> {item.category}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                      {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status !== 'Completed' && (
                        <button onClick={() => handleStatusChange(item._id, 'Completed')} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-sm transition cursor-pointer">
                          <CheckCircle size={15} /> Mark Completed
                        </button>
                      )}
                      {item.status === 'Completed' && (
                        <button onClick={() => handleStatusChange(item._id, 'Upcoming')} className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-4 py-2 rounded-lg text-xs transition cursor-pointer">
                          Mark Upcoming
                        </button>
                      )}
                      <button onClick={() => handleDelete(item._id)} className="p-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer" title="Delete Deadline">
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