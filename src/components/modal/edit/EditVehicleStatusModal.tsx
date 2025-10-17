"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { httpPut, endpointUrl, alertToast } from "@/../helpers";
import { toast } from "react-toastify";

// Sesuaikan interface ini dengan data yang Anda kirimkan
interface VehicleData {
    id: number;
    name: string;
    license_plate: string;
    status: string;
}

interface EditStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vehicleData: VehicleData;
}

const EditVehicleStatusModal: React.FC<EditStatusModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    vehicleData,
}) => {
    const [newStatus, setNewStatus] = useState(vehicleData.status);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Pastikan status di-reset setiap kali modal dibuka dengan data baru
    useEffect(() => {
        if (vehicleData) {
            setNewStatus(vehicleData.status);
        }
    }, [vehicleData]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await httpPut(
                endpointUrl(`vehicles/${vehicleData.id}/status`), 
                { status: newStatus }, 
                true
            );
            
            toast.success("Status kendaraan berhasil diperbarui!");
            onSuccess();
        } catch (error: any) {
            alertToast(error, "Gagal memperbarui status");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="p-4 space-y-4">
                <p>
                    Ubah status untuk kendaraan: <br />
                    <strong className="font-semibold">{vehicleData.name} ({vehicleData.license_plate})</strong>
                </p>
                
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status Kendaraan
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="Available">Available</option>
                        <option value="Not Available">Not Available</option>
                        <option value="In Repair">In Repair</option>
                    </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || newStatus === vehicleData.status}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? "Menyimpan..." : "Simpan Status"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditVehicleStatusModal;