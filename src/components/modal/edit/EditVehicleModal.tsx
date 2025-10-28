"use client";

import React, { useEffect, useState } from "react";
import _ from "lodash";
import { toast } from "react-toastify";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";

import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface Payload {
    name: string;
    vehicle_type_id: number;
    license_plate: string;
    passenger_capacity: number;
    cab_id: number;
    is_operational: number;
}

interface SelectOption {
    value: string;
    label: string;
}

interface EditProps {
    isOpen: boolean;
    selectedId: number | null;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditVehicleModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<Payload>({
        name: "",
        cab_id: 0,
        license_plate: "",
        passenger_capacity: 0,
        vehicle_type_id: 0,
        is_operational: 1,
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState<SelectOption[]>([]);
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingVehicleType, setLoadingVehicleType] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleFieldChange = (field: keyof Payload, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        const fetchSites = async () => {
            setLoadingSites(true);
            try {
                const response = await httpGet(endpointUrl("/rooms/site-options"), true);
                const formattedOptions = response.data.data.map((site: any) => ({
                    value: site.id_cab.toString(),
                    label: site.nama_cab,
                }));
                setSiteOptions(formattedOptions);
            } catch (error) {
                toast.error("Gagal memuat data lokasi.");
            } finally {
                setLoadingSites(false);
            }
        };

        const fetchVehicleTypes = async () => {
            try {
                const response = await httpGet(endpointUrl("/vehicle-types/options"), true);
                const formattedOptions = response.data.data.map((type: any) => ({
                    value: type.id.toString(),
                    label: type.name,
                }));
                setVehicleTypeOptions(formattedOptions);
            } catch (error) {
                toast.error("Failed to load vehicle type data.");
            } finally {
                setLoadingVehicleType(false);
            }
        }

        const fetchDetail = async () => {
            if (!selectedId) return;
            setIsLoading(true);
            try {
                const response = await httpGet(endpointUrl(`vehicles/${selectedId}`), true);
                const data = response.data.data;
                setFormData({
                    name: data.name || "",
                    cab_id: data.cab_id || 0,
                    license_plate: data.license_plate || "",
                    passenger_capacity: data.passenger_capacity || 0,
                    vehicle_type_id: data.vehicle_type_id || 0,
                    is_operational: data.is_operational || 1,
                });
            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal mengambil data kendaraan.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchSites();
            fetchVehicleTypes();
            fetchDetail();
        }
    }, [isOpen, selectedId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            cab_id: parseInt(formData.cab_id!.toString(), 10),
            passenger_capacity: Number(formData.passenger_capacity),
            vehicle_type_id: parseInt(formData.vehicle_type_id!.toString(), 10),
            is_operational: formData.is_operational ? 1 : 0,
        };

        try {
            await httpPut(endpointUrl(`vehicles/${selectedId}`), payload, true);
            toast.success("Kendaraan berhasil diperbarui");
            onClose();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memperbarui kendaraan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10">
                    <h4 className="mb-4 text-xl font-semibold lg:text-2xl">
                        Ubah Kendaraan
                    </h4>
                </div>

                {isLoading ? (
                    <p>Memuat data...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="space-y-5 px-2 pb-3">
                            <div>
                                <Label htmlFor="name">Nama / Merk Kendaraan</Label>
                                <Input
                                    type="text"
                                    id="name"
                                    defaultValue={formData.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Jenis Kendaraan</Label>
                                <Select
                                    onValueChange={(opt) => handleFieldChange('vehicle_type_id', parseInt(opt.value, 10))}
                                    placeholder={loadingVehicleType ? "Memuat..." : "Pilih Jenis Kendaraan"}
                                    value={_.find(vehicleTypeOptions, { value: formData.vehicle_type_id?.toString() })}
                                    options={vehicleTypeOptions}
                                    disabled={loadingVehicleType}
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Plat Nomor</Label>
                                <Input
                                    type="text"
                                    id="license_plate"
                                    defaultValue={formData.license_plate}
                                    onChange={(e) => handleFieldChange('license_plate', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Kapasitas</Label>
                                <Input
                                    type="text"
                                    id="passenger_capacity"
                                    defaultValue={formData.passenger_capacity}
                                    onChange={(e) => handleFieldChange('passenger_capacity', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Lokasi (Cabang)</Label>
                                <Select
                                    onValueChange={(opt) => handleFieldChange('cab_id', parseInt(opt.value, 10))}
                                    placeholder={loadingSites ? "Memuat..." : "Pilih Lokasi"}
                                    value={_.find(siteOptions, { value: formData.cab_id?.toString() })}
                                    options={siteOptions}
                                    disabled={loadingSites}
                                />
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    checked={formData.is_operational === 1}
                                    onChange={(e) => handleFieldChange('is_operational', e.target.checked ? 1 : 0)}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                />
                                <span className="ml-2">Kendaraan Operasional</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-md border text-sm font-medium transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default EditVehicleModal;