import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, CheckCircle, DollarSign } from 'lucide-react';

interface LineItem {
  description: string;
  amount: number | '';
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  clientPan: string;
  clientEmail: string;
  lineItems: LineItem[];
  totalAmount: number;
  status: 'Pending' | 'Paid';
  createdAt: string;
}

export default function Billing() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [firmId, setFirmId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: 'ITR Filing Fee', amount: '' }]);
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
        fetchInvoices(currentFirmId, token);
        fetchClients(currentFirmId, token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async (fId: string, token: string | null) => {
    try {
      const res = await axios.get(`/api/billing?firmId=${fId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setInvoices(res.data.invoices);
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

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: '' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/billing/create', {
        firmId,
        clientId: selectedClientId,
        lineItems
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setToast('Detailed Invoice created successfully!');
        setIsModalOpen(false);
        setLineItems([{ description: 'ITR Filing Fee', amount: '' }]);
        setSelectedClientId('');
        fetchInvoices(firmId, token);
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(`/api/billing/${id}/pay`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setToast('Marked as Paid & Email sent to client!');
        fetchInvoices(firmId, token);
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/billing/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setToast('Invoice deleted successfully');
      fetchInvoices(firmId, token);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition text-sm cursor-pointer">
            <Plus size={18} /> Create Detailed Invoice
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-bold flex items-center justify-between shadow-sm">
            <span>{toast}</span>
          </div>
        )}

        {/* Title Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <DollarSign size={16} /> Billing & Revenue Manager
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Client Invoices & Line-Item Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Manage professional fees, customize line items, and automate client invoice emails.</p>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500 shadow-sm">
              No invoices created yet. Click on <strong>"Create Detailed Invoice"</strong> to add one.
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-700">#{inv.invoiceNumber}</span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{inv.clientName} <span className="text-xs font-normal text-slate-500">(PAN: {inv.clientPan || 'N/A'})</span></h3>
                  
                  {/* Line Items Breakdown */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1 mt-2">
                    <span className="font-bold text-slate-600 block mb-1">Itemized Services:</span>
                    {inv.lineItems?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>• {item.description}</span>
                        <span className="font-semibold">₹{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                  <div className="text-xl font-extrabold text-slate-900">₹{inv.totalAmount}</div>
                  <div className="flex items-center gap-2">
                    {inv.status === 'Pending' && (
                      <button onClick={() => handleMarkPaid(inv._id)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-sm transition cursor-pointer">
                        <CheckCircle size={15} /> Mark Paid & Email
                      </button>
                    )}
                    <button onClick={() => handleDelete(inv._id)} className="p-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer" title="Delete Invoice">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Invoice Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-extrabold text-slate-900">Create Detailed Invoice</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select Client</label>
                  <select 
                    value={selectedClientId} 
                    onChange={(e) => setSelectedClientId(e.target.value)} 
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.panNumber || 'No PAN'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase text-slate-600">Line Items & Fees</label>
                    <button type="button" onClick={handleAddLineItem} className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="Service Description (e.g. ITR Filing)" 
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        required
                        className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input 
                        type="number" 
                        placeholder="Amount (₹)" 
                        value={item.amount}
                        onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                        required
                        className="w-32 p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => handleRemoveLineItem(index)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm">
                    Save Invoice
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