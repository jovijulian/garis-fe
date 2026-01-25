"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";
import { useRouter, useSearchParams } from 'next/navigation';
import { endpointUrl, httpGet, httpPost, alertToast } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Loader2 } from 'lucide-react';
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
import TimePicker from '@/components/calendar/TimePicker';


interface VehicleRequestPayload {
  cab_id: number | null;
  pickup_location_text: string | null;
  destination: string;
  start_time: string;
  end_time: string | null;
  passenger_count: number;
  passenger_names: string;
  requested_vehicle_type_id: number | null;
  requested_vehicle_count: number;
  purpose: string;
  note: string;
  requires_driver?: boolean;
  id_user?: string;
}

interface FormState {
  cab_id: number | null;
  pickup_location_text: string;
  destination: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string | null;
  passenger_count: number;
  passenger_names: string;
  requested_vehicle_type_id: number | null;
  requested_vehicle_count: number;
  purpose: string;
  note: string;
  requires_driver?: boolean;
  user_id: string | null;
}

interface SelectOption { value: string; label: string; }

export default function CreateVehicleRequestAdminPage() {
  const router = useRouter();
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<SelectOption[]>([]);
  const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [requestType, setRequestType] = useState<'vehicle' | 'driver'>('vehicle');
  const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

  const [formData, setFormData] = useState<FormState>({
    cab_id: null,
    pickup_location_text: "",
    destination: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    passenger_count: 1,
    passenger_names: "",
    requested_vehicle_type_id: null,
    requested_vehicle_count: 1,
    purpose: "",
    note: "",
    requires_driver: true,
    user_id: null,
  });

  useEffect(() => {
    const vehicleTypeIdParam = searchParams.get("vehicleTypeId");
    const startTimeParam = searchParams.get("start_time");

    const updates: Partial<FormState> = {};

    if (startTimeParam) {
      const startMoment = moment(startTimeParam, 'YYYY-MM-DDTHH:mm');
      if (startMoment.isValid()) {
        updates.start_date = startMoment.format('YYYY-MM-DD');
        updates.start_time = startMoment.format('HH:mm');
        updates.end_date = startMoment.format('YYYY-MM-DD');
      }
    }

    if (vehicleTypeIdParam) {
      updates.requested_vehicle_type_id = parseInt(vehicleTypeIdParam, 10);
    }

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
    const fetchInitialData = async () => {
      setLoadingOptions(true);
      setLoadingUsers(true);
      try {
        const [sitesRes, vehicleTypesRes, usersRes] = await Promise.all([
          httpGet(endpointUrl("/rooms/site-options"), true),
          httpGet(endpointUrl("/vehicle-types/options"), true),
          httpGet(endpointUrl("/users/options"), true),
        ]);

        setSiteOptions(sitesRes.data.data.map((s: any) => ({ value: s.id_cab.toString(), label: s.nama_cab })));
        setVehicleTypeOptions(vehicleTypesRes.data.data.map((vt: any) => ({ value: vt.id.toString(), label: vt.name })));
        setUserOptions(usersRes.data.data.map((u: any) => ({ value: u.id_user, label: u.nama_user })));

      } catch (error) {
        toast.error("Gagal memuat data awal untuk form.");
      } finally {
        setLoadingOptions(false);
        setLoadingUsers(false);
      }
    };

    fetchInitialData();
  }, [searchParams]);

  const handleFieldChange = (field: keyof FormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id) {
      toast.error("Harap pilih pengguna yang mengajukan.");
      return;
    }
    if (!formData.start_date || !formData.start_time) {
      toast.error("Harap isi tanggal dan waktu mulai dengan lengkap.");
      return;
    }
    if (formData.end_date && formData.end_time) {
      const startMoment = moment(`${formData.start_date} ${formData.start_time}`);
      const endMoment = moment(`${formData.end_date} ${formData.end_time}`);
      if (!endMoment.isAfter(startMoment)) {
        toast.error("Waktu selesai harus setelah waktu mulai.");
        return;
      }
    }

    if (requestType === 'vehicle') {
      if (!formData.requested_vehicle_type_id) {
        toast.error("Harap pilih jenis kendaraan yang diminta.");
        return;
      }
      if (formData.requested_vehicle_count < 1) {
        toast.error("Jumlah unit kendaraan harus minimal 1.");
        return;
      }
    }


    setIsSubmitting(true);

    const start_time_iso = moment(`${formData.start_date} ${formData.start_time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
    const end_time_iso = (formData.end_date && formData.end_time)
      ? moment(`${formData.end_date} ${formData.end_time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss')
      : null;

    const payload: VehicleRequestPayload = {
      cab_id: formData.cab_id ? Number(formData.cab_id) : null,
      pickup_location_text: formData.pickup_location_text || null,
      destination: formData.destination,
      start_time: start_time_iso,
      end_time: end_time_iso,
      passenger_count: Number(formData.passenger_count),
      passenger_names: formData.passenger_names,
      purpose: formData.purpose,
      note: formData.note,
      id_user: formData.user_id || undefined,
      requested_vehicle_type_id: requestType === 'vehicle' && formData.requested_vehicle_type_id ? Number(formData.requested_vehicle_type_id) : null,
      requested_vehicle_count: requestType === 'vehicle' ? Number(formData.requested_vehicle_count) : 0,
      requires_driver: requestType === 'vehicle' ? formData.requires_driver : true, // Driver mode always requires driver
    };

    try {
      await httpPost(endpointUrl('/vehicle-requests'), payload, true);
      toast.success("Pengajuan kendaraan berhasil dibuat!");
      router.push('/vehicles/manage-requests');
    } catch (error: any) {
      toast.error("Gagal mengirim pengajuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComponentCard title="Buat Pengajuan Kendaraan (Admin)">
      <div className="flex gap-4 mb-6 border-b pb-4">
        <button
          type="button"
          onClick={() => setRequestType('vehicle')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${requestType === 'vehicle'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Peminjaman Kendaraan
        </button>
        <button
          type="button"
          onClick={() => setRequestType('driver')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${requestType === 'driver'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Peminjaman Pengemudi
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block font-medium mb-1">Pilih Pengguna (Pemohon)<span className="text-red-400 ml-1">*</span></label>
          <Select
            options={userOptions}
            value={_.find(userOptions, { value: formData.user_id })}
            onValueChange={(opt) => handleFieldChange('user_id', opt ? opt.value : null)}
            placeholder={loadingUsers ? "Memuat pengguna..." : "Pilih pengguna..."}
          />
        </div>
        <hr />

        <h3 className="text-lg font-semibold border-b pb-2">Informasi Perjalanan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Keperluan<span className="text-red-400 ml-1">*</span></label>
            <Input defaultValue={formData.purpose} onChange={(e) => handleFieldChange('purpose', e.target.value)} placeholder="Contoh: Kunjungan klien..." required />
          </div>
          <div>
            <label className="block font-medium mb-1">Tujuan<span className="text-red-400 ml-1">*</span></label>
            <Input defaultValue={formData.destination} onChange={(e) => handleFieldChange('destination', e.target.value)} placeholder="Contoh: Kawasan Industri Cikarang" required />
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Cabang Penjemputan</label>
            <Select
              options={siteOptions}
              value={_.find(siteOptions, { value: formData.cab_id?.toString() })}
              onValueChange={(opt) =>
                handleFieldChange('cab_id', opt ? parseInt(opt.value) : null)
              }
              placeholder="Pilih cabang (jika di kantor)..."
              disabled={loadingOptions || isSubmitting}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Lokasi Jemput Spesifik</label>
            <Input
              defaultValue={formData.pickup_location_text}
              onChange={(e) => handleFieldChange('pickup_location_text', e.target.value)}
              placeholder="Contoh: Lobby Utama (jika bukan di kantor)"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block font-medium mb-1">Tanggal Mulai<span className="text-red-400 ml-1">*</span></label>
            <SingleDatePicker
              placeholderText="Pilih tanggal"
              selectedDate={formData.start_date ? new Date(formData.start_date) : null}
              onChange={(date: any) => handleFieldChange('start_date', moment(date).format('YYYY-MM-DD'))}
              onClearFilter={() => handleFieldChange('start_date', '')}
              viewingMonthDate={viewingMonthDate}
              onMonthChange={setViewingMonthDate}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Waktu Mulai<span className="text-red-400 ml-1">*</span></label>
            <TimePicker
              value={formData.start_time}
              onChange={(newTime) => handleFieldChange('start_time', newTime)}
              required={true}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Tanggal Selesai</label>
            <SingleDatePicker
              placeholderText="Pilih tanggal"
              selectedDate={formData.end_date ? new Date(formData.end_date) : null}
              onChange={(date: any) => handleFieldChange('end_date', moment(date).format('YYYY-MM-DD'))}
              onClearFilter={() => handleFieldChange('end_date', '')}
              viewingMonthDate={viewingMonthDate}
              onMonthChange={setViewingMonthDate}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Waktu Selesai</label>
            <TimePicker
              value={formData.end_time || ''}
              onChange={(newTime) => handleFieldChange('end_time', newTime)}
              required={false}
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold border-b pb-2 pt-4">Detail Kebutuhan</h3>
        {requestType === 'vehicle' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
            <div>
              <label className="block font-medium mb-1">Jenis Kendaraan<span className="text-red-400 ml-1">*</span></label>
              <Select
                options={vehicleTypeOptions}
                value={_.find(vehicleTypeOptions, { value: formData.requested_vehicle_type_id?.toString() })}
                onValueChange={(opt) =>
                  handleFieldChange('requested_vehicle_type_id', opt ? parseInt(opt.value) : null)
                }
                placeholder="Pilih jenis kendaraan..."
                disabled={loadingOptions || isSubmitting}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Jumlah Unit<span className="text-red-400 ml-1">*</span></label>
              <Input
                type="number"
                defaultValue={formData.requested_vehicle_count}
                onChange={(e) =>
                  handleFieldChange('requested_vehicle_count', Number(e.target.value) < 1 ? 1 : e.target.value)
                }
                placeholder="1"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Jumlah Penumpang<span className="text-red-400 ml-1">*</span></label>
              <Input
                type="number"
                defaultValue={formData.passenger_count}
                onChange={(e) => handleFieldChange('passenger_count', Number(e.target.value) < 1 ? 1 : e.target.value)}
                placeholder="1"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {requestType === 'driver' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
              <p className="font-semibold text-sm">Mode Permohonan Pengemudi</p>
              <p className="text-xs mt-1">Sistem akan mencatat pengajuan ini khusus untuk permintaan tenaga pengemudi tanpa unit kendaraan.</p>
            </div>
            <div>
              <label className="block font-medium mb-1">Jumlah Penumpang<span className="text-red-400 ml-1">*</span></label>
              <Input
                type="number"
                defaultValue={formData.passenger_count}
                onChange={(e) => handleFieldChange('passenger_count', Number(e.target.value) < 1 ? 1 : e.target.value)}
                placeholder="1"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Nama Penumpang</label>
            <textarea value={formData.passenger_names} onChange={(e) => handleFieldChange('passenger_names', e.target.value)} rows={5} placeholder={"Contoh: Budi, Susi, dan Tamu Klien"} className="w-full border p-2 rounded-md" disabled={isSubmitting} />
          </div>
          <div>
            <label className="block font-medium mb-1">Catatan Tambahan</label>
            <textarea value={formData.note} onChange={(e) => handleFieldChange('note', e.target.value)} rows={5} placeholder={"Contoh: Mohon siapkan mobil yang bersih."} className="w-full border p-2 rounded-md" disabled={isSubmitting} />
          </div>
        </div>

        {requestType === 'vehicle' && (
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_driver}
                onChange={(e) => handleFieldChange('requires_driver', e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
                disabled={isSubmitting}
              />
              <span className="ml-2">Memerlukan Supir?</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Batal</button>
          <button type="submit" disabled={isSubmitting || loadingOptions || loadingUsers} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check />}
            {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}