import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api'; // ✅ API helper use karna hai jo token aur baseURL handle kare
import { useToast } from '../toast';
import { Shield, ArrowLeft, Loader2, FileText, Download, ExternalLink, CheckCircle } from 'lucide-react';
import { BACKEND_URL } from '../config';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        // ✅ Correct API endpoint for fetching single client details
        const res = await API.get(`/clients/${id}`);
        setClient(res.data);
      } catch (err: any) {
        console.error('Error fetching client details:', err);
        showToast(err.response?.data?.message || 'Could not load client details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [id, showToast]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <p className="text-slate-600 font-semibold text-sm">Loading client workflow...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-semibold text-base">Client not found.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Client Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
              {client.serviceType || 'ITR Filing'}
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{client.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              📞 {client.phone || client.whatsappNumber || 'No phone'} &bull; <span className="font-mono font-semibold text-slate-700">{client.panNumber}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/track/${client.trackingToken}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
            >
              Open Client Portal <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Workflow & Tasks Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Client Workflow & Requirements</h3>
        <p className="text-xs text-slate-500">Here you can monitor the client's compliance progress and uploaded documents.</p>
        
        {/* Render Services/Requirements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-bold text-slate-700">Assigned Services</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{client.serviceType || 'Standard Filing'}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-bold text-slate-700">Tracking Token</p>
            <p className="text-xs font-mono font-semibold text-emerald-700 mt-1 truncate">{client.trackingToken}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;