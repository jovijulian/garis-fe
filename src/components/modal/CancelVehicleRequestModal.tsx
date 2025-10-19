"use client";

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

interface VehicleRequestData {
    id: number;
}

interface CancelVehicleRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    vehicleRequest: VehicleRequestData | null;
    isSubmitting: boolean;
}

const CancelVehicleRequestModal: React.FC<CancelVehicleRequestModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    vehicleRequest,
    isSubmitting
}) => {
    if (!vehicleRequest) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full">
                        <FaExclamationTriangle className="text-red-500 text-3xl" />
                    </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">Anda Yakin Ingin Membatalkan?</h3>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Pengajuan ini akan dibatalkan. Pengguna akan menerima notifikasi.
                    <br />
                    <span className="font-semibold">Aksi ini tidak dapat diurungkan.</span>
                </p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md border text-sm font-medium transition-all"
                    >
                        Tidak
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-md text-white text-sm font-medium disabled:opacity-50 transition-all bg-red-600 hover:bg-red-700 flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        {isSubmitting ? 'Memproses...' : 'Ya, Batalkan Pengajuan'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CancelVehicleRequestModal;