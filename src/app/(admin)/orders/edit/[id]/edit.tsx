"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";

import { endpointUrl, httpGet, httpPut, parseMenuDescription } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Loader2, PlusCircle, Trash2 } from 'lucide-react';

// --- Interface (Sama seperti halaman create) ---
type LocationType = 'booking' | 'room' | 'custom';
interface SelectOption { value: string; label: string; }

export default function EditOrderPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    const [formData, setFormData] = useState({
        booking_id: null as number | null,
        room_id: null as number | null,
        cab_id: null as number | null,
        location_text: '',
        consumption_type_id: null as number | null,
        pax: '',
        order_time: '',
        menu_description: [''] as string[],
        note: ''
    });
    const [locationType, setLocationType] = useState<LocationType>('room');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingOptions, setBookingOptions] = useState<SelectOption[]>([]);
    const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [consumptionTypeOptions, setConsumptionTypeOptions] = useState<SelectOption[]>([]);

    const handleFieldChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (!id) return;

        const fetchInitialData = async () => {
            try {
                const [orderRes, bookingsRes, roomsRes, sitesRes, consumptionTypesRes] = await Promise.all([
                    httpGet(endpointUrl(`/orders/${id}`), true),
                    httpGet(endpointUrl("/bookings/options"), true),
                    httpGet(endpointUrl("/rooms/options"), true),
                    httpGet(endpointUrl("/rooms/site-options"), true),
                    httpGet(endpointUrl("/consumption-types/options"), true),
                ]);

                setBookingOptions(bookingsRes.data.data.map((b: any) => ({ value: b.id.toString(), label: `${b.purpose} (${moment(b.start_time).format('DD MMM')})` })));
                setRoomOptions(roomsRes.data.data.map((r: any) => ({ value: r.id.toString(), label: r.name })));
                setSiteOptions(sitesRes.data.data.map((s: any) => ({ value: s.id_cab.toString(), label: s.nama_cab })));
                setConsumptionTypeOptions(consumptionTypesRes.data.data.map((ct: any) => ({ value: ct.id.toString(), label: ct.name })));

                const orderData = orderRes.data.data;
                const parsedMenuItems = parseMenuDescription(orderData.menu_description);

                // Jika tidak ada menu, pastikan ada satu baris input kosong
                if (parsedMenuItems.length === 0) {
                    parsedMenuItems.push('');
                }
                setFormData({
                    booking_id: orderData.booking_id,
                    room_id: orderData.room_id,
                    cab_id: orderData.cab_id,
                    location_text: orderData.location_text || '',
                    consumption_type_id: orderData.consumption_type_id,
                    pax: orderData.pax || '',
                    order_time: moment(orderData.order_time).format('YYYY-MM-DDTHH:mm'),
                    menu_description: parsedMenuItems,
                    note: orderData.note || '',
                });

                if (orderData.booking_id) {
                    setLocationType('booking');
                } else if (orderData.room_id) {
                    setLocationType('room');
                } else {
                    setLocationType('custom');
                }

            } catch (error) {
                toast.error("Gagal memuat data pesanan.");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formattedMenuDescription = formData.menu_description
            .filter(item => item.trim() !== '')
            .join('\n');
        const payload: any = { ...formData };
        payload.pax = formData.pax ? parseInt(formData.pax.toString(), 10) : null;
        payload.order_time = moment(formData.order_time).toISOString();
        payload.menu_description = formattedMenuDescription
        if (locationType === 'booking') {
            delete payload.room_id;
            delete payload.cab_id;
            delete payload.location_text;
        } else if (locationType === 'room') {
            delete payload.booking_id;
            delete payload.location_text;
        } else if (locationType === 'custom') {
            delete payload.booking_id;
            delete payload.room_id;
        }


        try {
            await httpPut(endpointUrl(`/orders/${id}`), payload, true);
            toast.success("Pesanan berhasil diperbarui!");
            router.push('/orders/my-orders');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memperbarui pesanan.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleMenuItemChange = (index: number, value: string) => {
        const newMenuItems = [...formData.menu_description];
        newMenuItems[index] = value;
        handleFieldChange('menu_description', newMenuItems);
    };
    const addMenuItem = () => {
        handleFieldChange('menu_description', [...formData.menu_description, '']);
    };
    const removeMenuItem = (index: number) => {
        if (formData.menu_description.length <= 1) return;
        const newMenuItems = formData.menu_description.filter((_, i) => i !== index);
        handleFieldChange('menu_description', newMenuItems);
    };
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <ComponentCard title="Ubah Pesanan Konsumsi">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block font-medium mb-2">Untuk Keperluan Apa Pesanan Ini?</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            onClick={() => setLocationType('room')}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${locationType === 'room'
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${locationType === 'room' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                    }`}>
                                    {locationType === 'room' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-800 mb-1">Ruangan Spesifik</div>
                                    <div className="text-sm text-gray-600">Pilih ruangan dari daftar</div>
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

                {/* --- Form Dinamis --- */}
                {locationType === 'booking' && (
                    <div>
                        <label className="block font-medium mb-1">Pilih Booking</label>
                        <Select options={bookingOptions} value={_.find(bookingOptions, { value: formData.booking_id?.toString() })} onValueChange={(opt) => handleFieldChange('booking_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih booking yang sudah ada..." />
                    </div>
                )}
                {locationType === 'room' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1">Cabang/Site</label>
                            <Select options={siteOptions} value={_.find(siteOptions, { value: formData.cab_id?.toString() })} onValueChange={(opt) => handleFieldChange('cab_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih cabang..." />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Ruangan</label>
                            <Select options={roomOptions} value={_.find(roomOptions, { value: formData.room_id?.toString() })} onValueChange={(opt) => handleFieldChange('room_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih ruangan..." />
                        </div>
                    </div>
                )}
                {locationType === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1">Cabang/Site</label>
                            <Select options={siteOptions} value={_.find(siteOptions, { value: formData.cab_id?.toString() })} onValueChange={(opt) => handleFieldChange('cab_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih cabang..." />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Tulis Lokasi Spesifik</label>
                            <Input defaultValue={formData.location_text} onChange={(e) => handleFieldChange('location_text', e.target.value)} placeholder="Contoh: Area Departemen IT" />
                        </div>
                    </div>
                )}

                <hr />

                {/* --- Detail Pesanan --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block font-medium mb-1">Jenis Konsumsi</label>
                        <Select options={consumptionTypeOptions} value={_.find(consumptionTypeOptions, { value: formData.consumption_type_id?.toString() })} onValueChange={(opt) => handleFieldChange('consumption_type_id', opt ? parseInt(opt.value) : null)} placeholder="Pilih jenis..." />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Jumlah Orang (Pax)</label>
                        <Input type="number" defaultValue={formData.pax} onChange={(e) => handleFieldChange('pax', e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Waktu Dibutuhkan</label>
                        <input type="datetime-local" value={formData.order_time} onChange={e => handleFieldChange('order_time', e.target.value)} className="w-full border p-2 rounded-md" />
                    </div>
                </div>

                <div className="w-full">
                    <label className="block font-medium mb-1">Deskripsi Menu</label>
                    <div className="w-full space-y-3">
                        {formData.menu_description.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 w-full">
                                <div className="flex-1">
                                    <Input
                                        type="text"
                                        defaultValue={item} // Gunakan 'value' karena state terkontrol
                                        onChange={(e) => handleMenuItemChange(index, e.target.value)}
                                        placeholder="Contoh: Nasi Ayam Bakar x5"
                                        className="w-full"
                                    />
                                </div>
                                {formData.menu_description.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMenuItem(index)}
                                        className="p-2 text-red-500 hover:bg-red-100 rounded-full shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addMenuItem}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Tambah Menu Lain
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-1">Catatan</label>
                    <textarea value={formData.note} onChange={(e) => handleFieldChange('note', e.target.value)} rows={5} placeholder={"Contoh: Rumah makan Padang"} className="w-full border p-2 rounded-md" />
                </div>



                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Batal</button>
                    <button type="submit" disabled={isSubmitting || loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check />}
                        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}