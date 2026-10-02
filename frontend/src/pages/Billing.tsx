import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, DollarSign } from 'lucide-react';
import API from '../api';
import { useToast } from '../toast';

export default function Billing() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      // 1. Fetch clients for dropdown selection
      const clientRes = await API.get('/clients');
      const fetchedClients = Array.isArray(clientRes.data) 
        ? clientRes.data 
        : (clientRes.data.clients || clientRes.data.data || []);
      setClients(fetchedClients);

      // 2. Fetch firmId from team API
      const teamRes = await API.get('/team');
      const firmId = teamRes.data.members?.[0]?.firmId || 'default';

      // 3. Fetch Invoices
      const invRes = await API.get(`/billing/${firmId}`);
      if (invRes.data.success) {
        setInvoices(invRes.data.invoices || []);
      }
    } catch (error: any) {
      showToast('Could not load billing data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !clientId) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const teamRes = await API.get('/team');
      const firmId = teamRes.data.members?.[0]?.firmId || 'default';

      await API.post('/billing', {
        firmId,
        clientId,
        title,
        amount: Number(amount),
        dueDate
      });

      showToast('Invoice created successfully!', 'success');
      setTitle('');
      setAmount('');
      setClientId('');
      setDueDate('');
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not create invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await API.put(`/billing/${id}`, { status: newStatus });
      showToast('Invoice status updated!', 'success');
      await loadData();
    } catch (error: any) {
      showToast('Could not update status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await API.delete(`/billing/${id}`);
      showToast('Invoice deleted successfully.', 'success');
      await loadData();
    } catch (error: any) {
      showToast('Could not delete invoice.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus size={16} /> Create Invoice
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <DollarSign size={16} /> Billing & Revenue
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Client Invoices & Fee Tracking</h1>
          <p className="text-sm text-slate-500">Manage professional fees, track pending client payments, and record invoice statuses.</p>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
              No invoices created yet. Click on "Create Invoice" to add one.
            </div>
          ) : (
            invoices.map((inv: any) => (
              <div key={inv._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{inv.title}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Client: <span className="font-bold text-slate-800">{inv.clientId?.name || 'N/A'}</span> (PAN: {inv.clientId?.panNumber || 'N/A'})
                  </p>
                  <p className="text-xs font-bold text-emerald-700">Amount: ₹{inv.amount}</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => handleUpdateStatus(inv._id, inv.status)} 
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${inv.status === 'Paid' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}
                  >
                    {inv.status === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
                  </button>
                  <button 
                    onClick={() => handleDelete(inv._id)} 
                    className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 border border-red-200"
                    title="Delete Invoice"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Invoice Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Create New Invoice</h3>
              <form onSubmit={handleCreateInvoice} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Select Client</label>
                  <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none bg-white focus:border-emerald-600">
                    <option value="">Choose client...</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.panNumber || 'No PAN'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Service / Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., ITR Filing / GST Return Fee" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Amount (₹)</label>
                  <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 2500" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1">Due Date (Optional)</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 bg-white" />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300">
                    Cancel
                  </button>
                  <button disabled={submitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                    {submitting ? 'Creating...' : 'Save Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}