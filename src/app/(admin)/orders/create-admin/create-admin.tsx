"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
import TimePicker from '@/components/calendar/TimePicker';
// --- Interfaces and Types (Aligned with create.tsx) ---
type LocationType = 'booking' | 'custom';
interface SelectOption { value: string; label: string; }

interface OrderDetailItem {
    consumption_type_id: number | null;
    menu: string;
    qty: string;
    delivery_time: string;
}

export default function CreateOrderAdminPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- State Management (Mirrors create.tsx with admin additions) ---
    const [headerData, setHeaderData] = useState({
        booking_id: null as number | null,
        cab_id: null as number | null,
        location_text: '',
        purpose: '',
        order_date: '',
        pax: 0,
        note: '',
        user_id: null as string | null, // <-- Admin feature: user selector
    });

    const [details, setDetails] = useState<OrderDetailItem[]>([{
        consumption_type_id: null,
        menu: '',
        qty: '',
        delivery_time: ''
    }]);

    const [locationType, setLocationType] = useState<LocationType>('custom');
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Options State ---
    const [bookingOptions, setBookingOptions] = useState<SelectOption[]>([]);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [consumptionTypeOptions, setConsumptionTypeOptions] = useState<SelectOption[]>([]);
    const [userOptions, setUserOptions] = useState<SelectOption[]>([]); // <-- Admin feature: user options
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    useEffect(() => {
        const bookingIdFromUrl = searchParams.get('bookingId');
        const fetchInitialData = async () => {
            try {
                // Added usersRes for the admin user dropdown
                const [bookingsRes, sitesRes, consumptionTypesRes, usersRes] = await Promise.all([
                    httpGet(endpointUrl("/bookings/options"), true),
                    httpGet(endpointUrl("/rooms/site-options"), true),
                    httpGet(endpointUrl("/consumption-types/options"), true),
                    httpGet(endpointUrl("/users/options"), true),
                ]);

                setBookingOptions(bookingsRes.data.data.map((b: any) => ({ value: b.id.toString(), label: `${b.purpose} (${moment(b.start_time).format('DD MMM, HH:mm')})` })));
                setSiteOptions(sitesRes.data.data.map((s: any) => ({ value: s.id_cab.toString(), label: s.nama_cab })));
                setConsumptionTypeOptions(consumptionTypesRes.data.data.map((ct: any) => ({ value: ct.id.toString(), label: ct.name })));
                setUserOptions(usersRes.data.data.map((u: any) => ({ value: u.id_user, label: u.nama_user })));

                if (bookingIdFromUrl) {
                    setLocationType('booking');
                    const bookingIdNum = parseInt(bookingIdFromUrl, 10);
                    const bookingDetailRes = await httpGet(endpointUrl(`/bookings/${bookingIdNum}`), true);
                    const b = bookingDetailRes.data.data;

                    // Pre-fill header data from booking
                    setHeaderData(prev => ({
                        ...prev,
                        booking_id: bookingIdNum,
                        purpose: b.purpose,
                        order_date: moment(b.start_time).format('YYYY-MM-DD'),
                        pax: b.pax || 0,
                        user_id: b.user_id, // Automatically set the user from the booking
                    }));

                    // Pre-fill one detail item with the booking time
                    setDetails([{
                        consumption_type_id: null,
                        menu: '',
                        qty: '',
                        delivery_time: moment(b.start_time).format('YYYY-MM-DDTHH:mm'),
                    }]);
                } else {
                    setLocationType('custom');
                }

            } catch (error) {
                toast.error("Gagal memuat data awal.");
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchInitialData();
    }, [searchParams]);

    // --- Handlers (Identical to create.tsx) ---
    const handleHeaderChange = (field: keyof typeof headerData, value: any) => {
        setHeaderData(prev => ({ ...prev, [field]: value }));
    };

    const handleDetailChange = (index: number, field: keyof OrderDetailItem, value: any) => {
        const newDetails = [...details];
        newDetails[index] = { ...newDetails[index], [field]: value };
        setDetails(newDetails);
    };

    const addDetailItem = () => {
        setDetails([...details, { consumption_type_id: null, menu: '', qty: '', delivery_time: '' }]);
    };

    const removeDetailItem = (index: number) => {
        if (details.length <= 1) return;
        setDetails(details.filter((_, i) => i !== index));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...headerData,
            details: details.map(d => {
                const orderDate = moment(headerData.order_date).format('YYYY-MM-DD');
                const fullDateTime = moment(`${orderDate} ${d.delivery_time}`, 'YYYY-MM-DD HH:mm');

                return {
                    ...d,
                    qty: d.qty ? parseInt(d.qty, 10) : 0,
                    delivery_time: fullDateTime.isValid() ? fullDateTime.toISOString() : null,
                };
            }).filter(d => d.consumption_type_id && d.qty > 0)
        };

        // Conditional logic based on locationType
        if (payload.booking_id) {
            delete (payload as any).cab_id;
            delete (payload as any).location_text;
        } else {
            delete (payload as any).booking_id;
        }
        payload.order_date = moment(payload.order_date).format('YYYY-MM-DD');
        payload.pax = Number(payload.pax)
        payload.user_id = payload.user_id ? String(payload.user_id) : null;


        try {
            await httpPost(endpointUrl('/orders'), payload, true);
            toast.success("Pengajuan pesanan berhasil dikirim!");
            router.push('/orders/manage-order'); // Redirect to admin page
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengirim pengajuan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ComponentCard title="Buat Pesanan Baru (Admin)">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block font-medium mb-2">Untuk Keperluan Apa Pesanan Ini?</label>
                    {/* Simplified to two location types */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setLocationType('booking')}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${locationType === 'booking'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${locationType === 'booking' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                    }`}>
                                    {locationType === 'booking' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-800 mb-1">Booking Meeting</div>
                                    <div className="text-sm text-gray-600">Untuk booking ruangan yang sudah ada</div>
                                </div>
                            </div>
                        </button>



                        <button
                            type="button"
                            onClick={() => setLocationType('custom')}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${locationType === 'custom'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${locationType === 'custom' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                    }`}>
                                    {locationType === 'custom' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-800 mb-1">Lokasi Lainnya</div>
                                    <div className="text-sm text-gray-600">Tulis lokasi khusus</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* --- Dynamic Form Section --- */}
                {locationType === 'booking' && (
                    <div>
                        <label className="block font-medium mb-1">Pilih Booking</label>
                        <Select options={bookingOptions} value={_.find(bookingOptions, { value: headerData.booking_id?.toString() })} onValueChange={(opt) => handleHeaderChange('booking_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih booking yang sudah ada..." />
                    </div>
                )}

                {locationType === 'custom' && (
                    <div className="space-y-4">
                        {/* User selector is here, for custom orders only */}
                        <div>
                            <label className="block font-medium mb-1">Pilih Pengguna (Pemesan)</label>
                            <Select options={userOptions} value={_.find(userOptions, { value: headerData.user_id })} onValueChange={(opt) => handleHeaderChange('user_id', opt ? opt.value : null)} placeholder="Pilih nama pengguna..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block font-medium mb-1">Cabang/Site</label>
                                <Select options={siteOptions} value={_.find(siteOptions, { value: headerData.cab_id?.toString() })} onValueChange={(opt) => handleHeaderChange('cab_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih cabang..." />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Tulis Lokasi Spesifik</label>
                                <Input defaultValue={headerData.location_text} onChange={(e) => handleHeaderChange('location_text', e.target.value)} placeholder="Contoh: Area Departemen IT" />
                            </div>
                        </div>
                    </div>
                )}
                <hr />

                {/* --- General Information Section --- */}
                <h3 className="text-lg font-semibold border-b pb-2">Informasi Umum</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block font-medium mb-1">Keperluan Pesanan</label>
                        <Input defaultValue={headerData.purpose} onChange={(e) => handleHeaderChange('purpose', e.target.value)} placeholder="Contoh: Rapat Anggaran 2025" required />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Tanggal Pesanan</label>
                        <SingleDatePicker placeholderText="Pilih tanggal pesanan" selectedDate={headerData.order_date ? new Date(headerData.order_date) : null} onChange={(date: any) => handleHeaderChange('order_date', moment(date).format('YYYY-MM-DD'))} onClearFilter={() => handleHeaderChange('order_date', '')} viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate} />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Jumlah Orang</label>
                        <Input type="number" defaultValue={headerData.pax} onChange={(e) => handleHeaderChange('pax', e.target.value)} placeholder="0" />
                    </div>
                </div>

                {/* --- Detail Item Menu Section --- */}
                <div className="w-full">
                    <h3 className="text-lg font-semibold border-b pb-2 pt-4">Detail Item Menu</h3>
                    <div className="space-y-4 w-full mt-5">
                        {details.map((item, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg bg-gray-50">
                                <div className="md:col-span-4">
                                    <label className="text-xs text-gray-500">Jenis Konsumsi</label>
                                    <Select options={consumptionTypeOptions} onValueChange={(opt) => handleDetailChange(index, 'consumption_type_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih"
                                        value={
                                            item.consumption_type_id ? _.find(consumptionTypeOptions, { value: item.consumption_type_id.toString() }) : null
                                        } />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-xs text-gray-500">Nama Menu</label>
                                    <Input defaultValue={item.menu} onChange={(e) => handleDetailChange(index, 'menu', e.target.value)} placeholder="Deskripsi Menu..." />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="text-xs text-gray-500">Qty</label>
                                    <Input type="number" defaultValue={item.qty} onChange={(e) => handleDetailChange(index, 'qty', e.target.value)} placeholder="Qty" />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-xs text-gray-500">Waktu Antar</label>
                                    <TimePicker
                                        value={item.delivery_time}
                                        onChange={(newTime) => handleDetailChange(index, 'delivery_time', newTime)}
                                        required={true}
                                    />
                                </div>
                                <div className="md:col-span-1 flex items-center justify-end">
                                    {details.length > 1 && <button type="button" onClick={() => removeDetailItem(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addDetailItem} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><PlusCircle size={16} />Tambah Item</button>
                    </div>
                </div>

                {/* --- Notes Section --- */}
                <div>
                    <h3 className="text-lg font-semibold border-b pb-2 pt-4">Catatan</h3>
                    <textarea value={headerData.note} onChange={(e) => handleHeaderChange('note', e.target.value)} rows={5} placeholder={"Contoh: Tidak pakai MSG"} className="w-full border p-2 rounded-md mt-5" />
                </div>

                {/* --- Action Buttons --- */}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Batal</button>
                    <button type="submit" disabled={isSubmitting || loadingOptions} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check />}
                        {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}