"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpGet, httpPut } from '@/../helpers';
import moment from 'moment';
import 'moment/locale/id';
import Select from '@/components/form/Select-custom'; // Import Select Custom
import _ from "lodash";

// Interface
interface BookingDataItem {
    id: number;
    purpose: string;
    start_time: string;
    end_time: string;
    status: string;
    user: { nama_user: string };
    room: { id: number, name: string };
}

interface SelectOption {
    value: string;
    label: string;
}

interface RescheduleModalProps {
    isOpen: boolean;
    booking: BookingDataItem | null;
    onClose: () => void;
    onSuccess: () => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, booking, onClose, onSuccess }) => {
    // State Waktu
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');

    // State Dropdown Cabang & Ruangan
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
    const [selectedSite, setSelectedSite] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<SelectOption | null>(null);

    // State Loading & Submit
    const [loadingSites, setLoadingSites] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    moment.locale('id');

    // 1. Fetch Option Cabang saat modal pertama kali diload (mirip create-booking)
    useEffect(() => {
        fetchSiteOptions();
    }, []);

    const fetchSiteOptions = async () => {
        setLoadingSites(true);
        try {
            const response = await httpGet(endpointUrl("/rooms/site-options"), true);
            const formattedSites = response.data.data.map((site: any) => ({
                value: site.id_cab,
                label: site.nama_cab,
            }));
            setSiteOptions(formattedSites);
        } catch (error) {
            console.error("Gagal memuat data cabang", error);
        } finally {
            setLoadingSites(false);
        }
    };

    // 2. Set Initial Data saat booking dipilih
    useEffect(() => {
        if (booking) {
            setNewStartTime(moment(booking.start_time).format('YYYY-MM-DDTHH:mm'));
            setNewEndTime(moment(booking.end_time).format('YYYY-MM-DDTHH:mm'));

            // Default Ruangan diset ke ruangan saat ini
            // Note: Site sengaja dikosongkan (null) karena kita tidak tau site_id dari object booking sederhana
            // Jika user ingin ganti ruangan, mereka harus pilih cabang dulu.
            setSelectedRoom({
                value: booking.room.id.toString(),
                label: booking.room.name
            });
            setSelectedSite(null);
            setRoomOptions([]);
        }
    }, [booking]);

    // 3. Handle Ganti Cabang (Sama persis logic create-booking)
    const handleSiteChange = async (option: SelectOption | null) => {
        if (!option) {
            setSelectedSite(null);
            setRoomOptions([]);
            setSelectedRoom(null);
            return;
        }

        setSelectedSite(option.value);
        setLoadingRooms(true);
        setSelectedRoom(null); // Reset room jika ganti cabang

        try {
            const roomsRes = await httpGet(endpointUrl("/rooms/options"), true, { site: option.value });
            const roomsData = roomsRes.data.data;

            const formattedRooms = roomsData.map((room: any) => ({
                value: room.id.toString(),
                label: `${room.name} (Kapasitas: ${room.capacity} orang)`,
            }));
            setRoomOptions(formattedRooms);
        } catch (error) {
            setRoomOptions([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleReschedule = async () => {
        if (!booking || !selectedRoom) {
            toast.error("Mohon pilih ruangan.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                room_id: parseInt(selectedRoom.value), // Gunakan ID dari dropdown (bisa ruangan baru atau lama)
                purpose: booking.purpose,
                start_time: moment(newStartTime).utc().toISOString(),
                end_time: moment(newEndTime).utc().toISOString(),
                status: 'Approved',
            };

            await httpPut(endpointUrl(`bookings/${booking.id}`), payload, true);
            toast.success("Booking berhasil diatur ulang dan disetujui.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengatur ulang jadwal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForceApprove = async () => {
        if (!booking) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`bookings/force-approve/${booking.id}`), "", true);
            toast.success("Booking disetujui. Booking lain yang bentrok dikembalikan ke status Submit.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menyetujui booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!booking) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-6">
            <div className="no-scrollbar relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <h3 className="text-xl font-semibold mb-4">Selesaikan Konflik Jadwal</h3>

                <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded mb-5">
                    <p className="font-bold">Jadwal Bentrok</p>
                    <p className="text-sm">Booking ini tumpang tindih dengan jadwal lain.</p>
                </div>

                <div className="space-y-2 mb-6 border-b pb-6 text-sm text-gray-700 dark:text-gray-300">
                    <p><span className="font-semibold">Keperluan:</span> {booking.purpose}</p>
                    <p><span className="font-semibold">Pemesan:</span> {booking.user.nama_user}</p>
                    <p><span className="font-semibold">Lokasi Asli:</span> {booking.room.name}</p>
                    <p><span className="font-semibold">Jadwal Asli:</span> {moment(booking.start_time).format("dddd, DD MMM YYYY, HH:mm")} - {moment(booking.end_time).format("HH:mm")}</p>
                </div>

                {/* --- Opsi 1 --- */}
                <div className="mb-6">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">Opsi 1: Atur Ulang Jadwal / Ruangan</h4>
                    <p className="text-sm text-gray-500 mb-3">Ubah waktu atau pindahkan ke ruangan lain.</p>

                    <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        {/* Dropdown Cabang & Ruangan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Pindah Cabang (Opsional)
                                </label>
                                <Select
                                    onValueChange={handleSiteChange}
                                    placeholder={loadingSites ? "Memuat..." : "Pilih Cabang"}
                                    value={_.find(siteOptions, { value: selectedSite })}
                                    options={siteOptions}
                                    isClearable
                                    disabled={loadingSites}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Ruangan
                                </label>
                                <Select
                                    onValueChange={(opt) => setSelectedRoom(opt)}
                                    placeholder={loadingRooms ? "Memuat..." : "Pilih Ruangan"}
                                    // Jika user belum pilih cabang, kita tampilkan ruangan asli booking sebagai default
                                    value={selectedRoom}
                                    options={roomOptions} // Options kosong sampai user pilih cabang
                                    isClearable={false}
                                    disabled={loadingRooms || (!selectedSite && roomOptions.length === 0)}
                                />
                            </div>
                        </div>

                        {/* Input Waktu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Waktu Mulai Baru</label>
                                <input
                                    type="datetime-local"
                                    value={newStartTime}
                                    onChange={e => setNewStartTime(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Waktu Selesai Baru</label>
                                <input
                                    type="datetime-local"
                                    value={newEndTime}
                                    onChange={e => setNewEndTime(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleReschedule}
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Memproses...' : 'Simpan Perubahan & Setujui'}
                        </button>
                    </div>
                </div>

                {/* --- Opsi 2 --- */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">Opsi 2: Paksa Setujui (Di Ruangan & Jadwal Asli)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 my-2">
                        Aksi ini akan menyetujui booking pada jadwal aslinya dan secara otomatis <b>menolak</b> booking lain yang bentrok.
                    </p>
                    <button
                        onClick={handleForceApprove}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Memproses...' : 'Paksa Setujui'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RescheduleModal;