"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpPatch, httpPut } from '@/../helpers';

interface ChangeStatusModalProps {
    isOpen: boolean;
    booking: {
        id: number;
        purpose: string;
        status: string;
    } | null;
    onClose: () => void;
    onSuccess: () => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ isOpen, booking, onClose, onSuccess }) => {
    console.log(booking)
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStatusChange = async (newStatus: 'Approved' | 'Rejected') => {
        if (!booking) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`bookings/status/${booking.id}`), { status: newStatus }, true);
            toast.success(`Booking has been ${newStatus.toLowerCase()}.`);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Failed to update status.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!booking) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Change Booking Status</h3>
                <p className="text-gray-600 mb-4">
                    Purpose: <span className="font-medium">{booking.purpose}</span>
                </p>
                <p className="text-gray-600 mb-6">
                    Current Status: <span className="font-medium">{booking.status}</span>
                </p>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => handleStatusChange('Rejected')}
                        disabled={isSubmitting || booking.status === 'Rejected'}
                        className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                        {isSubmitting ? '...wait' : 'Reject'}
                    </button>
                    <button
                        onClick={() => handleStatusChange('Approved')}
                        disabled={isSubmitting || booking.status === 'Approved'}
                        className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        {isSubmitting ? '...wait' : 'Approve'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChangeStatusModal;