import React, { useState } from 'react';
import { X, Loader2, Upload, PlusCircle, Wrench } from 'lucide-react';
import { endpointUrl, httpPost } from '@/../helpers';
import { toast } from 'react-toastify';

interface ProjectAddProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
  onSuccess: () => void;
}

export const ProjectAddProgressModal: React.FC<ProjectAddProgressModalProps> = ({
  isOpen,
  onClose,
  requestId,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !requestId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedPhotos(prev => [...prev, ...filesArr]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul progress wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      selectedPhotos.forEach((file) => {
        formData.append('photos', file);
      });

      await httpPost(endpointUrl(`/project-requests/${requestId}/progress`), formData, true);
      toast.success('Progress pengerjaan proyek berhasil ditambahkan!');

      setTitle('');
      setDescription('');
      setSelectedPhotos([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Gagal menambahkan progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Tambah Progress Pengerjaan (GA)
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Judul Progress <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Perbaikan Tahap 1 / Pemasangan Pipa"
              className="w-full border border-gray-300 p-2.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Deskripsi Progress
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail pengerjaan yang telah diselesaikan atau perkembangan perbaikan..."
              className="w-full border border-gray-300 p-2.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Upload Foto Progress (Photos)
            </label>
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-4 text-center bg-gray-50/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="progress-photos-input"
              />
              <label
                htmlFor="progress-photos-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-600"
              >
                <Upload className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600">Klik untuk upload foto progress</span>
                <span className="text-[10px] text-gray-400">Dapat memilih beberapa foto sekaligus</span>
              </label>
            </div>

            {selectedPhotos.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-gray-600">File terpilih ({selectedPhotos.length}):</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {selectedPhotos.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-xs"
                    >
                      <span className="truncate max-w-[220px] text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Progress</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectAddProgressModal;
