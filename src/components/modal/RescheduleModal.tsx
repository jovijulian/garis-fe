"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpPatch, httpPut } from '@/../helpers';
import moment from 'moment';
import TimePicker from '@/components/calendar/TimePicker';

const RescheduleModal = ({ isOpen, booking, onClose, onSuccess }: any) => {
    const [newDate, setNewDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (booking) {
            setNewDate(moment(booking.booking_date).format('YYYY-MM-DD'));
            setNewStartTime(moment(booking.start_time, 'HH:mm:ss').format('HH:mm'));
        }
    }, [booking]);

    const handleReschedule = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                roomId: booking.room_id,
                bookingDate: newDate,
                startTime: newStartTime,
                purpose: booking.purpose,
                durationMinutes: Number(booking.duration_minutes),
                status: 'Approved'
            };
            await httpPut(endpointUrl(`bookings/${booking.id}`), payload, true);
            toast.success("Booking was successfully rescheduled and approved.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to reschedule booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForceApprove = async () => {
        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`bookings/status/${booking.id}`), { status: 'Approved' }, true);
            toast.success("Booking approved. Any conflicting pending bookings were rejected.");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to approve booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!booking) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-6">
            <div className="no-scrollbar relative w-full max-w-[700px] rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <h3 className="text-xl font-semibold">Resolve Schedule Conflict</h3>
                <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded">
                    <p className="font-bold">Schedule Conflict</p>
                    <p>This booking overlaps with another schedule. You can approve it (which will reject others) or reschedule it.</p>
                </div>

                <div className="space-y-2">
                    <p><span className="font-semibold">Purpose:</span> {booking.purpose}</p>
                    <p><span className="font-semibold">Original Schedule:</span> {moment(booking.booking_date).format("DD MMM YYYY")}, {moment(booking.start_time, "HH:mm:ss").format("HH:mm")}</p>
                </div>

                <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold">Option 1: Reschedule</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label>New Date</label>
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full border p-2 rounded" />
                        </div>
                        <TimePicker label="New Start Time" value={newStartTime} onChange={setNewStartTime} />
                    </div>
                    <button onClick={handleReschedule} disabled={isSubmitting} className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                        Reschedule & Approve
                    </button>
                </div>

                <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold">Option 2: Force Approve</h4>
                    <p className="text-sm text-gray-600">This will approve the booking and automatically reject other conflicting bookings with a 'Submit' status.</p>
                    <button onClick={handleForceApprove} disabled={isSubmitting} className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
                        Force Approve
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RescheduleModal;