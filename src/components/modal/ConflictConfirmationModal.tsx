"use client";

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

interface ConflictInfo {
    booked_by: string;
    purpose: string;
}

interface ConflictConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    conflictInfo: ConflictInfo | null;
    isSubmitting: boolean;
}

const ConflictConfirmationModal: React.FC<ConflictConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    conflictInfo,
    isSubmitting
}) => {
    if (!conflictInfo) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full">
                        <FaExclamationTriangle className="text-red-500 text-3xl" />
                    </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-red-600">Jadwal Bentrok!</h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Jadwal yang Anda pilih sudah dipesan oleh <strong>{conflictInfo.booked_by}</strong> untuk keperluan "<strong>{conflictInfo.purpose}</strong>".
                    <br/><br/>
                    Apakah Anda tetap ingin mengajukan booking ini?
                </p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md border text-sm font-medium transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md text-white text-sm font-medium disabled:opacity-50 transition-all bg-red-600 hover:bg-red-700 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        {isSubmitting ? 'Memproses...' : 'Ya, Tetap Ajukan'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConflictConfirmationModal;