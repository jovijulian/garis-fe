import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { endpointUrl, httpPut } from '@/../helpers';
import { toast } from 'react-toastify';

interface ReimbursementAdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
  documentNumber?: string;
  actionType: 'APPROVED' | 'REJECTED';
  onSuccess: () => void;
}

export const ReimbursementAdminApprovalModal: React.FC<ReimbursementAdminApprovalModalProps> = ({
  isOpen,
  onClose,
  requestId,
  documentNumber,
  actionType,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !requestId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (actionType === 'REJECTED' && !notes.trim()) {
      toast.error('Harap isi alasan penolakan pada kolom catatan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        status: actionType,
        notes: notes.trim() || (actionType === 'APPROVED' ? 'Setuju' : 'Ditolak'),
        forward_to_head1: false, // Wajib false, tidak dimunculkan ke UI
      };

      await httpPut(endpointUrl(`/reimbursements/${requestId}/approval`), payload, true);
      toast.success(
        actionType === 'APPROVED'
          ? 'Pengajuan reimbursement berhasil disetujui!'
          : 'Pengajuan reimbursement telah ditolak.'
      );
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Gagal memproses keputusan reimbursement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApprove = actionType === 'APPROVED';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              {isApprove ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Setujui Reimbursement</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>Tolak Reimbursement</span>
                </>
              )}
            </h3>
            {documentNumber && (
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Dokumen: <span className="font-semibold text-gray-700">{documentNumber}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catatan {isApprove ? '(Opsional)' : '<span className="text-rose-500">*</span>'}
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isApprove
                  ? 'Contoh: Berkas kwitansi lengkap, disetujui untuk diproses GA'
                  : 'Contoh: Alasan penolakan pengajuan klaim...'
              }
              className="w-full border border-gray-300 p-3 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400"
              required={!isApprove}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                  : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>{isApprove ? 'Ya, Setujui' : 'Ya, Tolak'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReimbursementAdminApprovalModal;
