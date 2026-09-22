import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { BACKEND_URL } from '../config';
import { useToast } from '../toast';
import { 
  Loader2, Upload, FileText, ArrowLeft, Eye, Download, Trash2, CheckCheck, X, Plus 
} from 'lucide-react';

const AVAILABLE_SERVICES = [
  { id: 'ITR Filing', label: 'ITR Filing', hint: 'Form 16, Bank Statement, AIS/TIS' },
  { id: 'GST Return', label: 'GST Return', hint: 'Sales/Purchase invoices, GSTR Reports' },
  { id: 'TDS Compliance', label: 'TDS Compliance', hint: 'TDS Challan 281, Deduction sheets' },
  { id: 'Accounting & Audit', label: 'Accounting & Audit', hint: 'Trial balance, ledgers, stock sheet' }
];

export default function ClientTracker() {
  const { showToast } = useToast();
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingStatus, setUploadingStatus] = useState<{ category: string; count: number } | null>(null);

  // Additional custom slots added by client/user
  const [extraCustomReqs, setExtraCustomReqs] = useState<{ name: string; hint: string }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocHint, setNewDocHint] = useState('');

  const [viewDocOpen, setViewDocOpen] = useState(false);
  const [previewTargetDoc, setPreviewTargetDoc] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await API.get(`/tasks/public/${token}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const finalAckTask = data?.tasks?.find(
    (t: any) => (t.title === 'Acknowledgement Generated' || t.documentType === 'ITR Acknowledgement') && t.files?.length > 0
  );
  const ackFileItem = finalAckTask?.files?.[0];

  const handleMultipleUpload = async (category: string, filesList: FileList) => {
    if (!filesList || filesList.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < filesList.length; i++) {
      formData.append('files', filesList[i]);
    }
    formData.append('serviceCategory', category);

    setUploadingStatus({ category, count: filesList.length });
    try {
      await API.post(`/tasks/upload/${token}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchStatus();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploadingStatus(null);
    }
  };

  const handleDeleteFile = async (taskId: string, fileIndex: number) => {
    try {
      await API.delete(`/tasks/upload/${token}/file/${taskId}/${fileIndex}`);
      await fetchStatus();
    } catch (err: any) {
      showToast('That document is no longer available. Refresh the page and try again.', 'error');
    }
  };

  const handleAddExtraSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    setExtraCustomReqs([...extraCustomReqs, { name: newDocName.trim(), hint: newDocHint.trim() }]);
    setNewDocName('');
    setNewDocHint('');
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={30} />
        <p className="text-slate-500 text-xs">Loading Status...</p>
      </div>
    );
  }

  if (!data || !data.client) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <div className="p-6 bg-white border border-rose-200 rounded-2xl shadow-sm">
          <p className="text-rose-600 font-semibold text-sm mb-4">Invalid or Expired Link</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const selectedServices = data.client.serviceType 
    ? data.client.serviceType.split(', ').filter(Boolean) 
    : [];

  const expandedSlots: any[] = [];
  selectedServices.forEach((serviceName: string) => {
    if (serviceName === 'ITR Filing') {
      expandedSlots.push(
        { name: 'Form 16', hint: 'TDS certificate issued by employer', isCustom: false },
        { name: 'Bank Statement', hint: 'Savings/Current account statement for FY', isCustom: false },
        { name: 'AIS / TIS / 26AS', hint: 'Annual Information Statement from tax portal', isCustom: false }
      );
    } else if (serviceName === 'GST Return') {
      expandedSlots.push(
        { name: 'Sales Invoices', hint: 'B2B/B2C sales bills', isCustom: false },
        { name: 'Purchase Invoices', hint: 'Input tax credit bills', isCustom: false }
      );
    } else {
      expandedSlots.push({
        name: serviceName,
        hint: AVAILABLE_SERVICES.find((s) => s.id === serviceName)?.hint || '',
        isCustom: false,
      });
    }
  });

  const allRequirementSlots = [
    ...expandedSlots,
    ...(data.client.customRequirements || []).map((cr: any) => ({
      name: cr.name,
      hint: cr.hint || '',
      isCustom: true,
    })),
    ...extraCustomReqs.map((cr) => ({
      name: cr.name,
      hint: cr.hint || '',
      isCustom: true,
    }))
  ];

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">{data.client.name}</h1>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedServices.map((srv: string, idx: number) => (
              <span key={idx} className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                {srv}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">PAN</p>
          <p className="font-mono text-xs sm:text-sm font-bold text-slate-800">{data.client.panNumber}</p>
        </div>
      </div>

      {ackFileItem && (() => {
        const service = (data.client.serviceType || '').toLowerCase();
        const isGST = service.includes('gst');
        const isTDS = service.includes('tds');
        const isITR = service.includes('itr') || service.includes('income tax');

        const bannerTitle = isGST 
          ? 'GST Return Filed Successfully!' 
          : isTDS 
          ? 'TDS Compliance Completed!' 
          : isITR 
          ? 'Tax Return Filed Successfully!' 
          : 'Work Completed Successfully!';

        const bannerDesc = isGST
          ? 'Your GST Return has been filed successfully. Download your official GSTR acknowledgement below:'
          : isTDS
          ? 'Your TDS compliance has been completed. Download your official TDS receipt below:'
          : isITR
          ? 'Your ITR has been filed successfully. Download your original ITR-V acknowledgement receipt below:'
          : 'Your compliance work has been completed. Download your verified final document below:';

        const btnLabel = isGST 
          ? 'Download GST Receipt' 
          : isTDS 
          ? 'Download TDS Receipt' 
          : isITR 
          ? 'Download ITR-V Receipt' 
          : 'Download Final Document';

        return (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-2">
            <div className="flex items-center gap-2">
              <CheckCheck className="text-emerald-200" size={22} />
              <h2 className="text-sm sm:text-base font-bold">{bannerTitle}</h2>
            </div>
            <p className="text-xs text-emerald-100">{bannerDesc}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(finalAckTask.files || []).map((file: any, index: number) => (
                <a
                  key={`${file.fileUrl}-${index}`}
                  href={`${BACKEND_URL}/api/tasks/download/${token}/${finalAckTask._id}/${index}`}
                  download={file.originalFileName || 'Final_Document.pdf'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-lg shadow-sm hover:bg-emerald-50 transition cursor-pointer"
                >
                  <Download size={14} /> {(finalAckTask.files || []).length > 1 ? `Download File ${index + 1}` : btnLabel}
                </a>
              ))}
              <button
                onClick={() => {
                  setPreviewTargetDoc(ackFileItem);
                  setViewDocOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                <Eye size={13} /> Quick View
              </button>
            </div>
          </div>
        );
      })()}

      {/* Compact & Professional Document Submissions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Upload size={15} className="text-emerald-600" /> Document Submissions
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">Upload requested files into their respective slots:</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-200"
          >
            <Plus size={13} /> Add More
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          {allRequirementSlots.map((slot: any, idx: number) => {
            const matchedTask = data.tasks?.find(
              (t: any) => t.documentType === 'Client Document' && t.serviceCategory === slot.name
            );

            const uploadedFilesList = matchedTask?.files || [];
            const isUploadingThis = uploadingStatus?.category === slot.name;
            const inputId = `file-input-${idx}`;

            return (
              <div key={idx} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${slot.isCustom ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                    <h3 className="text-xs font-bold text-slate-900 truncate">{slot.name}</h3>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full shrink-0">
                      {uploadedFilesList.length} Uploaded
                    </span>
                  </div>
                  {slot.hint && <p className="text-[11px] text-slate-500 mt-0.5 pl-4 truncate">{slot.hint}</p>}

                  {/* Uploaded files list inside the small card */}
                  {uploadedFilesList.length > 0 && (
                    <div className="mt-2 space-y-1.5 pl-4">
                      {uploadedFilesList.map((fileObj: any, fIdx: number) => (
                        <div key={fIdx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText size={13} className="text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-800 truncate">{fileObj.originalFileName}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setPreviewTargetDoc(fileObj);
                                setViewDocOpen(true);
                              }}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-semibold transition cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteFile(matchedTask._id, fIdx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 pt-1 sm:pt-0">
                  <input
                    id={inputId}
                    type="file"
                    multiple
                    disabled={isUploadingThis}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleMultipleUpload(slot.name, e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor={inputId}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition w-full sm:w-auto ${
                      isUploadingThis
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 shadow-2xs'
                    }`}
                  >
                    {isUploadingThis ? (
                      <>
                        <Loader2 className="animate-spin text-emerald-600" size={13} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={13} className="text-emerald-600" />
                        <span>{uploadedFilesList.length > 0 ? '+ Add More' : 'Upload'}</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add More Button Bottom Bar */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer py-1"
          >
            <Plus size={14} /> Need to upload any other document? Add custom slot
          </button>
        </div>
      </div>

      {/* Filing Status Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Filing Status Timeline</h2>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
          {(data.tasks && data.tasks.length > 0
            ? data.tasks.filter((t: any) => t.documentType !== 'Client Document' || t.title === 'Documents Uploaded')
            : []
          ).map((task: any, index: number) => {
            const isCompleted = task.status === 'Completed' || task.status === 'Uploaded';
            const isInProgress = task.status === 'In Progress';

            return (
              <div key={task._id || index} className="relative flex items-start gap-3 pl-8">
                <div
                  className={`absolute left-1 top-1 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isInProgress
                      ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                <div className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-semibold text-slate-900 text-xs">{task.title}</h3>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  {task.remarks && <p className="text-slate-500 text-[10px]">{task.remarks}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Custom Document Slot</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddExtraSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rent Agreement"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Instructions / Hint (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 11 Months PDF scan"
                  value={newDocHint}
                  onChange={(e) => setNewDocHint(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewDocOpen && previewTargetDoc?.fileUrl && (() => {
        const fileUrl = `${BACKEND_URL}${previewTargetDoc.fileUrl}`;
        const rawName = previewTargetDoc.originalFileName || previewTargetDoc.fileUrl;
        const ext = rawName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
        const isPdf = ext === 'pdf';
        const isTextOrCode = ['sql', 'txt', 'csv', 'json', 'log', 'xml'].includes(ext);

        return (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <button
                  onClick={() => setViewDocOpen(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div className="text-center truncate max-w-xs px-2">
                  <p className="text-xs font-semibold text-slate-800 truncate">{previewTargetDoc.originalFileName || 'Document'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl}
                    download={previewTargetDoc.originalFileName || 'document'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                    title="Download"
                  >
                    <Download size={15} />
                  </a>
                  <button
                    onClick={() => setViewDocOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-auto flex items-center justify-center">
                {isImage ? (
                  <img src={fileUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : isPdf || isTextOrCode ? (
                  <iframe src={fileUrl} className="w-full h-full rounded border-0 bg-white shadow-inner" title="Preview" />
                ) : (
                  <div className="text-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm max-w-sm w-full space-y-3">
                    <FileText size={26} className="text-emerald-600 mx-auto" />
                    <p className="font-semibold text-slate-800 text-xs">{previewTargetDoc.originalFileName}</p>
                    <a
                      href={fileUrl}
                      download={previewTargetDoc.originalFileName}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      <Download size={13} /> Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}