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
import ConflictConfirmationModal from '@/components/modal/ConflictConfirmationModal';

// Interface untuk data form
interface BookingFormData {
    room_id: number | null;
    topic_id: number | null;
    detail_topic: string;
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

interface TopicOption {
    id: number;
    name: string;
}


export default function CreateBookingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<BookingFormData>({
        room_id: null,
        topic_id: null,
        detail_topic: '',
        purpose: '',
        start_time: '',
        end_time: '',
        notes: '',
        amenity_ids: [],
    });

    const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
    const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingRoomOptions, setLoadingRoomOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSite, setSelectedSite] = useState<string | null>(null);
    const [isConflictModalOpen, setConflictModalOpen] = useState(false);
    const [conflictDetails, setConflictDetails] = useState(null);
    const [wantsToOrderConsumption, setWantsToOrderConsumption] = useState(false);
    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const [siteRes, amenitiesRes, topicRes] = await Promise.all([
                httpGet(endpointUrl("/rooms/site-options"), true),
                httpGet(endpointUrl("/amenities/options"), true),
                httpGet(endpointUrl("/topics/options"), true),
            ]);

            const formattedSite = siteRes.data.data.map((site: any) => ({
                value: site.id_cab,
                label: `${site.nama_cab}`,
            }));

            setSiteOptions(formattedSite);
            setAmenityOptions(amenitiesRes.data.data || []);
            setTopicOptions(topicRes.data.data || []);
        } catch (error) {
            console.log(error)
            toast.error("Gagal memuat data cabang / fasilitas / topik.");
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

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                start_time: moment(formData.start_time).utc().toISOString(),
                end_time: moment(formData.end_time).utc().toISOString(),
            };

            const response = await httpPost(endpointUrl("/bookings"), payload, true);
            const newBooking = response.data.data;
            toast.success("Pengajuan booking berhasil dikirim!");
            setConflictModalOpen(false);
            if (wantsToOrderConsumption) {
                router.push(`/orders/create?bookingId=${newBooking.id}`);
            } else {
                router.push("/manage-booking/my-bookings");
            }

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengirim pengajuan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fungsi ini dipanggil saat form di-submit pertama kali
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
                // Jika bentrok, simpan detailnya dan BUKA MODAL
                setConflictDetails(availabilityRes.data.data.conflictingBookings);
                setConflictModalOpen(true);
                setIsSubmitting(false); // Berhenti loading karena menunggu input user
                return; // Hentikan proses submit utama
            }

            // Jika tidak bentrok, langsung kirim
            await handleConfirmSubmit();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memeriksa ketersediaan.");
            setIsSubmitting(false);
        }
        // finally tidak perlu di sini karena sudah dihandle di handleConfirmSubmit
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
                        isClearable
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
                        isClearable
                        disabled={loadingRoomOptions}
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Topik Kegiatan<span className="text-red-500 ml-1">*</span></label>
                    <Select
                        onValueChange={(selectedOption) => {
                            if (selectedOption) {
                                handleFieldChange('topic_id', parseInt(selectedOption.value));

                                if (selectedOption.label.toLowerCase() !== 'lain-lainnya') {
                                    handleFieldChange('detail_topic', '');
                                }
                            } else {
                                handleFieldChange('topic_id', null);
                                handleFieldChange('detail_topic', '');
                            }
                        }}
                        placeholder={loadingOptions ? "Memuat topik..." : "Pilih Topik"}
                        value={topicOptions.find(opt => opt.id === formData.topic_id) ? {
                            value: formData.topic_id!.toString(),
                            label: topicOptions.find(opt => opt.id === formData.topic_id)!.name
                        } : null}
                        options={topicOptions.map(topic => ({
                            value: topic.id.toString(),
                            label: topic.name
                        }))}
                        isClearable
                        disabled={loadingOptions}
                    />
                </div>
                {topicOptions.find(opt => opt.id === formData.topic_id)?.name.toLowerCase() === 'lain-lainnya' && (
                    <div className="animate-fade-in">
                        <label className="block font-medium mb-1">
                            Detail Topik (Lain-lainnya)
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Input
                            type="text"
                            defaultValue={formData.detail_topic}
                            onChange={(e) => handleFieldChange('detail_topic', e.target.value)}
                            placeholder="Sebutkan topik spesifik kegiatan Anda"
                            required
                        />
                    </div>
                )}
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
                            // min={minDateTime}
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
                            // min={formData.start_time || minDateTime}
                            className="w-full border p-2 rounded-md dark:bg-gray-800 dark:border-gray-600"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block font-medium mb-1">Fasilitas yang tersedia</label>

                    <div className="border rounded-md">
                        {loadingOptions ? (
                            <p className="p-4 text-gray-500">Memuat fasilitas...</p>
                        ) : (
                            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                                {amenityOptions.map(amenity => (
                                    <li
                                        key={amenity.id}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                                    >
                                        <span className="text-sm">{amenity.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block font-medium mb-1">Catatan Tambahan</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        rows={4}
                        placeholder="Tuliskan permintaan fasilitas atau catatan khusus di sini..."
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={wantsToOrderConsumption}
                            onChange={(e) => setWantsToOrderConsumption(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                            <span className="font-semibold text-gray-800">Pesan Konsumsi (Makanan/Snack)</span>
                            <p className="text-sm text-gray-500">
                                Setelah ini, Anda akan diarahkan ke form pemesanan konsumsi.
                            </p>
                        </div>
                    </label>
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
            <ConflictConfirmationModal
                isOpen={isConflictModalOpen}
                onClose={() => setConflictModalOpen(false)}
                onConfirm={handleConfirmSubmit}
                conflictInfo={conflictDetails}
                isSubmitting={isSubmitting}
            />
        </ComponentCard>

    );
}