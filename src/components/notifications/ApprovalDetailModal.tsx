import React, { useState, useEffect } from 'react';
import {
  X, Loader2, CheckCircle2, XCircle, FileText, User, Building2,
  Calendar, Paperclip, AlertTriangle, ArrowRight, CornerDownRight, ShieldCheck
} from 'lucide-react';
import { endpointUrl, httpGet, httpPost, httpPut } from '@/../helpers';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/id';
import { ApprovalNotificationDetailResponse, ApprovalActionPayload } from '@/types/approval';
import ImagePreviewModal from '@/components/modal/ImagePreviewModal';

interface ApprovalDetailModalProps {
  isOpen: boolean;
  approvalId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || 'https://api-garis.cisangkan.co.id/';
  return `${baseUrl}${fileUrl.replace(/^\//, '')}`;
};

export const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = ({
  isOpen,
  approvalId,
  onClose,
  onSuccess,
}) => {
  moment.locale('id');

  const [detail, setDetail] = useState<ApprovalNotificationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStatus, setActionStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [notes, setNotes] = useState('');
  const [forwardToHead, setForwardToHead] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !approvalId) {
      setDetail(null);
      setNotes('');
      setActionStatus('APPROVED');
      setForwardToHead(false);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await httpGet(endpointUrl(`/approvals/notifications/${approvalId}`), true);
        if (res?.data?.data) {
          setDetail(res.data.data);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.message || 'Gagal mengambil detail persetujuan.');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, approvalId]);

  if (!isOpen || !approvalId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!notes.trim()) {
    //   toast.error('Harap isi catatan persetujuan / penolakan.');
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const canForward = detail?.approval_info?.can_forward ?? false;
      const payload: ApprovalActionPayload = {
        status: actionStatus,
        notes: notes,
        forward_to_head1: (canForward && actionStatus === 'APPROVED') ? forwardToHead : false,
      };

      await httpPut(endpointUrl(`/approvals/notifications/${approvalId}/action`), payload, true);
      toast.success(
        actionStatus === 'APPROVED'
          ? 'Pengajuan berhasil disetujui (APPROVED)!'
          : 'Pengajuan telah ditolak (REJECTED).'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Gagal memproses persetujuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const info = detail?.approval_info;
  const req = detail?.request_detail;
  const canForward = info?.can_forward ?? false;

  return (
    <>
      <div className="fixed inset-0 z-9999999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[96vh] sm:max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm sm:text-base md:text-lg leading-tight">
                  Detail Persetujuan (Approval)
                </h3>
                {info && (
                  <span className="text-[11px] sm:text-xs font-semibold text-blue-600 block sm:inline">
                    Modul: {info.module_name}
                    {/* • Tingkat: {info.approver_type} */}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-10 sm:p-12 text-center flex flex-col items-center justify-center flex-1">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-xs sm:text-sm font-medium text-gray-600">Memuat detail dokumen persetujuan...</p>
            </div>
          ) : req ? (
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-left">
              {/* Document Info Header */}
              <div className="p-3.5 sm:p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-blue-800 bg-white px-2.5 py-1 rounded-md border border-blue-200">
                    {req.document_number}
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {moment(req.request_date).format('DD MMM YYYY, HH:mm')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">Pemohon: <strong>{req.requester?.nama_user || req.user_id}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">Departemen: <strong>{req.department?.nama_dept || '-'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="p-3.5 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Uraian Permasalahan
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium whitespace-pre-line leading-relaxed">
                    {req.problem_description || '-'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {req.root_cause && (
                    <div className="p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Penyebab Masalah
                      </h4>
                      <p className="text-xs text-gray-700 whitespace-pre-line">
                        {req.root_cause}
                      </p>
                    </div>
                  )}

                  {req.corrective_action && (
                    <div className="p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Perbaikan / Perawatan
                      </h4>
                      <p className="text-xs text-gray-700 whitespace-pre-line">
                        {req.corrective_action}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {req.attachments && req.attachments.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      Lampiran Dokumen / Foto ({req.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {req.attachments.map((att) => {
                        const fullUrl = getFullImageUrl(att.file_url);
                        const isImage = att.file_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file_name || att.file_url);
                        const isPdf = att.file_type === 'application/pdf' || /\.pdf$/i.test(att.file_name || att.file_url);

                        return (
                          <div
                            key={att.id}
                            onClick={() => {
                              if (isImage) {
                                setPreviewImage({ url: fullUrl, title: att.file_name });
                              } else {
                                window.open(fullUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="group p-2.5 border border-gray-200 hover:border-blue-400 rounded-xl bg-white transition-all cursor-pointer flex items-center gap-2"
                          >
                            <FileText className={`w-4 h-4 shrink-0 ${isPdf ? 'text-red-500' : 'text-blue-500'}`} />
                            <span className="text-xs text-gray-700 truncate font-medium group-hover:text-blue-600">
                              {att.file_name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Form */}
              <div className="p-3.5 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3.5 sm:space-y-4">
                <h4 className="text-xs sm:text-sm font-bold text-gray-800">
                  Keputusan Persetujuan Anda
                </h4>

                {/* Status Toggle Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setActionStatus('APPROVED')}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all ${actionStatus === 'APPROVED'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Setujui (APPROVED)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionStatus('REJECTED')}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold transition-all ${actionStatus === 'REJECTED'
                      ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Tolak (REJECTED)</span>
                  </button>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Catatan (Notes)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={actionStatus === 'APPROVED' ? "Contoh: Setuju diproses lebih lanjut" : "Contoh: Mohon perbaiki data pengajuan"}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>

                {/* Forward to Head Flagging Option */}
                {canForward && actionStatus === 'APPROVED' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
                      <CornerDownRight className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Teruskan pengajuan ini ke atasan selanjutnya (Forward to Head)</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
                      <input
                        type="checkbox"
                        checked={forwardToHead}
                        onChange={(e) => setForwardToHead(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors text-center"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto justify-center px-6 py-2.5 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ${actionStatus === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Kirim Keputusan</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">Data tidak ditemukan.</div>
          )}
        </div>
      </div>

      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        imageTitle={previewImage?.title || 'Preview Attachment'}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};

export default ApprovalDetailModal;
