"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpGet, httpPost, httpPut } from '../../../helpers';
import moment from 'moment';
import 'moment/locale/id';
import _ from "lodash";
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Info, Loader2 } from 'lucide-react';

// --- Interface Disesuaikan ---
interface AmenityItem {
    id: number; name: string;
}

interface RoomData {
    id: number;
    name: string;
    capacity: number;
    amenities: AmenityItem[]; 
}
interface BookingData {
    id: number;
    purpose: string;
    start_time: string;
    end_time: string;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
    room: { id: number; name: string; };
    topic: { id: number; name: string; };
    notes: string | null;
}
interface BookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    bookingData?: BookingData | null; // Data untuk mode edit
}
interface SelectOption { value: string; label: string; }
interface AmenityOption { id: number; name: string; }
interface TopicOption { id: number; name: string; }

const BookingFormModal: React.FC<BookingFormModalProps> = ({ isOpen, onClose, onSuccess, bookingData }) => {
    const isEditMode = !!bookingData;
    moment.locale('id');

    const [formData, setFormData] = useState({
        room_id: null as number | null,
        topic_id: null as number | null,
        purpose: '',
        start_time: '',
        end_time: '',
        notes: '',
    });

    const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
    const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
    const [topicOptions, setTopicOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rawRooms, setRawRooms] = useState<RoomData[]>([]); 
    const [availableAmenities, setAvailableAmenities] = useState<AmenityItem[]>([]);
    useEffect(() => {
        if (isOpen) {
            // Fetch options setiap kali modal dibuka
            const fetchOptions = async () => {
                try {
                    setLoadingOptions(true);
                    const [roomsRes, amenitiesRes, topicRes] = await Promise.all([
                        httpGet(endpointUrl("/rooms/options"), true),
                        httpGet(endpointUrl("/amenities/options"), true),
                        httpGet(endpointUrl("/topics/options"), true),
                    ]);
                    const roomsData: RoomData[] = roomsRes.data.data;
                    setRawRooms(roomsData);
                    const formattedRooms = roomsRes.data.data.map((room: any) => ({
                        value: room.id.toString(),
                        label: `${room.name} (Kapasitas: ${room.capacity})`,
                    }));
                    setRoomOptions(formattedRooms);
                    setAmenityOptions(amenitiesRes.data.data || []);
                    const formattedTopics = topicRes.data.data.map((topic: any) => ({
                        value: topic.id.toString(),
                        label: `${topic.name}`,
                    }));
                    setTopicOptions(formattedTopics);
                    
                } catch (error) {
                    toast.error("Gagal memuat data ruangan / fasilitas / topik.");
                } finally {
                    setLoadingOptions(false);
                }
            };
            fetchOptions();

            // Jika ada bookingData (mode edit), isi form
            if (isEditMode && bookingData) {
                setFormData({
                    room_id: bookingData.room.id,
                    topic_id: bookingData.topic.id,
                    purpose: bookingData.purpose,
                    start_time: moment(bookingData.start_time).format('YYYY-MM-DDTHH:mm'),
                    end_time: moment(bookingData.end_time).format('YYYY-MM-DDTHH:mm'),
                    notes: bookingData.notes || '',
                });
                const currentRoom = rawRooms.find(r => r.id === bookingData.room.id);
                        if (currentRoom && currentRoom.amenities) {
                            setAvailableAmenities(currentRoom.amenities);
                        }
            } else {
                // Reset form untuk mode create
                setFormData({
                    room_id: null, topic_id: null, purpose: '', start_time: '', end_time: '', notes: '',
                });
            }
        }
    }, [isOpen, bookingData, isEditMode]);

    const handleFieldChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

   

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Konversi waktu ke UTC sebelum dikirim
        const payload = {
            ...formData,
            start_time: moment(formData.start_time).format('YYYY-MM-DD HH:mm:ss'),
            end_time: moment(formData.end_time).format('YYYY-MM-DD HH:mm:ss'),
            amenity_ids: [],
        };

        try {
            if (isEditMode && bookingData) {
                await httpPut(endpointUrl(`/bookings/user/${bookingData.id}`), payload, true);
                toast.success("Booking berhasil diperbarui!");
            } else {
                // Logika check-availability bisa ditambahkan di sini jika diperlukan untuk mode create
                await httpPost(endpointUrl('/bookings'), payload, true);
                toast.success("Booking berhasil diajukan!");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Terjadi kesalahan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoomChange = (selectedOption: any) => {
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl m-6">
            <div className="no-scrollbar relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <h2 className="text-xl font-bold mb-5">{isEditMode ? 'Ubah Booking' : 'Ajukan Booking Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-medium mb-1">Ruangan</label>
                        <Select
                           onValueChange={handleRoomChange}
                            placeholder={loadingOptions ? "Memuat..." : "Pilih Ruangan"}
                            value={_.find(roomOptions, { value: formData.room_id?.toString() })}
                            options={roomOptions}
                            disabled={loadingOptions}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Topik</label>
                        <Select
                            onValueChange={(opt) => handleFieldChange('topic_id', parseInt(opt.value))}
                            placeholder={loadingOptions ? "Memuat..." : "Pilih Topik"}
                            value={_.find(topicOptions, { value: formData.topic_id?.toString() })}
                            options={topicOptions}
                            disabled={loadingOptions}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Keperluan</label>
                        <Input
                            type="text"
                            defaultValue={formData.purpose}
                            onChange={(e) => handleFieldChange('purpose', e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-medium mb-1">Waktu Mulai</label>
                            <input
                                type="datetime-local"
                                value={formData.start_time}
                                onChange={e => handleFieldChange('start_time', e.target.value)}
                                className="w-full border p-2 rounded-md dark:bg-gray-800 dark:border-gray-600"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Waktu Selesai</label>
                            <input
                                type="datetime-local"
                                value={formData.end_time}
                                onChange={e => handleFieldChange('end_time', e.target.value)}
                                className="w-full border p-2 rounded-md dark:bg-gray-800 dark:border-gray-600"
                                required
                            />
                        </div>
                    </div>
                    <div className="animate-fade-in">
                        <label className="block font-medium mb-1">Fasilitas yang tersedia</label>
                        <div className="border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                            {!formData.room_id ? (
                                <p className="p-4 text-gray-500 italic flex items-center gap-2 text-sm">
                                    <Info className="w-4 h-4" />
                                    Pilih ruangan untuk melihat fasilitas.
                                </p>
                            ) : availableAmenities.length === 0 ? (
                                <p className="p-4 text-gray-500 italic text-sm">Tidak ada fasilitas khusus di ruangan ini.</p>
                            ) : (
                                <ul className="grid grid-cols-2 gap-3 p-4">
                                    {availableAmenities.map(amenity => (
                                        <li
                                            key={amenity.id}
                                            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-sm text-xs md:text-sm"
                                        >
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{amenity.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">Catatan</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            rows={3}
                            className="w-full border p-2 rounded-md dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Batal</button>
                        <button type="submit" disabled={isSubmitting || loadingOptions} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
                            {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
export default BookingFormModal;