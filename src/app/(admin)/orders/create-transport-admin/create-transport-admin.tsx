"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";
import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { 
    Check, Loader2, PlusCircle, Trash2, 
    Users, MapPin, Calendar, Clock, Ticket, UserCircle
} from 'lucide-react';
import SingleDatePicker from "@/components/calendar/SingleDatePicker";

interface SelectOption { value: string; label: string; }

interface PassengerItem {
    passenger_name: string;
    phone_number: string;
}

export default function CreateTransportAdminPage() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
    const [transportTypeOptions, setTransportTypeOptions] = useState<SelectOption[]>([]);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [headerData, setHeaderData] = useState({
        user_id: null as string | null,
        cab_id: null as number | null,
        transport_type_id: null as number | null,
        origin: '',
        origin_detail: '',
        destination: '',
        destination_detail: '',
        date: '', 
        time: '', 
        transport_class: '',     
        preferred_provider: '',  
        purpose: '',            
        note: '',
    });

    const [passengers, setPassengers] = useState<PassengerItem[]>([
        { passenger_name: '', phone_number: '' }
    ]);

    const timeOptions: SelectOption[] = [
        { value: '06.00-12.00', label: '06.00 - 12.00 (Pagi - Siang)' },
        { value: '12.00-18.00', label: '12.00 - 18.00 (Siang - Sore)' },
        { value: '18.00-00.00', label: '18.00 - 00.00 (Sore - Malam)' },
    ];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [sitesRes, usersRes, typesRes] = await Promise.all([
                    httpGet(endpointUrl("/rooms/site-options"), true),
                    httpGet(endpointUrl("/users/options"), true),
                    httpGet(endpointUrl("/transport-types/options"), true)
                ]);

                setSiteOptions(sitesRes.data.data.map((s: any) => ({
                    value: s.id_cab.toString(),
                    label: s.nama_cab
                })));

                setUserOptions(usersRes.data.data.map((u: any) => ({
                    value: u.id_user,
                    label: u.nama_user
                })));

                setTransportTypeOptions(typesRes.data.data.map((t: any) => ({
                    value: t.id.toString(),
                    label: t.name
                })));

            } catch (error) {
                toast.error("Gagal memuat data master.");
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleFieldChange = (field: keyof typeof headerData, value: any) => {
        setHeaderData(prev => ({ ...prev, [field]: value }));
    };

    const handlePassengerChange = (index: number, field: keyof PassengerItem, value: any) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const addPassenger = () => {
        setPassengers([...passengers, { passenger_name: '', phone_number: '' }]);
    };

    const removePassenger = (index: number) => {
        if (passengers.length <= 1) return;
        setPassengers(passengers.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!headerData.user_id) return toast.error("Pilih User Pemohon.");
        if (!headerData.cab_id) return toast.error("Pilih Cabang/Site asal.");
        if (!headerData.transport_type_id) return toast.error("Pilih jenis transportasi.");
        if (!headerData.origin || !headerData.destination) return toast.error("Kota asal dan tujuan wajib diisi.");
        if (!headerData.date) return toast.error("Tanggal keberangkatan wajib diisi.");
        if (!headerData.time) return toast.error("Jam keberangkatan wajib diisi.");
        if (passengers.some(p => !p.passenger_name)) return toast.error("Nama semua penumpang harus diisi.");

        setIsSubmitting(true);

        const payload = {
            ...headerData,
            date: moment(headerData.date).format('YYYY-MM-DD'),
            passengers: passengers
        };

        try {
            await httpPost(endpointUrl('/transport-orders'), payload, true);
            toast.success("Pengajuan transportasi berhasil dibuat!");
            router.push('/orders/manage-order-transport');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengirim pengajuan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ComponentCard title="Buat Pesanan Transportasi (Admin)">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 text-gray-800">
                        <UserCircle size={20} className="text-purple-600" /> Informasi Pemohon
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Nama Pemohon<span className="text-red-500 ml-1">*</span></label>
                            <Select
                                options={userOptions}
                                value={_.find(userOptions, { value: headerData.user_id })}
                                onValueChange={(opt) => handleFieldChange('user_id', opt ? opt.value : null)}
                                placeholder="Pilih user pemohon..."
                                isLoading={loadingOptions}
                            />
                        </div>
                         <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Site/Cabang Pemohon<span className="text-red-500 ml-1">*</span></label>
                            <Select
                                options={siteOptions}
                                value={_.find(siteOptions, { value: headerData.cab_id?.toString() })}
                                onValueChange={(opt) => handleFieldChange('cab_id', opt ? parseInt(opt.value) : null)}
                                placeholder="Pilih cabang..."
                                isLoading={loadingOptions}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 text-gray-800">
                        <MapPin size={20} className="text-blue-600" /> Rute & Jadwal
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Jenis Transportasi<span className="text-red-500 ml-1">*</span></label>
                            <Select
                                options={transportTypeOptions}
                                value={_.find(transportTypeOptions, { value: headerData.transport_type_id?.toString() })}
                                onValueChange={(opt) => handleFieldChange('transport_type_id', opt ? parseInt(opt.value) : null)}
                                placeholder="Pilih jenis (Kereta, Pesawat, dll)..."
                            />
                        </div>
                         <div className="hidden md:block"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="space-y-3">
                            <div>
                                <label className="block font-bold text-xs uppercase text-blue-800 mb-1">Kota Asal (Origin)<span className="text-red-500 ml-1">*</span></label>
                                <Input
                                    defaultValue={headerData.origin}
                                    onChange={(e) => handleFieldChange('origin', e.target.value)}
                                    placeholder="Contoh: Jakarta"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-medium text-xs text-gray-500 mb-1">Detail Lokasi (Stasiun/Bandara)</label>
                                <Input
                                    defaultValue={headerData.origin_detail}
                                    onChange={(e) => handleFieldChange('origin_detail', e.target.value)}
                                    placeholder="Contoh: Stasiun Gambir"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block font-bold text-xs uppercase text-green-700 mb-1">Kota Tujuan (Destination)<span className="text-red-500 ml-1">*</span></label>
                                <Input
                                    defaultValue={headerData.destination}
                                    onChange={(e) => handleFieldChange('destination', e.target.value)}
                                    placeholder="Contoh: Bandung"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-medium text-xs text-gray-500 mb-1">Detail Lokasi Tujuan</label>
                                <Input
                                    defaultValue={headerData.destination_detail}
                                    onChange={(e) => handleFieldChange('destination_detail', e.target.value)}
                                    placeholder="Contoh: Stasiun Bandung"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700 flex items-center gap-1">
                                <Calendar size={14} /> Tanggal Keberangkatan<span className="text-red-500 ml-1">*</span>
                            </label>
                            <SingleDatePicker
                                placeholderText="Pilih tanggal berangkat"
                                selectedDate={headerData.date ? new Date(headerData.date) : null}
                                onChange={(date: any) => handleFieldChange('date', date)}
                                viewingMonthDate={viewingMonthDate}
                                onMonthChange={setViewingMonthDate}
                                onClearFilter={() => handleFieldChange('date', '')}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700 flex items-center gap-1">
                                <Clock size={14} /> Jam / Waktu <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Select
                                options={timeOptions}
                                value={timeOptions.find(opt => opt.value === headerData.time)}
                                onValueChange={(opt) => handleFieldChange('time', opt ? opt.value : '')}
                                placeholder="Pilih rentang waktu..."
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2 text-gray-800">
                        <Ticket size={20} className="text-orange-500" /> Detail Tiket & Keperluan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Kelas Transportasi</label>
                            <Input
                                defaultValue={headerData.transport_class}
                                onChange={(e) => handleFieldChange('transport_class', e.target.value)}
                                placeholder="Contoh: Eksekutif / Bisnis"
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Provider / Maskapai</label>
                            <Input
                                defaultValue={headerData.preferred_provider}
                                onChange={(e) => handleFieldChange('preferred_provider', e.target.value)}
                                placeholder="Contoh: Garuda Indonesia"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-sm text-gray-700">Keperluan Perjalanan <span className="text-red-500 ml-1">*</span></label>
                            <Input
                                defaultValue={headerData.purpose}
                                onChange={(e) => handleFieldChange('purpose', e.target.value)}
                                placeholder="Contoh: Meeting Client di Pusat"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1 text-sm text-gray-700">Catatan Tambahan</label>
                            <Input
                                defaultValue={headerData.note}
                                onChange={(e) => handleFieldChange('note', e.target.value)}
                                placeholder="Contoh: Tolong carikan kursi dekat jendela"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                            <Users size={20} className="text-green-600" /> Daftar Penumpang <span className="text-red-500 ml-1">*</span>
                        </h3>
                        <button
                            type="button"
                            onClick={addPassenger}
                            className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                        >
                            <PlusCircle size={16} /> Tambah Penumpang
                        </button>
                    </div>

                    <div className="space-y-3">
                        {passengers.map((p, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-xl bg-gray-50 items-end shadow-sm">
                                <div className="md:col-span-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Lengkap (Sesuai KTP)</label>
                                    <Input
                                        defaultValue={p.passenger_name}
                                        onChange={(e) => handlePassengerChange(index, 'passenger_name', e.target.value)}
                                        placeholder="Masukkan nama lengkap penumpang"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-5">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">No. Handphone (Opsional)</label>
                                    <Input
                                        defaultValue={p.phone_number}
                                        onChange={(e) => handlePassengerChange(index, 'phone_number', e.target.value)}
                                        placeholder="Contoh: 0812xxxx"
                                        type="tel"
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end pb-1">
                                    {passengers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removePassenger(index)}
                                            className="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                                            title="Hapus Penumpang"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || loadingOptions}
                        className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check size={20} />}
                        {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}