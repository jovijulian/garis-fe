"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import _ from 'lodash';

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import ImagePreviewModal from '@/components/modal/ImagePreviewModal';
import {
  Check, Loader2, Upload, X, ArrowLeft, Building2,
  AlertTriangle, FileText, Image as ImageIcon, Info, Paperclip
} from 'lucide-react';
import { ProjectRequestDetail } from '@/types/project';

interface SelectOption {
  value: string;
  label: string;
}

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || 'https://api-garis.cisangkan.co.id/';
  return `${baseUrl}${fileUrl.replace(/^\//, '')}`;
};

export default function EditProjectRequestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
  const [existingData, setExistingData] = useState<ProjectRequestDetail | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    cab_id: null as number | null,
    problem_description: '',
    root_cause: '',
    corrective_action: '',
  });

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [requestRes, sitesRes] = await Promise.all([
          httpGet(endpointUrl(`/project-requests/${id}`), true),
          httpGet(endpointUrl("/rooms/site-options"), true),
        ]);

        if (sitesRes?.data?.data) {
          setSiteOptions(
            sitesRes.data.data.map((s: any) => ({
              value: s.id_cab.toString(),
              label: s.nama_cab,
            }))
          );
        }

        const projectData: ProjectRequestDetail = requestRes?.data?.data;
        if (projectData) {
          setExistingData(projectData);
          setFormData({
            cab_id: projectData.cab_id,
            problem_description: projectData.problem_description || '',
            root_cause: projectData.root_cause || '',
            corrective_action: projectData.corrective_action || '',
          });

          if (projectData.status !== 'WAITING_APPROVAL') {
            setIsEditable(false);
            toast.error("Pengajuan ini tidak dapat diubah karena status bukan WAITING_APPROVAL.");
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data pengajuan proyek.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, router]);

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

    if (!isEditable) {
      toast.error("Pengajuan ini sudah tidak dapat diubah.");
      return;
    }

    if (!formData.cab_id) {
      toast.error("Harap pilih Cabang/Site terlebih dahulu.");
      return;
    }

    if (!formData.problem_description.trim()) {
      toast.error("Harap isi Uraian Permasalahan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('cab_id', formData.cab_id.toString());
      payload.append('problem_description', formData.problem_description);
      payload.append('root_cause', formData.root_cause);
      payload.append('corrective_action', formData.corrective_action);

      selectedPhotos.forEach((file) => {
        payload.append('photos', file);
      });

      // Endpoint: POST /project-requests/:id
      await httpPost(endpointUrl(`/project-requests/${id}`), payload, true);
      toast.success("Pengajuan proyek berhasil diperbarui!");
      router.push(`/projects/my-requests/${id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Gagal memperbarui pengajuan proyek.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-gray-600">Memuat data pengajuan proyek...</p>
      </div>
    );
  }

  if (!isEditable && existingData) {
    return (
      <ComponentCard title="Ubah Pengajuan Request Proyek">
        <div className="p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">Tidak Dapat Mengubah Pengajuan</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Pengajuan proyek dengan nomor <strong>{existingData.document_number}</strong> saat ini berstatus{' '}
            <span className="font-bold text-amber-700">{existingData.status}</span>. Perubahan hanya diizinkan saat status masih <strong>WAITING_APPROVAL</strong>.
          </p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </ComponentCard>
    );
  }

  return (
    <>
      <ComponentCard title="Ubah Pengajuan Proyek">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
              Cabang / Site <span className="text-red-500">*</span>
            </label>
            <Select
              options={siteOptions}
              value={_.find(siteOptions, { value: formData.cab_id?.toString() }) || null}
              onValueChange={(opt) =>
                handleFieldChange('cab_id', opt ? parseInt(opt.value, 10) : null)
              }
              placeholder="Pilih cabang..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Uraian Permasalahan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.problem_description}
              onChange={(e) => handleFieldChange('problem_description', e.target.value)}
              placeholder="Jelaskan secara rinci kendala atau masalah..."
              className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Penyebab Masalah
            </label>
            <textarea
              rows={3}
              value={formData.root_cause}
              onChange={(e) => handleFieldChange('root_cause', e.target.value)}
              placeholder="Analisis penyebab akar permasalahan..."
              className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Perbaikan / Perawatan
            </label>
            <textarea
              rows={3}
              value={formData.corrective_action}
              onChange={(e) => handleFieldChange('corrective_action', e.target.value)}
              placeholder="Rencana tindakan perbaikan yang diusulkan..."
              className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {existingData?.attachments && existingData.attachments.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider font-bold text-gray-700 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  Lampiran Foto / Berkas Saat Ini ({existingData.attachments.length})
                </h4>
                <span className="text-[11px] text-gray-500 font-medium">Klik gambar untuk melihat</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {existingData.attachments.map((att) => {
                
                  const fullUrl = getFullImageUrl(att.file_url);

                  const isImage =
                    att.file_type?.startsWith("image/") ||
                    /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file_name || att.file_url);

                  const isPdf =
                    att.file_type === "application/pdf" ||
                    /\.pdf$/i.test(att.file_name || att.file_url);

                  const handleClick = () => {
                    if (isImage) {
                      setPreviewImage({
                        url: fullUrl,
                        title: att.file_name,
                      });
                    } else if (isPdf) {
                      window.open(fullUrl, "_blank", "noopener,noreferrer");
                    } else {
                      window.open(fullUrl, "_blank", "noopener,noreferrer");
                    }
                  };
                  return (
                    <div
                      key={att.id}
                      onClick={handleClick}
                      className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-blue-500 transition-all cursor-pointer shadow-sm"
                    >
                      {isImage ? (
                        <div className="h-24 w-full bg-gray-100 overflow-hidden flex items-center justify-center">
                          <img
                            src={fullUrl}
                            alt={att.file_name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="h-24 w-full flex flex-col items-center justify-center bg-gray-50 p-2 text-center">
                          <FileText className="w-6 h-6 text-blue-500 mb-1" />
                          <span className="text-[10px] text-gray-600 truncate w-full">
                            {att.file_name}
                          </span>
                        </div>
                      )}
                      <div className="p-1.5 text-[10px] font-medium text-gray-700 truncate border-t bg-white">
                        {att.file_name}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-start gap-2 pt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Informasi:</strong> Jika Anda memilih dan mengunggah berkas baru di bawah ini, seluruh lampiran saat ini di atas akan <strong>digantikan secara penuh</strong> dengan berkas baru yang Anda unggah.
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {existingData?.attachments && existingData.attachments.length > 0
                ? "Ganti Berkas / Upload Foto Baru (Optional)"
                : "Upload Foto / Berkas (Photos)"}
            </label>

            <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center bg-gray-50/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="photos-edit-input"
              />
              <label
                htmlFor="photos-edit-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-8 h-8 text-blue-500" />
                <span className="text-sm font-semibold text-blue-600">
                  {selectedPhotos.length > 0 ? "Pilih berkas lainnya..." : "Klik untuk upload foto / berkas pengganti"}
                </span>
                <span className="text-xs text-gray-400">Dapat memilih lebih dari 1 berkas (JPG, PNG, PDF)</span>
              </label>
            </div>

            {selectedPhotos.length > 0 && (
              <div className="mt-4 space-y-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-800">
                    Berkas baru pengganti ({selectedPhotos.length}):
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedPhotos([])}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Batal ganti berkas
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedPhotos.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white border border-blue-200 rounded-lg text-xs"
                    >
                      <span className="truncate max-w-[180px] text-gray-700 font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="text-red-500 hover:text-red-700 font-bold p-1"
                      >
                        <X className="w-4 h-4" />
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
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </ComponentCard>

      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        imageTitle={previewImage?.title || 'Preview Berkas'}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}