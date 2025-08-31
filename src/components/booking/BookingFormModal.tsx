"use client";
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpGet, httpPost, httpPut } from '../../../helpers';
import moment from 'moment';
import SingleDatePicker from '@/components/calendar/SingleDatePicker';
import TimePicker from '@/components/calendar/TimePicker';

interface RoomInfo {
    id: number;
    name: string;
}
interface Booking {
    id: number;
    purpose: string;
    booking_date: string;
    start_time: string;
    duration_minutes: number;
    status: 'Submit' | 'Approved' | 'Rejected';
    room: RoomInfo;
}

interface BookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    bookingData?: Booking | null;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({ isOpen, onClose, onSuccess, bookingData }) => {
    const isEditMode = !!bookingData;

    const [roomId, setRoomId] = useState('');
    const [purpose, setPurpose] = useState('');
    const [bookingDate, setBookingDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('60');
    const [viewingMonth, setViewingMonth] = useState(new Date());
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEditMode && bookingData) {
            setRoomId(String(bookingData.room.id));
            setPurpose(bookingData.purpose);
            setBookingDate(new Date(bookingData.booking_date));
            setStartTime(moment(bookingData.start_time, 'HH:mm:ss').format('HH:mm'));
            setDurationMinutes(String(bookingData.duration_minutes));
        }
    }, [bookingData, isEditMode]);

    useEffect(() => {
        if (isOpen) {
            const fetchRooms = async () => {
                try {
                    const response = await httpGet(endpointUrl('/rooms/options'), true);
                    setRooms(response.data.data || []);
                } catch (error) {
                    toast.error("Gagal memuat daftar ruangan.");
                }
            };
            fetchRooms();
        }
    }, [isOpen]);


    const resetForm = () => {
        setRoomId('');
        setPurpose('');
        setBookingDate(null);
        setStartTime('');
        setDurationMinutes('60');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = {
            roomId: Number(roomId),
            purpose,
            bookingDate: moment(bookingDate).format('YYYY-MM-DD'),
            startTime,
            durationMinutes: Number(durationMinutes)
        };

        try {
            if (isEditMode) {
                await httpPut(endpointUrl(`/bookings/${bookingData.id}`), payload, true);
                toast.success("Booking successfully updated!");
            } else {
                await httpPost(endpointUrl('/bookings'), payload, true);
                toast.success("Booking successfully made!");
            }
            onSuccess();
            handleClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "There is an error.");
            setError(error?.response?.data?.message || "There is an error.")
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-6">
            <div className="no-scrollbar relative w-full max-w-[500px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <h2 className="text-xl font-bold">{isEditMode ? 'Edit Booking' : 'Create New Booking'}</h2>

                    <div>
                        <label>Room</label>
                        <select value={roomId} onChange={e => setRoomId(e.target.value)} required className="w-full border p-2 rounded">
                            <option value="" disabled>Choose Room</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Purpose</label>
                        <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} required className="w-full border p-2 rounded" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label>Date</label>
                            <SingleDatePicker
                                selectedDate={
                                    bookingDate
                                }
                                onChange={(date) => {
                                    if (date) {
                                        setBookingDate(date);
                                    }
                                }}
                                onMonthChange={setViewingMonth}
                                viewingMonthDate={viewingMonth}
                                onClearFilter={() => {
                                    setBookingDate(null);
                                }}
                                placeholderText="Pilih tanggal"
                            />
                        </div>
                        <div>
                            <TimePicker
                                label="Waktu Mulai"
                                value={startTime}
                                onChange={setStartTime}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label>Duration (minutes)</label>
                        <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} required min="15" step="15" className="w-full border p-2 rounded" />
                    </div>
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">
                            {isSubmitting ? 'Saving...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
export default BookingFormModal;