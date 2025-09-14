"use client";

import React, { useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpPut } from '@/../helpers';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

// 1. Props disesuaikan untuk menerima 'actionType'
interface ChangeStatusModalProps {
    isOpen: boolean;
    booking: {
        id: number;
        purpose: string;
        status: string;
    } | null;
    actionType: 'Approved' | 'Rejected' | null; // Aksi yang akan dikonfirmasi
    onClose: () => void;
    onSuccess?: () => void;
    isSubmitting: boolean; // Menerima status loading dari parent
    onConfirm: () => void; // Menerima fungsi konfirmasi dari parent
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ 
    isOpen, 
    booking, 
    actionType, 
    onClose, 
    onSuccess,
    isSubmitting, // Diganti dengan props
    onConfirm,    // Diganti dengan props
}) => {

    // 2. Konten modal dibuat dinamis berdasarkan actionType
    const modalContent = useMemo(() => {
        if (actionType === 'Approved') {
            return {
                icon: <FaCheckCircle className="text-green-500 text-4xl" />,
                title: 'Setujui Booking Ini?',
                message: `Apakah Anda yakin ingin menyetujui booking untuk keperluan "${booking?.purpose}"?`,
                confirmText: 'Ya, Setujui',
                confirmColor: 'bg-green-600 hover:bg-green-700',
            };
        }
        if (actionType === 'Rejected') {
            return {
                icon: <FaTimesCircle className="text-red-500 text-4xl" />,
                title: 'Tolak Booking Ini?',
                message: `Apakah Anda yakin ingin menolak booking untuk keperluan "${booking?.purpose}"? Booking yang ditolak tidak dapat diubah kembali.`,
                confirmText: 'Ya, Tolak',
                confirmColor: 'bg-red-600 hover:bg-red-700',
            };
        }
        // Fallback jika actionType null
        return {
            icon: <FaExclamationTriangle className="text-yellow-500 text-4xl" />,
            title: 'Aksi Tidak Valid',
            message: 'Silakan tutup dan coba lagi.',
            confirmText: 'Konfirmasi',
            confirmColor: 'bg-gray-600',
        };
    }, [actionType, booking?.purpose]);

    // Handler dipindahkan ke halaman detail, modal ini hanya memanggilnya
    const handleConfirm = () => {
        onConfirm();
    };

    if (!booking || !actionType) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    {modalContent.icon}
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{modalContent.title}</h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {modalContent.message}
                </p>

                {/* 3. Tombol disederhanakan menjadi Batal dan Konfirmasi */}
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