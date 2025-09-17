"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/id';
import _ from "lodash";

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Loader2 } from 'lucide-react';

// Interface untuk data form
interface BookingFormData {
    room_id: number | null;
    purpose: string;
    start_time: string;
    end_time: string;
    notes: string;
    amenity_ids: number[];
}

// Interface untuk pilihan dropdown
interface SelectOption {
    value: string;
    label: string;
}

interface AmenityOption {
    id: number;
    name: string;
}

export default function CreateBookingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<BookingFormData>({
        room_id: null,
        purpose: '',
        start_time: '',
        end_time: '',
        notes: '',
        amenity_ids: [],
    });

    const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingRoomOptions, setLoadingRoomOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSite, setSelectedSite] = useState<string | null>(null);

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const [siteRes, amenitiesRes] = await Promise.all([
                httpGet(endpointUrl("/rooms/site-options"), true),
                httpGet(endpointUrl("/amenities/options"), true),
            ]);

            const formattedSite = siteRes.data.data.map((site: any) => ({
                value: site.id_cab,
                label: `${site.nama_cab}`,
            }));

            setSiteOptions(formattedSite);
            setAmenityOptions(amenitiesRes.data.data || []);

        } catch (error) {
            console.log(error)
            toast.error("Gagal memuat data cabang dan fasilitas.");
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleFieldChange = (field: keyof BookingFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAmenityChange = (amenityId: number) => {
        setFormData(prev => {
            const newAmenityIds = prev.amenity_ids.includes(amenityId)
                ? prev.amenity_ids.filter(id => id !== amenityId)
                : [...prev.amenity_ids, amenityId];
            return { ...prev, amenity_ids: newAmenityIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { room_id, purpose, start_time, end_time } = formData;

        if (!room_id || !purpose || !start_time || !end_time) {
            toast.error("Mohon lengkapi semua field yang wajib diisi.");
            return;
        }

        if (moment(start_time).isAfter(end_time)) {
            toast.error("Waktu selesai harus setelah waktu mulai.");
            return;
        }

        setIsSubmitting(true);
        try {
            const availabilityRes = await httpGet(endpointUrl('/bookings/check-availability'), true, {
                room_id: room_id,
                start_time: moment(start_time).utc().toISOString(),
                end_time: moment(end_time).utc().toISOString(),
            });

            if (!availabilityRes.data.data.is_available) {
                const conflictInfo = availabilityRes.data.data.conflictingBooking;
                const message = `Peringatan: Jadwal ini sudah dipesan oleh ${conflictInfo.booked_by} untuk keperluan "${conflictInfo.purpose}".\n\nApakah Anda tetap ingin mengajukan (agar admin yang menentukan)?`;

                const proceed = window.confirm(message);
                if (!proceed) {
                    setIsSubmitting(false);
                    return;
                }
            }

            const payload = {
                ...formData,
                start_time: moment(start_time).utc().toISOString(),
                end_time: moment(end_time).utc().toISOString(),
            };

            await httpPost(endpointUrl("/bookings"), payload, true);
            toast.success("Pengajuan booking berhasil dikirim!");
            router.push("/manage-booking/my-bookings");

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengirim pengajuan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSiteChange = async (siteId: any) => {
        setLoadingRoomOptions(true);
        setSelectedSite(siteId);

        handleFieldChange("room_id", null);
        setRoomOptions([]);
        try {
            const roomsRes = await httpGet(endpointUrl("/rooms/options"), true, { site: siteId.value });
            const formattedRooms = roomsRes.data.data.map((room: any) => ({
                value: room.id.toString(),
                label: `${room.name} (Kapasitas: ${room.capacity} orang)`,
            }));
            setRoomOptions(formattedRooms);
        } catch (error) {
            setRoomOptions([]);
        } finally {
            setLoadingRoomOptions(false);
        }
    };

    const minDateTime = moment().format('YYYY-MM-DDTHH:mm');

    return (
        <ComponentCard title="Ajukan Booking Ruangan">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-full ">
                <div>
                    <label className="block font-medium mb-1">Cabang<span className="text-red-500 ml-1">*</span></label>
                    <Select
                        onValueChange={(value) => handleSiteChange(value)}
                        placeholder={loadingOptions ? "Memuat cabang..." : "Pilih Cabang"}
                        value={_.find(siteOptions, { value: selectedSite })}
                        options={siteOptions}
                        disabled={loadingOptions}
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Ruangan<span className="text-red-500 ml-1">*</span></label>
                    <Select
                        onValueChange={(opt) => handleFieldChange('room_id', parseInt(opt.value))}
                        placeholder={loadingRoomOptions ? "Memuat ruangan..." : "Pilih Ruangan"}
                        value={roomOptions.find(opt => opt.value === formData.room_id?.toString()) || null}

                        options={roomOptions}
                        disabled={loadingRoomOptions}
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Keperluan / Judul Kegiatan<span className="text-red-500 ml-1">*</span></label>
                    <Input
                        type="text"
                        defaultValue={formData.purpose}
                        onChange={(e) => handleFieldChange('purpose', e.target.value)}
                        placeholder="Contoh: Rapat Evaluasi Kinerja Q3"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-medium mb-1">Waktu Mulai<span className="text-red-500 ml-1">*</span></label>
                        <input
                            type="datetime-local"
                            value={formData.start_time}
                            onChange={e => handleFieldChange('start_time', e.target.value)}
                            min={minDateTime}
                            className="w-full border p-2 rounded-md dark:bg-gray-800 dark:border-gray-600"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Waktu Selesai<span className="text-red-500 ml-1">*</span></label>
                        <input
                            type="datetime-local"
                            value={formData.end_time}
                            onChange={e => handleFieldChange('end_time', e.target.value)}
                            min={formData.start_time || minDateTime}
                            className="w-full border p-2 rounded-md dark:bg-gray-800 dark:border-gray-600"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block font-medium mb-1">Fasilitas Tambahan</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
                        {loadingOptions ? <p>Memuat fasilitas...</p> : amenityOptions.map(amenity => (
                            <label key={amenity.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.amenity_ids.includes(amenity.id)}
                                    onChange={() => handleAmenityChange(amenity.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{amenity.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block font-medium mb-1">Catatan Tambahan</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        rows={4}
                        placeholder="Tuliskan permintaan atau catatan khusus di sini..."
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || loadingOptions}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check />}
                        {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}