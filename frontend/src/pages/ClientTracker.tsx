import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { BACKEND_URL } from '../config';
import { useToast } from '../toast';
import { 
  Loader2, Upload, FileText, ArrowLeft, Eye, Download, Trash2, CheckCheck, X 
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

  const allRequirementSlots = [
    ...selectedServices.map((name: string) => ({
      name,
      hint: AVAILABLE_SERVICES.find((s) => s.id === name)?.hint || '',
      isCustom: false,
    })),
    ...(data.client.customRequirements || []).map((cr: any) => ({
      name: cr.name,
      hint: cr.hint || '',
      isCustom: true,
    })),
  ];

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{data.client.name}</h1>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedServices.map((srv: string, idx: number) => (
              <span key={idx} className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                {srv}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-500">PAN</p>
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
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <CheckCheck className="text-emerald-200" size={24} />
              <h2 className="text-base sm:text-lg font-bold">{bannerTitle}</h2>
            </div>
            <p className="text-xs text-emerald-100">{bannerDesc}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(finalAckTask.files || []).map((file: any, index: number) => (
                <a
                  key={`${file.fileUrl}-${index}`}
                  href={`${BACKEND_URL}/api/tasks/download/${token}/${finalAckTask._id}/${index}`}
                  download={file.originalFileName || 'Final_Document.pdf'}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-50 transition cursor-pointer"
                >
                  <Download size={15} /> {(finalAckTask.files || []).length > 1 ? `Download File ${index + 1}` : btnLabel}
                </a>
              ))}
              <button
                onClick={() => {
                  setPreviewTargetDoc(ackFileItem);
                  setViewDocOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <Eye size={14} /> Quick View
              </button>
            </div>
          </div>
        );
      })()}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Upload size={16} className="text-emerald-600" /> Document Submissions
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Select and upload all requested documents below:
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {allRequirementSlots.map((slot: any, idx: number) => {
            const matchedTask = data.tasks?.find(
              (t: any) => t.documentType === 'Client Document' && t.serviceCategory === slot.name
            );

            const uploadedFilesList = matchedTask?.files || [];
            const isUploadingThis = uploadingStatus?.category === slot.name;
            const inputId = `file-input-${idx}`;

            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${slot.isCustom ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                      {slot.name}
                      {slot.isCustom && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">Custom</span>}
                    </span>
                    {slot.hint && <p className="text-[11px] text-slate-500 mt-0.5">{slot.hint}</p>}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                    {uploadedFilesList.length} Files Uploaded
                  </span>
                </div>

                {uploadedFilesList.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {uploadedFilesList.map((fileObj: any, fIdx: number) => (
                      <div key={fIdx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={16} className="text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-medium text-slate-800 truncate">{fileObj.originalFileName}</p>
                            <p className="text-[9px] text-slate-400">
                              {fileObj.uploadedAt ? new Date(fileObj.uploadedAt).toLocaleDateString() : 'Received'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setPreviewTargetDoc(fileObj);
                              setViewDocOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-semibold transition cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteFile(matchedTask._id, fIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
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
                    className={`w-full py-2.5 px-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition ${
                      isUploadingThis
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                  >
                    {isUploadingThis ? (
                      <>
                        <Loader2 className="animate-spin text-emerald-600" size={15} />
                        <span>Uploading {uploadingStatus?.count} file(s)...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-emerald-600" />
                        <span>{uploadedFilesList.length > 0 ? '+ Add More Files' : `Upload ${slot.name}`}</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-5">Filing Status Timeline</h2>

        <div className="space-y-5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
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

                <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">{task.title}</h3>
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
                  {task.remarks && <p className="text-slate-500 text-[11px]">{task.remarks}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
              <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <button
                  onClick={() => setViewDocOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="text-center truncate max-w-xs px-2">
                  <p className="text-xs font-semibold text-slate-800 truncate">{previewTargetDoc.originalFileName || 'Uploaded Document'}</p>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{ext || 'file'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl}
                    download={previewTargetDoc.originalFileName || 'document'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                    title="Download File"
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => setViewDocOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-auto flex items-center justify-center">
                {isImage ? (
                  <img src={fileUrl} alt="Submitted Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : isPdf || isTextOrCode ? (
                  <iframe src={fileUrl} className="w-full h-full rounded border-0 bg-white shadow-inner" title="Preview" />
                ) : (
                  <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-md w-full space-y-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                      <FileText size={30} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{previewTargetDoc.originalFileName || 'Document File'}</p>
                      <p className="text-slate-500 text-xs mt-1">Direct preview not supported for .{ext} files.</p>
                    </div>
                    <div>
                      <a
                        href={fileUrl}
                        download={previewTargetDoc.originalFileName || 'downloaded_file'}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <Download size={14} /> Download & View File
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}