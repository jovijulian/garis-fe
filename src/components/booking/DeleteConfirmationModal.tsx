"use client";
import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpDelete } from '../../../helpers';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    booking?: { id: number; purpose: string } | null;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onSuccess, booking }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!booking) return;
        setIsDeleting(true);
        try {
            await httpDelete(endpointUrl(`/bookings/${booking.id}`), true);
            toast.success("Booking successfully deleted!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete booking.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 bg-white rounded-lg">
                <h2 className="text-xl font-bold">Konfirmasi Hapus</h2>
                <p className="my-4">Apakah Anda yakin ingin menghapus booking untuk keperluan: "{booking?.purpose}"?</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Tidak</button>
                    <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400">
                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default DeleteConfirmationModal;