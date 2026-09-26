import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClientDetails = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`https://taxmeld-backend.vercel.app/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClient(res.data);
      } catch (err) {
        console.error('Error fetching client details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [id, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading client workflow...</div>;
  }

  if (!client) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Client not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          ← Back to Dashboard
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
                📞 {client.mobile} &bull; <span className="font-mono font-semibold text-slate-700">{client.pan}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Workflow & Actions Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Client Workflow & Tasks</h3>
          <p className="text-sm text-slate-600">Yahan aap is client ke saare tasks, document status aur reminders manage kar sakte hain.</p>
          
          {/* Aap yahan apne workflow components ya status updaters add kar sakte hain */}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;