"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _, { set } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpGet, httpPost } from "@/../helpers";
import { toast } from "react-toastify";

interface Payload {
    name: string;
    vehicle_type_id: number;
    license_plate: string;
    passenger_capacity: number;
    cab_id: number;
    is_operational: boolean;
}

interface SelectOption {
    value: string;
    label: string;
}

export default function CreateRoomForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<Payload>({
        name: "",
        cab_id: 0,
        license_plate: "",
        passenger_capacity: 0,
        vehicle_type_id: 0,
        is_operational: true,
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState<SelectOption[]>([]);
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingVehicleType, setLoadingVehicleType] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const response = await httpGet(endpointUrl("/rooms/site-options"), true);
                const formattedOptions = response.data.data.map((site: any) => ({
                    value: site.id_cab.toString(),
                    label: site.nama_cab,
                }));
                setSiteOptions(formattedOptions);
            } catch (error) {
                toast.error("Failed to load location data.");
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

        fetchSites();
        fetchVehicleTypes();
    }, []);

    const handleFieldChange = (field: keyof Payload, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, cab_id, vehicle_type_id, passenger_capacity, license_plate } = formData;

        if (!name || !cab_id || !vehicle_type_id || !passenger_capacity || !license_plate) {
            toast.error("Semua field yang bertanda * harus diisi.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                cab_id: parseInt(cab_id!.toString(), 10),
                passenger_capacity: Number(passenger_capacity),
                vehicle_type_id: parseInt(vehicle_type_id!.toString(), 10),
                is_operational: formData.is_operational ? 1 : 0,
            };

            await httpPost(
                endpointUrl("/vehicles"),
                payload,
                true,
            );
            toast.success("Kendaraan berhasil ditambahkan");
            router.push("/vehicles/master/vehicles");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menambahkan kendaraan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Data Kendaraan">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-medium mb-1">Nama / Merk Kendaraan<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="text"
                        defaultValue={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Jenis Kendaraan<span className="text-red-400 ml-1">*</span></label>
                    <Select
                        onValueChange={(selectedOption) => {
                            handleFieldChange('vehicle_type_id', parseInt(selectedOption.value, 10));
                        }}
                        placeholder={loadingVehicleType ? "Loading jenis kendaraan..." : "Pilih jenis kendaraan"}
                        value={_.find(vehicleTypeOptions, { value: formData.vehicle_type_id?.toString() })}
                        options={vehicleTypeOptions}
                        disabled={loadingVehicleType}
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Plat Nomor<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="text"
                        defaultValue={formData.license_plate}
                        onChange={(e) => handleFieldChange('license_plate', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Maksimal Kapasitas<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="number"
                        defaultValue={formData.passenger_capacity}
                        onChange={(e) => handleFieldChange('passenger_capacity', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Cabang<span className="text-red-400 ml-1">*</span></label>
                    <Select
                        onValueChange={(selectedOption) => {
                            handleFieldChange('cab_id', parseInt(selectedOption.value, 10));
                        }}
                        placeholder={loadingSites ? "Loading locations..." : "Select location"}
                        value={_.find(siteOptions, { value: formData.cab_id?.toString() })}
                        options={siteOptions}
                        disabled={loadingSites}
                    />
                </div>
                <div>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.is_operational}
                            onChange={(e) => handleFieldChange('is_operational', e.target.checked)}
                            className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2">Kendaraan Operasional</span>
                    </label>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/vehicles/master/vehicles")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || loadingSites}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menambahkan..." : "Tambahkan Kendaraan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}