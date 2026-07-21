import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { endpointUrl, httpPut } from '@/../helpers';
import { toast } from 'react-toastify';

interface ProjectAdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
  actionType: 'APPROVED' | 'REJECTED';
  onSuccess: () => void;
}

export const ProjectAdminApprovalModal: React.FC<ProjectAdminApprovalModalProps> = ({
  isOpen,
  onClose,
  requestId,
  actionType,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !requestId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!notes.trim()) {
    //   toast.error('Harap isi catatan persetujuan / penolakan.');
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const payload = {
        status: actionType,
        notes: notes,
        forward_to_head1: false,
      };

      await httpPut(endpointUrl(`/project-requests/${requestId}/approval`), payload, true);
      toast.success(
        actionType === 'APPROVED'
          ? 'Pengajuan proyek berhasil disetujui!'
          : 'Pengajuan proyek telah ditolak.'
      );
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Gagal memproses keputusan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            {actionType === 'APPROVED' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Setujui Request Proyek
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-600" />
                Tolak Request Proyek
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catatan Admin
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === 'APPROVED' ? "Contoh: Setuju diproses oleh tim GA" : "Contoh: Alasan penolakan pengajuan"}
              className="w-full border border-gray-300 p-3 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              // required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white text-xs font-semibold rounded-lg flex items-center gap-2 ${
                actionType === 'APPROVED'
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
                <span>{actionType === 'APPROVED' ? 'Setujui' : 'Tolak'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectAdminApprovalModal;
