import React, { useState } from 'react';
import { X, Loader2, Upload, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { endpointUrl, httpPost } from '@/../helpers';
import { toast } from 'react-toastify';
import ComponentCard from '@/components/common/ComponentCard';
import { Modal } from '../ui/modal';

interface ProjectVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  onSuccess: () => void;
}

export const ProjectVerificationModal: React.FC<ProjectVerificationModalProps> = ({
  isOpen,
  onClose,
  requestId,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'CLOSED' | 'REVISION'>('CLOSED');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() ) {
      toast.error('Judul verifikasi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('status', status);

      selectedFiles.forEach((file) => {
        formData.append('photos', file);
      });

      await httpPost(endpointUrl(`/project-requests/${requestId}/verification`), formData, true);
      toast.success(
        status === 'CLOSED'
          ? 'Pengajuan proyek telah berhasil diverifikasi dan ditutup (CLOSED)!'
          : 'Catatan revisi berhasil dikirim!'
      );

      setTitle('');
      setDescription('');
      setStatus('CLOSED');
      setSelectedFiles([]);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Gagal mengirimkan verifikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="">
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4 mt-3"> Verifikasi Request Proyek</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Keputusan Verifikasi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStatus('CLOSED')}
                className={`p-3 border-2 rounded-xl flex items-center gap-3 transition-all text-left ${status === 'CLOSED'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${status === 'CLOSED' ? 'border-emerald-600 bg-emerald-600' : 'border-gray-400'
                  }`}>
                  {status === 'CLOSED' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <div>
                  <div className="text-sm">Selesai</div>
                  <div className="text-[11px] font-normal text-gray-500">Close Request</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('REVISION')}
                className={`p-3 border-2 rounded-xl flex items-center gap-3 transition-all text-left ${status === 'REVISION'
                  ? 'border-amber-600 bg-amber-50 text-amber-800 font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${status === 'REVISION' ? 'border-amber-600 bg-amber-600' : 'border-gray-400'
                  }`}>
                  {status === 'REVISION' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <div>
                  <div className="text-sm">Minta Revisi</div>
                  <div className="text-[11px] font-normal text-gray-500">Perlu Perbaikan</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Judul Verifikasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={status === 'CLOSED' ? 'Contoh: Pekerjaan Sesuai & Diterima Baik' : 'Contoh: Belum Sesuai Permintaan'}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Keterangan / Deskripsi 
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan detail catatan verifikasi atau masukan perbaikan..."
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Upload Foto / Dokumen Pendukung (Opsional)
            </label>
            <div className="mt-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="verification-photos-upload"
              />
              <label
                htmlFor="verification-photos-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-600"
              >
                <Upload className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600">Klik untuk upload foto/file</span>
                <span className="text-[10px] text-gray-400">Dapat memilih lebih dari 1 berkas</span>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600">File terpilih ({selectedFiles.length}):</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-xs"
                    >
                      <span className="truncate max-w-[240px] text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-red-500 hover:text-red-700 font-bold ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white text-sm font-semibold rounded-lg flex items-center gap-2 ${status === 'CLOSED'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
                }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Mengirim...' : status === 'CLOSED' ? 'Selesaikan (Close)' : 'Kirim Revisi'}
            </button>
          </div>
        </form>
      </div>
    </Modal >
  );
};

export default ProjectVerificationModal;
