"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import 'moment/locale/id';
import _ from "lodash";

import { endpointUrl, httpGet, httpPost } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Info, Loader2 } from 'lucide-react';
import ConflictConfirmationModal from '@/components/modal/ConflictConfirmationModal';

interface BookingFormData {
    room_id: number | null;
    topic_id: number | null;
    detail_topic: string;
    purpose: string;
    start_time: string;
    end_time: string;
    notes: string;
    cab_id: number | null;
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

interface RoomData {
    id: number;
    name: string;
    capacity: number;
    amenities: AmenityOption[];
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
        cab_id: null,
    });
    const [rawRooms, setRawRooms] = useState<RoomData[]>([]);
    const [availableAmenities, setAvailableAmenities] = useState<AmenityOption[]>([]);
    const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingRoomOptions, setLoadingRoomOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSite, setSelectedSite] = useState<string | null>(null);
    const [isConflictModalOpen, setConflictModalOpen] = useState(false);
    const [conflictDetails, setConflictDetails] = useState(null);
    const [wantsToOrderConsumption, setWantsToOrderConsumption] = useState(false);
    const searchParams = useSearchParams();
    useEffect(() => {
        const roomIdParams = searchParams.get("room_id");
        const cabIdParams = searchParams.get("cab_id");
        const startTimeParam = searchParams.get("start_time");

        const updates: Partial<BookingFormData> = {};

        if (startTimeParam) {
            const startMoment = moment(startTimeParam); 
            if (startMoment.isValid()) {
                updates.start_time = startMoment.format('YYYY-MM-DDTHH:mm');
            }
        }

        let currentCabId = null;
        let currentRoomId = null;

        if (cabIdParams) {
            currentCabId = parseInt(cabIdParams, 10);
            updates.cab_id = currentCabId;

            setSelectedSite(cabIdParams);
        }

        if (roomIdParams) {
            currentRoomId = parseInt(roomIdParams, 10);
            updates.room_id = currentRoomId;
        }

        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }

        fetchOptions(); 

        if (currentCabId) {
            fetchRooms(currentCabId.toString(), currentRoomId);
        }

    }, [searchParams]);

    const fetchOptions = async () => {
        try {
            const [siteRes, topicRes] = await Promise.all([
                httpGet(endpointUrl("/rooms/site-options"), true),
                httpGet(endpointUrl("/topics/options"), true),
            ]);

            const formattedSite = siteRes.data.data.map((site: any) => ({
                value: site.id_cab,
                label: `${site.nama_cab}`,
            }));

            setSiteOptions(formattedSite);
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

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                start_time: moment(formData.start_time).format('YYYY-MM-DD HH:mm:ss'),
                end_time: moment(formData.end_time).format('YYYY-MM-DD HH:mm:ss'),
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
                start_time: moment(start_time),
                end_time: moment(end_time),
            });

            if (!availabilityRes.data.data.is_available) {
                setConflictDetails(availabilityRes.data.data.conflictingBookings);
                setConflictModalOpen(true);
                setIsSubmitting(false);
                return;
            }

            await handleConfirmSubmit();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memeriksa ketersediaan.");
            setIsSubmitting(false);
        }
    };

    const fetchRooms = async (siteIdValue: string, preselectedRoomId: number | null = null) => {
        setLoadingRoomOptions(true);
        setRoomOptions([]);

        try {
            const roomsRes = await httpGet(endpointUrl("/rooms/options"), true, { site: siteIdValue });
            const roomsData: RoomData[] = roomsRes.data.data;
            setRawRooms(roomsData);

            const formattedRooms = roomsData.map((room: any) => ({
                value: room.id.toString(),
                label: `${room.name} (Kapasitas: ${room.capacity} orang)`,
            }));
            setRoomOptions(formattedRooms);
            if (preselectedRoomId) {
                const selectedRoom = roomsData.find(r => r.id === preselectedRoomId);
                if (selectedRoom && selectedRoom.amenities) {
                    setAvailableAmenities(selectedRoom.amenities);
                }
            }

        } catch (error) {
            console.error(error);
            setRoomOptions([]);
        } finally {
            setLoadingRoomOptions(false);
        }
    };

    const handleSiteChange = (selectedOption: SelectOption | null) => {
        if (selectedOption) {
            setSelectedSite(selectedOption.value);
            handleFieldChange("cab_id", parseInt(selectedOption.value));
            handleFieldChange("room_id", null);
            setAvailableAmenities([]);

            fetchRooms(selectedOption.value);
        } else {
            setSelectedSite(null);
            handleFieldChange("cab_id", null);
            handleFieldChange("room_id", null);
            setRoomOptions([]);
            setAvailableAmenities([]);
        }
    };

    const handleRoomChange = (selectedOption: SelectOption | null) => {
        if (selectedOption) {
            const roomId = parseInt(selectedOption.value);
            handleFieldChange('room_id', roomId);
            const selectedRoom = rawRooms.find(r => r.id === roomId);

            if (selectedRoom && selectedRoom.amenities) {
                setAvailableAmenities(selectedRoom.amenities);
            } else {
                setAvailableAmenities([]);
            }
        } else {
            handleFieldChange('room_id', null);
            setAvailableAmenities([]);
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
                        value={siteOptions.find(opt => opt.value == selectedSite)}
                        options={siteOptions}
                        isClearable
                        disabled={loadingOptions}
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Ruangan<span className="text-red-500 ml-1">*</span></label>
                    <Select
                        onValueChange={handleRoomChange}
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
                            min={formData.start_time}
                            className="w-full border p-2 rounded-md dark:bg-gray-800 dark:border-gray-600"
                            required
                        />
                    </div>
                </div>
                <div className="animate-fade-in">
                    <label className="block font-medium mb-1">Fasilitas Ruangan Ini</label>
                    <div className="border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        {!formData.room_id ? (
                            <p className="p-4 text-gray-500 italic flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Silakan pilih ruangan untuk melihat fasilitas tersedia.
                            </p>
                        ) : availableAmenities.length === 0 ? (
                            <p className="p-4 text-gray-500 italic">Tidak ada fasilitas khusus terdaftar di ruangan ini.</p>
                        ) : (
                            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
                                {availableAmenities.map(amenity => (
                                    <li
                                        key={amenity.id}
                                        className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-sm text-sm"
                                    >
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>{amenity.name}</span>
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