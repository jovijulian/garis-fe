"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { toast } from 'react-toastify';
import { endpointUrl, httpGet, httpPut, alertToast } from '@/../helpers';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import _ from 'lodash';

interface SelectOption { value: string; label: string; }
interface AssignmentRow {
    vehicle_id: string | null;
    driver_id: string | null;
    note_for_driver?: string | null;
    _key: number;
}

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    requestId: number;
    existingAssignments: any[];
    requiresDriver: boolean;
    adminCabId: number | null;
    startTime?: string | null;
    endTime?: string | null;
    onlyDriver?: boolean;
    deptId?: number | null;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    requestId,
    existingAssignments = [],
    requiresDriver,
    adminCabId,
    startTime,
    endTime,
    onlyDriver,
    deptId,
}) => {
    const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
    const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
    const [driverOptions, setDriverOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterByBranch, setFilterByBranch] = useState<boolean>(true);
    const fetchOptions = useCallback(async () => {
        setLoadingOptions(true);

        const params: any = {};
        if (filterByBranch && adminCabId) {
            params.cab_id = adminCabId;
        }
        if (deptId) {
            params.id_dept = deptId;
        }
        params.start_time = startTime || null;
        params.end_time = endTime || null;
       

        try {
            const vehiclesRes = await httpGet(endpointUrl("/vehicles/options"), true, params);
            let fetchedVehicleOptions = vehiclesRes.data?.data?.map((v: any) => ({
                value: v.id.toString(),
                label: `${v.name} (${v.license_plate})`,
            })) || [];

            if (existingAssignments.length > 0) {
                existingAssignments.forEach(assign => {
                    if (assign.vehicle) {
                        const existingOpt = {
                            value: assign.vehicle.id.toString(),
                            label: `${assign.vehicle.name} (${assign.vehicle.license_plate})`
                        };
                        if (!fetchedVehicleOptions.some((opt: any) => opt.value === existingOpt.value)) {
                            fetchedVehicleOptions.push(existingOpt);
                        }
                    }
                });
            }
            fetchedVehicleOptions = _.sortBy(fetchedVehicleOptions, 'label');
            setVehicleOptions(fetchedVehicleOptions);

            const driversRes = await httpGet(endpointUrl("/drivers/options"), true, params);
            let fetchedDriverOptions = driversRes.data?.data?.map((d: any) => ({
                value: d.id.toString(),
                label: d.name,
            })) || [];

            if (existingAssignments.length > 0) {
                existingAssignments.forEach(assign => {
                    if (assign.driver) {
                        const existingOpt = {
                            value: assign.driver.id.toString(),
                            label: assign.driver.name
                        };
                        if (!fetchedDriverOptions.some((opt: any) => opt.value === existingOpt.value)) {
                            fetchedDriverOptions.push(existingOpt);
                        }
                    }
                });
            }
            fetchedDriverOptions = _.sortBy(fetchedDriverOptions, 'label');
            setDriverOptions(fetchedDriverOptions);

        } catch (err) {
            console.warn("Fetch options error:", err);
            toast.warning("Gagal memuat data opsi kendaraan/driver.");
        } finally {
            setLoadingOptions(false);
        }
    }, [filterByBranch, adminCabId, startTime, endTime, existingAssignments]);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            if (existingAssignments.length > 0) {
                const mappedData = existingAssignments.map((detail, index) => ({
                    vehicle_id: detail.vehicle_id?.toString() || null,
                    driver_id: detail.driver_id?.toString() || null,
                    note_for_driver: detail.note_for_driver || '',
                    _key: Date.now() + index
                }));
                setAssignments(mappedData);
            } else {
                setAssignments([{ vehicle_id: null, driver_id: null, note_for_driver: '', _key: Date.now() }]);
            }
        } else {
            setAssignments([]);
        }
    }, [isOpen, existingAssignments, fetchOptions]);

    const addAssignmentRow = () => {
        setAssignments(prev => [
            ...prev,
            { vehicle_id: null, driver_id: null, note_for_driver: '', _key: Date.now() + Math.random() }
        ]);
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
        // const invalidRow = assignments.find(row =>
        //     !row.vehicle_id || !row.driver_id
        // );
        // console.log("Invalid Row:", invalidRow);

        // if (invalidRow) {
        //     toast.error(`Harap lengkapi data ${!invalidRow.vehicle_id ? 'kendaraan' : 'supir'} pada baris yang tersedia.`);
        //     setIsSubmitting(false);
        //     return;
        // }

        const payloadDetails = assignments.map(row => ({
            request_id: requestId,
            vehicle_id: row.vehicle_id ? Number(row.vehicle_id) : null,
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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-lg font-bold text-gray-800">Kelola Penugasan</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>

                <div className="flex items-center mb-6">
                    <label className="inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={filterByBranch}
                            onChange={(e) => setFilterByBranch(e.target.checked)}
                            disabled={loadingOptions || isSubmitting || !adminCabId}
                            className="form-checkbox h-4 w-4 text-blue-600 rounded cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                            Filter aset berdasarkan cabang saya
                        </span>
                    </label>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mb-4">
                    {loadingOptions ? (
                        <div className="flex flex-col justify-center items-center py-10 space-y-2">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="text-gray-500 text-sm">Mencari kendaraan & supir yang tersedia...</span>
                        </div>
                    ) : (
                        <>
                            {assignments.map((assignment, index) => (
                                <div key={assignment._key} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg bg-gray-50 relative group">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            Kendaraan
                                        </label>
                                        <Select
                                            options={vehicleOptions}
                                            value={assignment.vehicle_id ? (_.find(vehicleOptions, { value: assignment.vehicle_id }) || null) : null}
                                            onValueChange={(opt) => handleAssignmentChange(assignment._key, 'vehicle_id', opt ? opt.value : null)}
                                            placeholder="Pilih Kendaraan..."
                                            disabled={onlyDriver}
                                        />
                                    </div>

                                    <div className="md:col-span-4">
                                        <label className={`block text-xs font-semibold text-gray-600 mb-1 ${!requiresDriver ? 'opacity-70' : ''}`}>
                                            Supir
                                        </label>
                                        <Select
                                            options={driverOptions}
                                            value={assignment.driver_id ? (_.find(driverOptions, { value: assignment.driver_id }) || null) : null}
                                            onValueChange={(opt) => handleAssignmentChange(assignment._key, 'driver_id', opt ? opt.value : null)}
                                            placeholder={requiresDriver ? "Pilih Supir..." : "Tanpa Supir (Opsional)"}
                                            isClearable={!requiresDriver}
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan</label>
                                        <Input
                                            defaultValue={assignment.note_for_driver || ''}
                                            onChange={(e) => handleAssignmentChange(assignment._key, 'note_for_driver', e.target.value)}
                                            placeholder="Info penjemputan dll..."
                                            className="text-sm"
                                        />
                                    </div>

                                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                                        <button
                                            type="button"
                                            onClick={() => removeAssignmentRow(assignment._key)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Hapus baris ini"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>

                                    <div className="absolute top-2 right-2 text-xs text-gray-300 font-bold select-none">#{index + 1}</div>
                                </div>
                            ))}

                            {assignments.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50 text-gray-400">
                                    Belum ada aset yang ditugaskan.
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={addAssignmentRow}
                                className="w-full py-3 border-2 border-dashed border-blue-200 rounded-lg text-blue-600 font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-2"
                            >
                                <FaPlus size={14} /> Tambah Kendaraan / Supir Lain
                            </button>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || loadingOptions || assignments.length === 0}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
                    >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignmentModal;