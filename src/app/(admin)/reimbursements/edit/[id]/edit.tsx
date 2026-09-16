"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from 'lodash';

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import SingleDatePicker from '@/components/calendar/SingleDatePicker';
import ImagePreviewModal from '@/components/modal/ImagePreviewModal';
import {
  Check, Loader2, Upload, X, PlusCircle, Trash2, Calendar,
  MapPin, AlertTriangle, FileText, Paperclip, Info, CheckCircle2, XCircle
} from 'lucide-react';
import { ReimbursementDetail, ReimbursementItemOption } from '@/types/reimbursement';

interface SelectOption {
  value: string;
  label: string;
}

interface DetailRow {
  item_id: number;
  item_name: string;
  claim_amount: number | string;
  notes: string;
  has_receipt: number; // 1 or 0
  is_dynamic?: boolean;
}

const formatRupiah = (val: number | string) => {
  if (val === '' || val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : parseInt(val.toString().replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
};

const parseRupiah = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : '';
};

const getFullImageUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = process.env.IMAGE_URL || 'https://api-garis.cisangkan.co.id/';
  return `${baseUrl}${fileUrl.replace(/^\//, '')}`;
};

export default function EditReimbursementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ReimbursementItemOption[]>([]);
  const [existingData, setExistingData] = useState<ReimbursementDetail | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    cab_id: null as number | null,
    destination: '',
    start_date: '',
    end_date: '',
    duration: 1,
    duration_type: 'Hari',
    purpose: '',
  });

  const [viewingMonthStart, setViewingMonthStart] = useState(new Date());
  const [viewingMonthEnd, setViewingMonthEnd] = useState(new Date());

  const [details, setDetails] = useState<DetailRow[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Helper hitung durasi otomatis
  const calculateDuration = (startStr: string, endStr: string, type: string) => {
    if (!startStr || !endStr) return 1;
    const start = moment(startStr, 'YYYY-MM-DD');
    const end = moment(endStr, 'YYYY-MM-DD');
    if (end.isSameOrAfter(start)) {
      const diffDays = end.diff(start, 'days');
      return type === 'Malam' ? Math.max(1, diffDays) : diffDays + 1;
    }
    return 1;
  };

  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [detailRes, sitesRes, itemsRes] = await Promise.all([
          httpGet(endpointUrl(`/reimbursements/${id}`), true),
          httpGet(endpointUrl("/rooms/site-options"), true),
          httpGet(endpointUrl("/reimbursement-items/options"), true),
        ]);

        if (sitesRes?.data?.data) {
          setSiteOptions(
            sitesRes.data.data.map((s: any) => ({
              value: s.id_cab.toString(),
              label: s.nama_cab,
            }))
          );
        }

        const items: ReimbursementItemOption[] = itemsRes?.data?.data || [];
        setItemOptions(items);

        const detailData: ReimbursementDetail = detailRes?.data?.data;
        if (detailData) {
          setExistingData(detailData);
          setFormData({
            cab_id: detailData.cab_id,
            destination: detailData.destination || '',
            start_date: detailData.start_date ? moment(detailData.start_date).format('YYYY-MM-DD') : '',
            end_date: detailData.end_date ? moment(detailData.end_date).format('YYYY-MM-DD') : '',
            duration: detailData.duration || 1,
            duration_type: detailData.duration_type || 'Hari',
            purpose: detailData.purpose || '',
          });

          if (detailData.status !== 'WAITING_MANAGER') {
            setIsEditable(false);
          }

          // Populate existing details
          const existingDetails = detailData.details || [];

          // Standard items 1 to 5
          const populatedRows: DetailRow[] = items
            .filter((item) => item.id !== 6)
            .map((item) => {
              const matched = existingDetails.find((d) => d.item_id === item.id);
              return {
                item_id: item.id,
                item_name: item.item_name,
                claim_amount: matched ? Number(matched.claim_amount) || '' : '',
                notes: matched?.notes || '',
                has_receipt: matched?.has_receipt ? 1 : 0,
                is_dynamic: false,
              };
            });

          // Dynamic item 6
          const item6Options = items.find((i) => i.id === 6);
          const item6Existing = existingDetails.filter((d) => d.item_id === 6);
          if (item6Existing.length > 0) {
            item6Existing.forEach((d) => {
              populatedRows.push({
                item_id: 6,
                item_name: item6Options?.item_name || 'Biaya Lainnya',
                claim_amount: Number(d.claim_amount) || '',
                notes: d.notes || '',
                has_receipt: d.has_receipt ? 1 : 0,
                is_dynamic: true,
              });
            });
          } else {
            // Default 1 row jika belum ada
            populatedRows.push({
              item_id: 6,
              item_name: item6Options?.item_name || 'Biaya Lainnya',
              claim_amount: '',
              notes: '',
              has_receipt: 0,
              is_dynamic: true,
            });
          }

          setDetails(populatedRows);
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data pengajuan reimbursement.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, router]);

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartDateChange = (date: any) => {
    const formatted = date ? moment(date).format('YYYY-MM-DD') : '';
    setFormData((prev) => {
      const dur = prev.end_date ? calculateDuration(formatted, prev.end_date, prev.duration_type) : prev.duration;
      return {
        ...prev,
        start_date: formatted,
        ...(formatted && prev.end_date ? { duration: dur } : {})
      };
    });
  };

  const handleEndDateChange = (date: any) => {
    const formatted = date ? moment(date).format('YYYY-MM-DD') : '';
    setFormData((prev) => {
      const dur = prev.start_date ? calculateDuration(prev.start_date, formatted, prev.duration_type) : prev.duration;
      return {
        ...prev,
        end_date: formatted,
        ...(prev.start_date && formatted ? { duration: dur } : {})
      };
    });
  };

  const handleDurationTypeChange = (type: string) => {
    setFormData((prev) => {
      const dur = prev.start_date && prev.end_date ? calculateDuration(prev.start_date, prev.end_date, type) : prev.duration;
      return {
        ...prev,
        duration_type: type,
        ...(prev.start_date && prev.end_date ? { duration: dur } : {})
      };
    });
  };

  const handleDetailChange = (index: number, field: keyof DetailRow, value: any) => {
    setDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddBiayaLainnya = () => {
    const item6 = itemOptions.find((i) => i.id === 6);
    const newRow: DetailRow = {
      item_id: 6,
      item_name: item6?.item_name || 'Biaya Lainnya',
      claim_amount: '',
      notes: '',
      has_receipt: 0,
      is_dynamic: true,
    };
    setDetails((prev) => [...prev, newRow]);
  };

  const handleRemoveBiayaLainnya = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const totalClaim = useMemo(() => {
    return details.reduce((sum, item) => {
      const amount = Number(item.claim_amount) || 0;
      return sum + amount;
    }, 0);
  }, [details]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditable) {
      toast.error("Pengajuan ini sudah tidak dapat diubah.");
      return;
    }

    if (!formData.cab_id) {
      toast.error("Harap pilih Cabang / Site terlebih dahulu.");
      return;
    }
    if (!formData.destination.trim()) {
      toast.error("Harap isi Kota / Tempat Tujuan.");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error("Harap lengkapi Tanggal Mulai dan Tanggal Selesai.");
      return;
    }
    if (moment(formData.end_date).isBefore(moment(formData.start_date))) {
      toast.error("Tanggal Selesai tidak boleh mendahului Tanggal Mulai.");
      return;
    }
    if (!formData.purpose.trim()) {
      toast.error("Harap isi Keperluan / Maksud Perjalanan Dinas.");
      return;
    }
    if (totalClaim <= 0) {
      toast.error("Harap masukkan nominal klaim minimal pada salah satu item rincian biaya.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('cab_id', formData.cab_id.toString());
      payload.append('destination', formData.destination);
      payload.append('start_date', formData.start_date);
      payload.append('end_date', formData.end_date);
      payload.append('duration', formData.duration.toString());
      payload.append('duration_type', formData.duration_type);
      payload.append('purpose', formData.purpose);

      const formattedDetails = details.map((d) => ({
        item_id: d.item_id,
        claim_amount: Number(d.claim_amount) || 0,
        notes: d.notes?.trim() ? d.notes.trim() : null,
        has_receipt: d.has_receipt ? 1 : 0,
      }));

      // Jika user tidak pakai biaya lainnya atau menghapus barisnya,
      // tetap dikirimkan ke BE 1 baris item 6 dengan nominal 0
      const hasItem6 = formattedDetails.some((d) => d.item_id === 6);
      if (!hasItem6) {
        formattedDetails.push({
          item_id: 6,
          claim_amount: 0,
          notes: null,
          has_receipt: 0,
        });
      }

      payload.append('details', JSON.stringify(formattedDetails));

      selectedFiles.forEach((file) => {
        payload.append('files', file);
      });

      // POST /reimbursements/:id
      await httpPost(endpointUrl(`/reimbursements/${id}`), payload, true);
      toast.success("Pengajuan reimbursement berhasil diperbarui!");
      router.push(`/reimbursements/my-reimbursements/${id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Gagal memperbarui pengajuan reimbursement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-gray-600">Memuat data pengajuan reimbursement...</p>
      </div>
    );
  }

  if (!isEditable && existingData) {
    return (
      <ComponentCard title="Ubah Pengajuan Reimbursement">
        <div className="p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">Tidak Dapat Mengubah Pengajuan</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Pengajuan dengan nomor <strong>{existingData.document_number}</strong> saat ini berstatus{' '}
            <span className="font-bold text-amber-700">{existingData.status}</span>.
            Perubahan hanya diizinkan saat status masih <strong>WAITING_MANAGER</strong>.
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
      <ComponentCard title="Ubah Pengajuan Reimbursement">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Informasi Perjalanan */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              Informasi Perjalanan Dinas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Kota / Tempat Tujuan <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.destination}
                  onChange={(e) => handleFieldChange('destination', e.target.value)}
                  placeholder="Contoh: Jakarta, Surabaya..."
                  required
                />
              </div>
            </div>

            {/* Tipe Durasi Perjalanan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jenis Perjalanan & Tipe Durasi <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleDurationTypeChange('Hari')}
                  className={`p-3.5 border-2 rounded-xl text-left transition-all ${
                    formData.duration_type === 'Hari'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        formData.duration_type === 'Hari'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {formData.duration_type === 'Hari' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        DLK Lainnya (Hitungan Hari)
                      </div>
                      <div className="text-xs text-gray-500">
                        Perhitungan dinas luar kota reguler berdasarkan hari
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDurationTypeChange('Malam')}
                  className={`p-3.5 border-2 rounded-xl text-left transition-all ${
                    formData.duration_type === 'Malam'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        formData.duration_type === 'Malam'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {formData.duration_type === 'Malam' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        DLKS Antar Site (Hitungan Malam)
                      </div>
                      <div className="text-xs text-gray-500">
                        Perjalanan antar site pabrik berdasarkan jumlah malam menginap
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <SingleDatePicker
                  placeholderText="Pilih tanggal mulai"
                  selectedDate={formData.start_date ? new Date(formData.start_date) : null}
                  onChange={handleStartDateChange}
                  onClearFilter={() => handleStartDateChange(null)}
                  viewingMonthDate={viewingMonthStart}
                  onMonthChange={setViewingMonthStart}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <SingleDatePicker
                  placeholderText="Pilih tanggal selesai"
                  selectedDate={formData.end_date ? new Date(formData.end_date) : null}
                  onChange={handleEndDateChange}
                  onClearFilter={() => handleEndDateChange(null)}
                  viewingMonthDate={viewingMonthEnd}
                  onMonthChange={setViewingMonthEnd}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>
                    Durasi ({formData.duration_type}) <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">Otomatis / Ubah</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) =>
                    handleFieldChange('duration', e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Keperluan / Maksud Perjalanan Dinas <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.purpose}
                onChange={(e) => handleFieldChange('purpose', e.target.value)}
                placeholder="Jelaskan maksud dan keperluan dinas..."
                className="w-full border border-gray-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Section 2: Rincian Pengeluaran Klaim */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                Rincian Biaya Reimbursement
              </h3>
              <span className="text-xs text-gray-500">
                Isi nominal klaim dan beri centang jika memiliki bukti kwitansi fisik
              </span>
            </div>

            {/* Mobile Card View (block md:hidden) */}
            <div className="block md:hidden space-y-3.5">
              {details.map((row, idx) => {
                const isDeletable =
                  row.item_id === 6 &&
                  details.filter((d) => d.item_id === 6).length > 1;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3.5"
                  >
                    {/* Header Card */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900 text-sm">
                          {row.item_name}
                        </span>
                      </div>
                      {isDeletable && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBiayaLainnya(idx)}
                          className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    {/* Form Inputs inside Card */}
                    <div className="space-y-3">
                      {/* Nominal Klaim */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nominal Klaim
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none">
                            Rp
                          </span>
                          <input
                            type="text"
                            placeholder="0"
                            value={formatRupiah(row.claim_amount)}
                            onChange={(e) => {
                              const parsed = parseRupiah(e.target.value);
                              handleDetailChange(idx, 'claim_amount', parsed);
                            }}
                            className="w-full text-left pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Bukti Kwitansi Fisik */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Ada Bukti Kwitansi Fisik?
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleDetailChange(idx, 'has_receipt', 1)}
                            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                              row.has_receipt === 1
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ada</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDetailChange(idx, 'has_receipt', 0)}
                            className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                              row.has_receipt === 0
                                ? 'bg-white text-gray-700 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tidak</span>
                          </button>
                        </div>
                      </div>

                      {/* Catatan / Keterangan */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Catatan / Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Tiket KA, keperluan konsumsi..."
                          value={row.notes}
                          onChange={(e) =>
                            handleDetailChange(idx, 'notes', e.target.value)
                          }
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Actions: Tambah Biaya Lainnya & Total Klaim */}
              <div className="pt-1 space-y-3">
                <button
                  type="button"
                  onClick={handleAddBiayaLainnya}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50/70 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm bg-white"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Tambah Biaya Lainnya</span>
                </button>

                <div className="bg-gradient-to-r from-gray-50 to-blue-50/40 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Total Pengajuan Klaim</span>
                    <span className="text-lg font-bold text-emerald-600">
                      Rp {Number(totalClaim || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100/75 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 w-60">Kategori Biaya</th>
                    <th className="px-4 py-3 w-52 text-right">Nominal Klaim (Rp)</th>
                    <th className="px-4 py-3 w-44 text-center">Bukti Kwitansi</th>
                    <th className="px-4 py-3">Catatan / Keterangan</th>
                    <th className="px-4 py-3 w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {details.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <span>{row.item_name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none">
                            Rp
                          </span>
                          <input
                            type="text"
                            placeholder="0"
                            value={formatRupiah(row.claim_amount)}
                            onChange={(e) => {
                              const parsed = parseRupiah(e.target.value);
                              handleDetailChange(idx, 'claim_amount', parsed);
                            }}
                            className="w-full text-right pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center rounded-lg p-0.5 bg-gray-100 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleDetailChange(idx, 'has_receipt', 1)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                              row.has_receipt === 1
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ada</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDetailChange(idx, 'has_receipt', 0)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                              row.has_receipt === 0
                                ? 'bg-white text-gray-700 shadow-sm border border-gray-200'
                              : 'text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tidak</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Catatan keperluan item ini..."
                          value={row.notes}
                          onChange={(e) =>
                            handleDetailChange(idx, 'notes', e.target.value)
                          }
                          className="w-full border border-gray-300 px-3 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        {row.item_id === 6 && details.filter((d) => d.item_id === 6).length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveBiayaLainnya(idx)}
                            title="Hapus baris biaya lainnya"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs select-none" title={row.item_id === 6 ? "Baris utama biaya lainnya tidak dapat dihapus" : ""}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right font-bold text-gray-700">
                      Total Pengajuan Klaim:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 text-base">
                      Rp {Number(totalClaim || 0).toLocaleString('id-ID')}
                    </td>
                    <td colSpan={3} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={handleAddBiayaLainnya}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ Tambah Biaya Lainnya</span>
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Lampiran Yang Ada Saat Ini */}
          {existingData?.attachments && existingData.attachments.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider font-bold text-gray-700 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  Lampiran Berkas Saat Ini ({existingData.attachments.length})
                </h4>
                <span className="text-[11px] text-gray-500 font-medium">Klik untuk melihat</span>
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
                  <strong>Informasi:</strong> Jika Anda memilih dan mengunggah berkas baru di bawah ini, seluruh lampiran saat ini di atas akan digantikan dengan berkas baru yang Anda unggah.
                </span>
              </div>
            </div>
          )}

          {/* Section 3: Upload Berkas Kwitansi Baru */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {existingData?.attachments && existingData.attachments.length > 0
                ? "Ganti Berkas / Upload Foto Kwitansi Baru (Opsional)"
                : "Upload Foto Kwitansi / Berkas Bukti (PDF / JPG / PNG)"}
            </label>

            <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center bg-gray-50/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="reimbursement-edit-files"
              />
              <label
                htmlFor="reimbursement-edit-files"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-8 h-8 text-blue-500" />
                <span className="text-sm font-semibold text-blue-600">
                  {selectedFiles.length > 0 ? "Pilih berkas lainnya..." : "Klik untuk upload berkas kwitansi / bukti pengganti"}
                </span>
                <span className="text-xs text-gray-400">
                  Dapat memilih beberapa berkas sekaligus (JPG, PNG, PDF)
                </span>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-800">
                    Berkas baru pengganti ({selectedFiles.length}):
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Batal ganti berkas
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white border border-blue-200 rounded-lg text-xs"
                    >
                      <span className="truncate max-w-[180px] text-gray-700 font-medium">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
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

          {/* Tombol Action */}
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow"
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
