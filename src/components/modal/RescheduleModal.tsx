"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpPut } from '@/../helpers';
import moment from 'moment';
import 'moment/locale/id'; // Import locale Indonesia

// 1. Definisikan interface props yang sesuai dengan data booking terbaru
interface BookingDataItem {
    id: number;
    purpose: string;
    start_time: string;
    end_time: string;
    status: string;
    user: { nama_user: string };
    room: { id: number, name: string };

}

interface RescheduleModalProps {
    isOpen: boolean;
    booking: BookingDataItem | null;
    onClose: () => void;
    onSuccess: () => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, booking, onClose, onSuccess }) => {
    // 2. State disesuaikan untuk menangani start & end time lengkap
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    moment.locale('id');

    useEffect(() => {
        if (booking) {
            // Format untuk input datetime-local adalah YYYY-MM-DDTHH:mm
            setNewStartTime(moment(booking.start_time).format('YYYY-MM-DDTHH:mm'));
            setNewEndTime(moment(booking.end_time).format('YYYY-MM-DDTHH:mm'));
        }
    }, [booking]);

    // Opsi 1: Atur ulang jadwal & langsung setujui
    const handleReschedule = async () => {
        if (!booking) return;

        setIsSubmitting(true);
        try {
            // 3. Payload disesuaikan dengan skema baru
            const payload = {
                room_id: booking.room.id,
                purpose: booking.purpose,
                start_time: moment(newStartTime).utc().toISOString(),
                end_time: moment(newEndTime).utc().toISOString(),
                status: 'Approved', // Langsung diapprove setelah di-reschedule

            };

            // Menggunakan endpoint PUT ke booking ID untuk update data & status
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

    // Opsi 2: Paksa setujui jadwal yang bentrok
    const handleForceApprove = async () => {
        if (!booking) return;

        setIsSubmitting(true);
        try {
            // Menggunakan endpoint khusus untuk update status
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
                    <p className="text-sm">Booking ini tumpang tindih dengan jadwal lain. Anda bisa menyetujuinya (akan menolak pengajuan lain) atau mengatur ulang jadwalnya.</p>
                </div>

                <div className="space-y-2 mb-6 border-b pb-6">
                    <p><span className="font-semibold">Keperluan:</span> {booking.purpose}</p>
                    <p><span className="font-semibold">Pemesan:</span> {booking.user.nama_user}</p>
                    <p><span className="font-semibold">Jadwal Asli:</span> {moment(booking.start_time).format("dddd, DD MMM YYYY, HH:mm")} - {moment(booking.end_time).format("HH:mm")}</p>
                </div>

                {/* --- Opsi 1 --- */}
                <div className="mb-6">
                    <h4 className="font-semibold text-lg">Opsi 1: Atur Ulang Jadwal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai Baru</label>
                            <input type="datetime-local" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="w-full border p-2 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai Baru</label>
                            <input type="datetime-local" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="w-full border p-2 rounded-md" />
                        </div>
                    </div>
                    <button onClick={handleReschedule} disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                        {isSubmitting ? 'Memproses...' : 'Atur Ulang & Setujui'}
                    </button>
                </div>

                {/* --- Opsi 2 --- */}
                <div>
                    <h4 className="font-semibold text-lg">Opsi 2: Paksa Setujui</h4>
                    <p className="text-sm text-gray-600 my-2">Aksi ini akan menyetujui booking pada jadwal aslinya dan secara otomatis menolak booking lain yang masih "Submit" pada jadwal yang sama.</p>
                    <button onClick={handleForceApprove} disabled={isSubmitting} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                         {isSubmitting ? 'Memproses...' : 'Paksa Setujui'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RescheduleModal;