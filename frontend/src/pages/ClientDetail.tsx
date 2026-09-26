import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { BACKEND_URL } from '../config';
import { useToast } from '../toast';
import {
  ArrowLeft, CheckCheck, Download, ExternalLink, Eye, FileText,
  Loader2, SlidersHorizontal, Upload,
} from 'lucide-react';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tab, setTab] = useState<'overview' | 'workflow'>('overview');
  const [finalFiles, setFinalFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const uploadInFlight = useRef(false);

  const loadWorkflow = async (trackingToken: string) => {
    setLoadingTasks(true);
    try {
      const response = await API.get(`/tasks/public/${trackingToken}`);
      setTasks(response.data.tasks || []);
    } catch (error: any) {
      setTasks([]);
      showToast(error.response?.data?.message || 'Could not load the client workflow.', 'error');
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    const loadClient = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      if (id.startsWith('demo-')) {
        try {
          const demoClient = JSON.parse(localStorage.getItem('taxmeld_demo_client') || 'null');
          setClient(demoClient?._id === id ? demoClient : null);
        } catch {
          setClient(null);
        } finally {
          setLoading(false);
          setLoadingTasks(false);
        }
        return;
      }

      try {
        const response = await API.get(`/clients/${id}`);
        setClient(response.data);
        await loadWorkflow(response.data.trackingToken);
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Could not load client details.', 'error');
        setClient(null);
        setLoadingTasks(false);
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [id]);

  const finalTask = useMemo(
    () => tasks.find((task) => task.title === 'Acknowledgement Generated' || task.documentType === 'ITR Acknowledgement'),
    [tasks]
  );
  const finalDocuments = finalTask?.files || [];
  const serviceLabel = client?.serviceType || 'Compliance';

  const uploadFinalDocuments = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!client || uploadInFlight.current || finalFiles.length === 0) return;
    if (String(client._id).startsWith('demo-')) {
      showToast('Document delivery is available after creating your account.', 'error');
      return;
    }

    uploadInFlight.current = true;
    setUploading(true);
    const payload = new FormData();
    finalFiles.forEach((file) => payload.append('files', file));

    try {
      await API.post(`/tasks/ca-upload-ack/${client._id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFinalFiles([]);
      setReplacing(false);
      await loadWorkflow(client.trackingToken);
      showToast('Final document uploaded and client workflow completed.', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Could not upload the final document.', 'error');
    } finally {
      setUploading(false);
      uploadInFlight.current = false;
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await API.put(`/tasks/${taskId}`, { status });
      setTasks((current) => current.map((task) => task._id === taskId ? { ...task, status } : task));
    } catch {
      showToast('Could not update the workflow stage.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <p className="text-slate-600 font-semibold text-sm">Loading client workspace...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-red-600 font-semibold text-base">Client not found or session expired.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">{serviceLabel}</span>
              <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 truncate">{client.name}</h1>
              <p className="mt-1 text-xs text-slate-500">PAN: <span className="font-mono font-bold text-emerald-700">{client.panNumber}</span></p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-slate-500">{client.phone || client.whatsappNumber || 'No phone'}</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setTab('workflow')} className={`min-h-11 rounded-xl text-xs font-bold inline-flex justify-center items-center gap-1.5 transition cursor-pointer ${tab === 'workflow' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
            <SlidersHorizontal size={15} /> Workflow
          </button>
          <button onClick={() => setTab('overview')} className={`min-h-11 rounded-xl text-xs font-bold inline-flex justify-center items-center gap-1.5 transition cursor-pointer ${tab === 'overview' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
            <Eye size={15} /> View Client
          </button>
          <Link to={`/track/${client.trackingToken}`} target="_blank" rel="noreferrer" className="col-span-2 min-h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold inline-flex justify-center items-center gap-1.5 hover:bg-emerald-100 transition">
            <ExternalLink size={15} /> Client Portal
          </Link>
        </div>

        {tab === 'overview' ? (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Client Details</h2>
              <p className="mt-1 text-xs text-slate-500">Review the client record and live document status.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-[10px] uppercase font-bold text-slate-500">Email</p><p className="mt-1 text-sm font-semibold text-slate-800 break-all">{client.email || 'Not provided'}</p></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-[10px] uppercase font-bold text-slate-500">Phone</p><p className="mt-1 text-sm font-semibold text-slate-800">{client.phone || client.whatsappNumber || 'Not provided'}</p></div>
            </div>
            <WorkflowSummary tasks={tasks} loading={loadingTasks} />
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Filing Workflow</h2>
              <p className="mt-1 text-xs text-slate-500">Upload the final ITR, GST, TDS, audit, or acknowledgement document, then update each filing stage.</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-900"><CheckCheck size={17} className="text-emerald-600" /> Deliver Final {serviceLabel} Document</div>
                {finalDocuments.length > 0 && !replacing && <button onClick={() => setReplacing(true)} className="text-xs font-bold text-emerald-800 bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 cursor-pointer">Replace files</button>}
              </div>

              {finalDocuments.length > 0 && !replacing ? (
                <div className="space-y-2">
                  {finalDocuments.map((file: any, index: number) => (
                    <a key={`${file.fileUrl}-${index}`} href={`${BACKEND_URL}${file.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl bg-white border border-emerald-100 p-3">
                      <span className="min-w-0 flex items-center gap-2"><FileText size={18} className="text-emerald-600 shrink-0" /><span className="truncate text-xs font-bold text-slate-800">{file.originalFileName || 'Final document'}</span></span>
                      <Download size={16} className="text-emerald-700 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <form onSubmit={uploadFinalDocuments} className="space-y-3">
                  <input type="file" multiple required accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setFinalFiles(Array.from(event.target.files || []))} className="w-full rounded-lg border border-emerald-200 bg-white p-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-emerald-100 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-emerald-800" />
                  <button type="submit" disabled={uploading || finalFiles.length === 0} className="w-full min-h-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold inline-flex justify-center items-center gap-2 cursor-pointer">
                    {uploading ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}{replacing ? 'Replace Final Files' : 'Upload & Complete Workflow'}
                  </button>
                  {replacing && <button type="button" onClick={() => setReplacing(false)} className="w-full text-xs font-semibold text-slate-500">Cancel replacement</button>}
                </form>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wide font-bold text-slate-500">Update filing stages</h3>
              {loadingTasks ? <div className="py-5 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" size={20} /></div> : tasks.map((task) => (
                <div key={task._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{task.title}</p><p className="truncate text-[10px] text-slate-500">{task.remarks || 'No notes'}</p></div>
                  <select value={task.status} onChange={(event) => updateTaskStatus(task._id, event.target.value)} className="shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800"><option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option></select>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

function WorkflowSummary({ tasks, loading }: { tasks: any[]; loading: boolean }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase font-bold tracking-wide text-slate-500">Documents & stages</h3>
      {loading ? <div className="py-5 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" size={20} /></div> : tasks.length === 0 ? <p className="text-xs text-slate-400">No workflow stages are available yet.</p> : tasks.map((task) => (
        <div key={task._id} className="flex justify-between gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50">
          <div><p className="text-xs font-bold text-slate-800">{task.title}</p><p className="mt-0.5 text-[10px] text-slate-500">{task.remarks || 'No notes'}</p></div>
          <span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : task.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>{task.status}</span>
        </div>
      ))}
    </div>
  );
}

export default ClientDetail;
