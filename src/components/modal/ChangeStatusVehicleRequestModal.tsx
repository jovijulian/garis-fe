"use client";

import React, { useState, useEffect, useMemo } from 'react'; 
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpPut } from '@/../helpers'; 
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

interface ChangeStatusModalProps {
    isOpen: boolean;
    vehicleRequest: {
        id: number;
        status: string;
    } | null;
    actionType: 'Approved' | 'Rejected' | null;
    onClose: () => void;
    onSuccess?: () => void;
    isSubmitting: boolean;
    onConfirm: (reason?: string) => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
    isOpen,
    vehicleRequest, 
    actionType,
    onClose,
    onSuccess,
    isSubmitting,
    onConfirm,
}) => {
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRejectionReason(''); 
        }
    }, [isOpen]);

    const modalContent = useMemo(() => {
        if (actionType === 'Approved') {
            return {
                icon: <FaCheckCircle className="text-green-500 text-4xl" />,
                title: 'Setujui Pengajuan Ini?',
                message: `Apakah Anda yakin ingin menyetujui pengajuan ini?`,
                confirmText: 'Ya, Setujui',
                confirmColor: 'bg-green-600 hover:bg-green-700',
            };
        }
        if (actionType === 'Rejected') {
            return {
                icon: <FaTimesCircle className="text-red-500 text-4xl" />,
                title: 'Tolak Pengajuan Ini?',
                message: `Apakah Anda yakin ingin menolak pengajuan ini? Pengajuan yang ditolak tidak dapat diubah kembali.`,
                confirmText: 'Ya, Tolak',
                confirmColor: 'bg-red-600 hover:bg-red-700',
            };
        }
        return {
            icon: <FaExclamationTriangle className="text-yellow-500 text-4xl" />,
            title: 'Aksi Tidak Valid',
            message: 'Silakan tutup dan coba lagi.',
            confirmText: 'Konfirmasi',
            confirmColor: 'bg-gray-600',
        };
    }, [actionType]);

    const handleConfirm = () => {
        if (actionType === 'Rejected' && !rejectionReason.trim()) {
            toast.warn('Mohon isi alasan penolakan.');
            return; 
        }
        onConfirm(actionType === 'Rejected' ? rejectionReason : undefined);
    };

    if (!vehicleRequest || !actionType) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <div className="flex justify-center mb-4">
                    {modalContent.icon}
                </div>

                <h3 className="text-xl font-semibold mb-2 text-center">{modalContent.title}</h3>

                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                    {modalContent.message}
                </p>

                {/* 3. Tambahkan input alasan secara kondisional */}
                {actionType === 'Rejected' && (
                    <div className="mb-4">
                        <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Alasan Penolakan <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="rejectionReason"
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Tuliskan alasan penolakan di sini..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            disabled={isSubmitting}
                        />
                    </div>
                )}

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md border text-sm font-medium transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded-md text-white text-sm font-medium disabled:opacity-50 transition-all ${modalContent.confirmColor}`}
                    >
                        {isSubmitting ? 'Memproses...' : modalContent.confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChangeStatusModal;