import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, CheckCircle, DollarSign, Search, User, FileText } from 'lucide-react';

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
  clientPhone: string;
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
  
  // View Toggle: 'list' or 'create'
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  
  // Form State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: 'ITR Filing & Consultation', amount: '' }]);
  const [dueDate, setDueDate] = useState('');
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

  // Filter clients based on Name, PAN, or Phone
  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.panNumber?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch) ||
    c.whatsappNumber?.includes(clientSearch)
  );

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
    if (!selectedClient) {
      alert('Please select a client first.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/billing/create', {
        firmId,
        clientId: selectedClient._id,
        lineItems,
        dueDate
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setToast('Detailed Invoice created successfully!');
        setViewMode('list');
        setLineItems([{ description: 'ITR Filing & Consultation', amount: '' }]);
        setSelectedClient(null);
        setClientSearch('');
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
        setToast('Marked as Paid & Professional Invoice sent to client email!');
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
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => viewMode === 'create' ? setViewMode('list') : navigate('/dashboard')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition cursor-pointer">
            <ArrowLeft size={18} /> {viewMode === 'create' ? 'Back to Invoices' : 'Back to Dashboard'}
          </button>
          {viewMode === 'list' && (
            <button onClick={() => setViewMode('create')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition text-sm cursor-pointer">
              <Plus size={18} /> Create Detailed Invoice
            </button>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-sm font-bold flex items-center justify-between shadow-sm">
            <span>{toast}</span>
          </div>
        )}

        {/* VIEW MODE: CREATE DETAILED INVOICE (Full Spacious Page View) */}
        {viewMode === 'create' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                <FileText size={16} /> Enterprise Billing Builder
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Create Detailed Professional Invoice</h1>
              <p className="text-sm text-slate-500 mt-1">Search client by name, PAN or phone, add customized line items, and issue official billing.</p>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              
              {/* Client Selection Section */}
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
                        <p className="text-xs text-slate-500">PAN: <span className="font-mono font-semibold text-slate-700">{selectedClient.panNumber || 'N/A'}</span> | Phone: <span className="font-semibold text-slate-700">{selectedClient.phone || selectedClient.whatsappNumber || 'N/A'}</span></p>
                        <p className="text-xs text-slate-500">Email: <span className="text-slate-700">{selectedClient.email || 'N/A'}</span></p>
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
                        placeholder="Type client name, PAN or mobile number to search..."
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
                                <p className="text-xs text-slate-500">PAN: {c.panNumber || 'N/A'} | Ph: {c.phone || c.whatsappNumber || 'N/A'}</p>
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

              {/* Line Items Builder */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase text-slate-700">2. Itemized Services & Professional Fees</label>
                  <button type="button" onClick={handleAddLineItem} className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer">
                    <Plus size={14} /> Add Service Item
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input 
                        type="text" 
                        placeholder="Service Description (e.g. ITR-3 Filing & Capital Gain Computation)" 
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        required
                        className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input 
                        type="number" 
                        placeholder="Amount (₹)" 
                        value={item.amount}
                        onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                        required
                        className="w-36 p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => handleRemoveLineItem(index)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">3. Payment Due Date (Optional)</label>
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full md:w-1/3 p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setViewMode('list')} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer">
                  Generate & Save Invoice
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* VIEW MODE: INVOICE LIST */
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                <DollarSign size={16} /> Billing & Revenue Manager
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Client Invoices & Fee Tracking</h1>
              <p className="text-sm text-slate-500 mt-1">Manage professional fees, track pending client payments, and record invoice statuses.</p>
            </div>

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
                      <h3 className="text-base font-extrabold text-slate-900">{inv.clientName} <span className="text-xs font-normal text-slate-500">(PAN: {inv.clientPan || 'N/A'} | Ph: {inv.clientPhone || 'N/A'})</span></h3>
                      
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
          </div>
        )}

      </div>
    </div>
  );
}