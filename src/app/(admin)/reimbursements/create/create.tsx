"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from 'lodash';

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import SingleDatePicker from '@/components/calendar/SingleDatePicker';
import {
  Check, Loader2, Upload, X, PlusCircle, Trash2, Calendar,
  MapPin, Building2, HelpCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { ReimbursementItemOption } from '@/types/reimbursement';

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
  is_dynamic?: boolean; // true if it's item_id 6 added dynamically
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

export default function CreateReimbursementPage() {
  const router = useRouter();
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ReimbursementItemOption[]>([]);

  const [formData, setFormData] = useState({
    cab_id: null as number | null,
    destination: '',
    start_date: '',
    end_date: '',
    duration: 1,
    duration_type: 'Hari', // 'Hari' | 'Malam'
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

  // Fetch Site Options & Item Options
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingOptions(true);
        const [sitesRes, itemsRes] = await Promise.all([
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

        if (itemsRes?.data?.data) {
          const items: ReimbursementItemOption[] = itemsRes.data.data;
          setItemOptions(items);

          // Inisialisasi item baku 1 s/d 5
          const defaultRows: DetailRow[] = items
            .filter((item) => item.id !== 6)
            .map((item) => ({
              item_id: item.id,
              item_name: item.item_name,
              claim_amount: '',
              notes: '',
              has_receipt: 0,
              is_dynamic: false,
            }));

          // Munculkan template biaya lainnya (item 6) 1 row untuk di awal
          const item6 = items.find((item) => item.id === 6);
          defaultRows.push({
            item_id: 6,
            item_name: item6?.item_name || 'Biaya Lainnya',
            claim_amount: '',
            notes: '',
            has_receipt: 0,
            is_dynamic: true,
          });

          setDetails(defaultRows);
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat opsi form reimbursement.");
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchInitialData();
  }, []);

  // Perhitungan otomatis durasi ketika tanggal atau tipe durasi berubah
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const calculatedDuration = calculateDuration(
        formData.start_date,
        formData.end_date,
        formData.duration_type
      );
      setFormData((prev) => ({ ...prev, duration: calculatedDuration }));
    }
  }, [formData.start_date, formData.end_date, formData.duration_type]);

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

  // Tambah item biaya lainnya (item_id: 6)
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

  // Hapus item dinamis
  const handleRemoveBiayaLainnya = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  // Hitung total nilai klaim secara live
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
    if (!formData.duration || formData.duration < 1) {
      toast.error("Durasi harus minimal 1.");
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

      // Format details
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

      // Append files
      selectedFiles.forEach((file) => {
        payload.append('files', file);
      });

      await httpPost(endpointUrl('/reimbursements'), payload, true);
      toast.success("Pengajuan reimbursement berhasil dikirim!");
      router.push('/reimbursements/my-reimbursements');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Gagal mengirim pengajuan reimbursement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComponentCard title="Buat Pengajuan Reimbursement Baru">
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
                placeholder={loadingOptions ? "Memuat cabang..." : "Pilih cabang..."}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Kota / Tempat Tujuan <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.destination}
                onChange={(e) => handleFieldChange('destination', e.target.value)}
                placeholder="Contoh: Jakarta, Surabaya, Site Cirebon..."
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
              placeholder="Contoh: Kunjungan survei lokasi instalasi jaringan dan rapat koordinasi dengan tim operasional..."
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

        {/* Section 3: Upload Berkas Kwitansi / Lampiran */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
            Upload Foto Kwitansi / Berkas Bukti (PDF / JPG / PNG)
          </h3>

          <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center bg-gray-50/50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="reimbursement-files"
            />
            <label
              htmlFor="reimbursement-files"
              className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="w-8 h-8 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600">
                Klik untuk upload berkas kwitansi / bukti
              </span>
              <span className="text-xs text-gray-400">
                Anda dapat memilih beberapa berkas sekaligus (JPG, PNG, PDF)
              </span>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600">
                Berkas terpilih ({selectedFiles.length}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-gray-100 rounded-lg text-xs"
                  >
                    <span className="truncate max-w-[200px] text-gray-700 font-medium">
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
            disabled={isSubmitting || loadingOptions}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                <span>Mengirim Pengajuan...</span>
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
