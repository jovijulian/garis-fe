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
import { Check, Loader2, PlusCircle, Trash2, Users, Bed, Calendar } from 'lucide-react';
import SingleDatePicker from "@/components/calendar/SingleDatePicker";

interface SelectOption { value: string; label: string; }

interface GuestItem {
    guest_name: string;
    gender: 'Laki-laki' | 'Perempuan';
}

export default function CreateAccommodationPage() {
    const router = useRouter();
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Options
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const genderOptions: SelectOption[] = [
        { value: 'Laki-laki', label: 'Laki-laki' },
        { value: 'Perempuan', label: 'Perempuan' }
    ];

    // Form State
    const [headerData, setHeaderData] = useState({
        cab_id: null as number | null,
        check_in_date: '',
        check_out_date: '',
        room_needed: '',
        note: '',
    });

    const [guests, setGuests] = useState<GuestItem[]>([
        { guest_name: '', gender: 'Laki-laki' }
    ]);

    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const sitesRes = await httpGet(endpointUrl("/rooms/site-options"), true);
                setSiteOptions(sitesRes.data.data.map((s: any) => ({
                    value: s.id_cab.toString(),
                    label: s.nama_cab
                })));
            } catch (error) {
                toast.error("Gagal memuat data cabang.");
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleFieldChange = (field: keyof typeof headerData, value: any) => {
        setHeaderData(prev => ({ ...prev, [field]: value }));
    };

    const handleGuestChange = (index: number, field: keyof GuestItem, value: any) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const addGuest = () => {
        setGuests([...guests, { guest_name: '', gender: 'Laki-laki' }]);
    };

    const removeGuest = (index: number) => {
        if (guests.length <= 1) return;
        setGuests(guests.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi Dasar
        if (!headerData.cab_id) return toast.error("Pilih Cabang/Site terlebih dahulu.");
        if (!headerData.check_in_date || !headerData.check_out_date) return toast.error("Lengkapi tanggal menginap.");
        if (guests.some(g => !g.guest_name)) return toast.error("Semua nama tamu harus diisi.");

        setIsSubmitting(true);

        const payload = {
            ...headerData,
            check_in_date: moment(headerData.check_in_date).format('YYYY-MM-DD'),
            check_out_date: moment(headerData.check_out_date).format('YYYY-MM-DD'),
            guests: guests
        };

        try {
            await httpPost(endpointUrl('/accommodations'), payload, true);
            toast.success("Pengajuan akomodasi berhasil dikirim!");
            router.push('/orders/my-orders/accommodation');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengirim pengajuan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ComponentCard title="Ajukan Pesanan Akomodasi">
            <form onSubmit={handleSubmit} className="space-y-8">

                {/* --- Bagian 1: Informasi Lokasi & Waktu --- */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                        <Calendar size={20} className="text-blue-600" /> Informasi Menginap
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Pilih Site/Cabang</label>
                            <Select
                                options={siteOptions}
                                value={_.find(siteOptions, { value: headerData.cab_id?.toString() })}
                                onValueChange={(opt) => handleFieldChange('cab_id', opt ? parseInt(opt.value) : null)}
                                placeholder="Pilih lokasi site..."
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Tanggal Check-In</label>
                            <SingleDatePicker
                                placeholderText="Pilih tanggal masuk"
                                selectedDate={headerData.check_in_date ? new Date(headerData.check_in_date) : null}
                                onChange={(date: any) => handleFieldChange('check_in_date', date)}
                                viewingMonthDate={viewingMonthDate}
                                onMonthChange={setViewingMonthDate}
                                onClearFilter={() => handleFieldChange('check_in_date', '')}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Tanggal Check-Out</label>
                            <SingleDatePicker
                                placeholderText="Pilih tanggal keluar"
                                selectedDate={headerData.check_out_date ? new Date(headerData.check_out_date) : null}
                                onChange={(date: any) => handleFieldChange('check_out_date', date)}
                                viewingMonthDate={viewingMonthDate}
                                onMonthChange={setViewingMonthDate}
                                onClearFilter={() => handleFieldChange('check_out_date', '')}
                            />
                        </div>
                    </div>
                </div>

                {/* --- Bagian 2: Detail Kamar & Catatan --- */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                        <Bed size={20} className="text-blue-600" /> Kebutuhan Kamar
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Jenis/Jumlah Kamar</label>
                            <Input
                                defaultValue={headerData.room_needed}
                                onChange={(e) => handleFieldChange('room_needed', e.target.value)}
                                placeholder="Contoh: 2 Kamar Deluxe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1 text-sm text-gray-700">Catatan Tambahan</label>
                            <Input
                                defaultValue={headerData.note}
                                onChange={(e) => handleFieldChange('note', e.target.value)}
                                placeholder="Contoh: Non-smoking area, dekat lift"
                            />
                        </div>
                    </div>
                </div>

                {/* --- Bagian 3: Daftar Tamu --- */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-blue-600" /> Daftar Nama Tamu
                        </h3>
                        <button
                            type="button"
                            onClick={addGuest}
                            className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <PlusCircle size={18} /> Tambah Tamu
                        </button>
                    </div>

                    <div className="space-y-3">
                        {guests.map((guest, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-xl bg-gray-50 items-end">
                                {/* <div className="md:col-span-1 hidden md:flex items-center justify-center">
                                    <span className="text-gray-400 font-bold">{index + 1}</span>
                                </div> */}
                                <div className="md:col-span-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Lengkap Tamu</label>
                                    <Input
                                        defaultValue={guest.guest_name}
                                        onChange={(e) => handleGuestChange(index, 'guest_name', e.target.value)}
                                        placeholder="Masukkan nama sesuai KTP"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Jenis Kelamin</label>
                                    <Select
                                        options={genderOptions}
                                        value={_.find(genderOptions, { value: guest.gender })}
                                        onValueChange={(opt) => handleGuestChange(index, 'gender', opt?.value)}
                                        placeholder="Pilih"
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    {guests.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeGuest(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Action Buttons --- */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
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