"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import _ from 'lodash';

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Loader2, Upload, X, ArrowLeft, Building2 } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

export default function CreateProjectRequestPage() {
  const router = useRouter();
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);

  const [formData, setFormData] = useState({
    cab_id: null as number | null,
    problem_description: '',
    root_cause: '',
    corrective_action: '',
  });

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sitesRes = await httpGet(endpointUrl("/rooms/site-options"), true);
        if (sitesRes?.data?.data) {
          setSiteOptions(
            sitesRes.data.data.map((s: any) => ({
              value: s.id_cab.toString(),
              label: s.nama_cab
            }))
          );
        }
      } catch (error) {
        toast.error("Gagal memuat daftar cabang.");
      } fontFinally: {
        setLoadingOptions(false);
      }
    };

    fetchSites();
  }, []);

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

    if (!formData.cab_id) {
      toast.error("Harap pilih Cabang/Site terlebih dahulu.");
      return;
    }
    if (!formData.problem_description.trim()) {
      toast.error("Harap isi Deskripsi Masalah (Problem Description).");
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

      await httpPost(endpointUrl('/project-requests'), payload, true);
      toast.success("Pengajuan request proyek berhasil dikirim!");
      router.push('/projects/my-requests');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Gagal mengirim pengajuan proyek.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComponentCard title="Ajukan Proyek">
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
            placeholder={loadingOptions ? "Memuat cabang..." : "Pilih cabang..."}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Uraian Permasalah  <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={formData.problem_description}
            onChange={(e) => handleFieldChange('problem_description', e.target.value)}
            placeholder="Jelaskan secara rinci kendala atau masalah yang memerlukan pengerjaan proyek / perbaikan..."
            className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Penyebab Masalah <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.root_cause}
            onChange={(e) => handleFieldChange('root_cause', e.target.value)}
            placeholder="Analisis penyebab akar permasalahan (jika ada)..."
            className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Perbaikan / Perawatan <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.corrective_action}
            onChange={(e) => handleFieldChange('corrective_action', e.target.value)}
            placeholder="Rencana tindakan perbaikan yang diusulkan..."
            className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Upload Foto / Berkas (Photos)
          </label>
          <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center bg-gray-50/50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="photos-input"
            />
            <label
              htmlFor="photos-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-8 h-8 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600">Klik untuk upload foto / berkas</span>
              <span className="text-xs text-gray-400">Anda dapat memilih beberapa berkas sekaligus (JPG, PNG, PDF)</span>
            </label>
          </div>

          {selectedPhotos.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Berkas terpilih ({selectedPhotos.length}):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {selectedPhotos.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-gray-100 rounded-lg text-xs"
                  >
                    <span className="truncate max-w-[200px] text-gray-700 font-medium">{file.name}</span>
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
            disabled={isSubmitting || loadingOptions}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Kirim Pengajuan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}