"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { toast } from 'react-toastify';
import { endpointUrl, httpGet, httpPost, alertToast, httpPut } from '@/../helpers';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import _ from 'lodash';

interface SelectOption { value: string; label: string; }

interface AssignmentRow {
    vehicle_id: string | null;
    driver_id: string | null;
    note_for_driver?: string | null;
    _key?: number;
}

interface AssignmentPayloadDetail {
    request_id: number;
    vehicle_id: number;
    driver_id: number | null;
    note_for_driver?: string | null;
}

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; 
    requestId: number;
    existingAssignments: any[];
    requiresDriver: boolean;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    requestId,
    existingAssignments = [],
    requiresDriver,
}) => {
    const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
    const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
    const [driverOptions, setDriverOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchOptions = useCallback(async () => {
        setLoadingOptions(true);
        try {
            const [vehiclesRes, driversRes] = await Promise.all([
                httpGet(endpointUrl('/vehicles/options'), true), 
                httpGet(endpointUrl('/drivers/options'), true),   
            ]);

            setVehicleOptions(vehiclesRes.data.data.map((v: any) => ({
                value: v.id.toString(),
                label: `${v.name} (${v.license_plate})`
            })));
            setDriverOptions(driversRes.data.data.map((d: any) => ({
                value: d.id.toString(),
                label: d.name
            })));

        } catch (error) {
            toast.error("Gagal memuat data kendaraan/supir.");
            console.error("Option fetch error:", error);
        } finally {
            setLoadingOptions(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            const initialAssignments = existingAssignments.map((detail, index) => ({
                vehicle_id: detail.vehicle_id?.toString() || null,
                driver_id: detail.driver_id?.toString() || null,
                note_for_driver: detail.note_for_driver || '',
                _key: Date.now() + index 
            }));
            setAssignments(initialAssignments.length > 0 ? initialAssignments : [{ vehicle_id: null, driver_id: null, note_for_driver: '', _key: Date.now() }]);
            fetchOptions();
        } else {
            setAssignments([]);
            setVehicleOptions([]);
            setDriverOptions([]);
        }
    }, [isOpen, existingAssignments, fetchOptions]);

    const addAssignmentRow = () => {
        setAssignments(prev => [...prev, { vehicle_id: null, driver_id: null, note_for_driver: '', _key: Date.now() }]);
    };

    const removeAssignmentRow = (keyToRemove: number) => {
        setAssignments(prev => prev.filter(row => row._key !== keyToRemove));
    };

    const handleAssignmentChange = (keyToUpdate: number, field: keyof AssignmentRow, value: any) => {
        setAssignments(prev =>
            prev.map(row =>
                row._key === keyToUpdate ? { ...row, [field]: value } : row
            )
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        const invalidRow = assignments.find(row =>
            !row.vehicle_id || (requiresDriver && !row.driver_id)
        );

        if (invalidRow) {
            toast.error(`Harap pilih ${!invalidRow.vehicle_id ? 'kendaraan' : 'supir'} untuk semua baris penugasan.`);
            setIsSubmitting(false);
            return;
        }

        const payloadDetails: AssignmentPayloadDetail[] = assignments.map(row => ({
            request_id: requestId,
            vehicle_id: Number(row.vehicle_id),
            driver_id: row.driver_id ? Number(row.driver_id) : null,
            note_for_driver: row.note_for_driver || null,
        }));

        const payload = {
            details: payloadDetails
        };

        try {
            await httpPut(endpointUrl(`/vehicle-requests/assignment/${requestId}`), payload, true);
            toast.success("Penugasan berhasil disimpan!");
            onSuccess(); 
        } catch (error: any) {
            alertToast(error, "Gagal menyimpan penugasan");
            console.error("Assignment error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"> 
                {loadingOptions ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-500">Memuat pilihan...</span>
                    </div>
                ) : (
                    assignments.map((assignment, index) => (
                        <div key={assignment._key} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 items-end">
                            <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Kendaraan <span className="text-red-500">*</span></label>
                                <Select
                                    options={vehicleOptions}
                                    value={assignment.vehicle_id ? _.find(vehicleOptions, { value: assignment.vehicle_id }) : null}
                                    onValueChange={(opt) => handleAssignmentChange(assignment._key!, 'vehicle_id', opt ? opt.value : null)}
                                    placeholder="Pilih Kendaraan"
                                />
                            </div>

                            <div className="md:col-span-4">
                                <label className={`block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 ${!requiresDriver ? 'opacity-50' : ''}`}>
                                    Supir {requiresDriver && <span className="text-red-500">*</span>}
                                </label>
                                <Select
                                    options={driverOptions}
                                    value={assignment.driver_id ? _.find(driverOptions, { value: assignment.driver_id }) : null}
                                    onValueChange={(opt) => handleAssignmentChange(assignment._key!, 'driver_id', opt ? opt.value : null)}
                                    placeholder={requiresDriver ? "Pilih Supir" : "Supir (Opsional)"}
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Catatan u/ Supir</label>
                                <Input
                                    defaultValue={assignment.note_for_driver || ''}
                                    onChange={(e) => handleAssignmentChange(assignment._key!, 'note_for_driver', e.target.value)}
                                    placeholder="Instruksi khusus..."
                                    disabled={isSubmitting || !assignment.driver_id} // Disable if no driver selected
                                />
                            </div>

                            <div className="md:col-span-1 flex items-center justify-end">
                                {assignments.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeAssignmentRow(assignment._key!)}
                                        className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-50"
                                        title="Hapus baris"
                                        disabled={isSubmitting}
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {!loadingOptions && (
                    <button
                        type="button"
                        onClick={addAssignmentRow}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        disabled={isSubmitting || loadingOptions}
                    >
                        <FaPlus size={14} />
                        Tambah Baris Penugasan
                    </button>
                )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 text-sm"
                >
                    Batal
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || loadingOptions || assignments.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                    {isSubmitting ? "Menyimpan..." : "Simpan Semua Penugasan"}
                </button>
            </div>
        </Modal>
    );
};

export default AssignmentModal;