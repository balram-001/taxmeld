import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing, CheckCircle2, Clock3, FileUp, Loader2, Users } from 'lucide-react';
import API from '../api';

type Client = {
  _id: string;
  name: string;
  panNumber: string;
  phone?: string;
  whatsappNumber?: string;
  lastClientUploadAt?: string;
  lastFinalDeliveryAt?: string;
};

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

export default function ClientActivity() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await API.get('/clients');
        setClients(response.data || []);
      } finally {
        setLoading(false);
      }
    };
    void loadActivity();
  }, []);

  const rows = useMemo(() => clients.map((client, index) => {
    const uploaded = Boolean(client.lastClientUploadAt);
    const completed = Boolean(client.lastFinalDeliveryAt) && (!client.lastClientUploadAt || new Date(client.lastFinalDeliveryAt!).getTime() >= new Date(client.lastClientUploadAt).getTime());
    return { client, index, uploaded, completed };
  }), [clients]);

  const pendingCount = rows.filter((row) => row.uploaded && !row.completed).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700"><ArrowLeft size={16} /> Back</button>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700"><BellRing size={16} /> Client activity</div>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Document notifications</h1>
              <p className="mt-1 text-sm text-slate-500">A saved record of every client’s upload and final-delivery status.</p>
            </div>
            <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${pendingCount ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {pendingCount ? `${pendingCount} client${pendingCount > 1 ? 's' : ''} awaiting review` : 'All client uploads are up to date'}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={26} /></div> : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No clients have been added yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-4">Client</th><th className="px-5 py-4">PAN / mobile</th><th className="px-5 py-4">Client document upload</th><th className="px-5 py-4">Final delivery</th><th className="px-5 py-4">Current status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ client, index, uploaded, completed }) => (
                    <tr key={client._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4"><button onClick={() => navigate(`/client/${client._id}`)} className="text-left font-bold text-slate-900 hover:text-emerald-700">Client #{index + 1} — {client.name}</button></td>
                      <td className="px-5 py-4"><p className="font-mono text-xs font-bold text-emerald-700">{client.panNumber}</p><p className="mt-1 text-xs text-slate-500">{client.phone || client.whatsappNumber || 'No mobile number'}</p></td>
                      <td className="px-5 py-4">{uploaded ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800"><FileUp size={15} /> Uploaded · {formatDate(client.lastClientUploadAt)}</span> : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Clock3 size={15} /> Not uploaded</span>}</td>
                      <td className="px-5 py-4">{client.lastFinalDeliveryAt ? <span className="text-xs font-semibold text-emerald-800">Delivered · {formatDate(client.lastFinalDeliveryAt)}</span> : <span className="text-xs font-semibold text-slate-400">Not delivered</span>}</td>
                      <td className="px-5 py-4">{completed ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 size={14} /> Completed</span> : uploaded ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800"><Clock3 size={14} /> Review required</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Waiting for client</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"><Users size={15} /> Open dashboard</Link>
      </div>
    </div>
  );
}
