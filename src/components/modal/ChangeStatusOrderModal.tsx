"use client";

import React, { useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';
import { endpointUrl, httpPut } from '@/../helpers';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

interface ChangeStatusModalProps {
    isOpen: boolean;
    order: {
        id: number;
        status: string;
    } | null;
    actionType: 'Approved' | 'Rejected' | null;
    onClose: () => void;
    onSuccess?: () => void;
    isSubmitting: boolean; 
    onConfirm: () => void; 
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ 
    isOpen, 
    order, 
    actionType, 
    onClose, 
    onSuccess,
    isSubmitting, 
    onConfirm,    
}) => {

    const modalContent = useMemo(() => {
        if (actionType === 'Approved') {
            return {
                icon: <FaCheckCircle className="text-green-500 text-4xl" />,
                title: 'Setujui Order Ini?',
                message: `Apakah Anda yakin ingin menyetujui order ini?`,
                confirmText: 'Ya, Setujui',
                confirmColor: 'bg-green-600 hover:bg-green-700',
            };
        }
        if (actionType === 'Rejected') {
            return {
                icon: <FaTimesCircle className="text-red-500 text-4xl" />,
                title: 'Tolak Order Ini?',
                message: `Apakah Anda yakin ingin menolak order ini? Order yang ditolak tidak dapat diubah kembali.`,
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
        onConfirm();
    };

    if (!order || !actionType) return null;

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