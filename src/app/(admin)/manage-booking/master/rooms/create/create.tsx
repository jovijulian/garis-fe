"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _, { set } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpGet, httpPost } from "@/../helpers"; 
import { toast } from "react-toastify";

interface RoomFormData {
    name: string;
    cab_id: number | null;
    capacity: string; 
    location: string;
    description: string;
}

interface SelectOption {
    value: string;
    label: string;
}

export default function CreateRoomForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<RoomFormData>({
        name: "",
        cab_id: null,
        capacity: "",
        location: "",
        description: "",
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [loadingSites, setLoadingSites] = useState(true);
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

        fetchSites();
    }, []);

    const handleFieldChange = (field: keyof RoomFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, cab_id, capacity, location } = formData;
        
        if (!name || !cab_id || !capacity || !location) {
            toast.error("Semua field yang bertanda * harus diisi.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                cab_id: parseInt(cab_id!.toString(), 10),
                capacity: parseInt(capacity, 10),
            };

            await httpPost(
                endpointUrl("/rooms"),
                payload,
                true,
            );
            toast.success("Ruangan berhasil ditambahkan");
            router.push("/manage-booking/master/rooms");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menambahkan ruangan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Create New Room">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-medium mb-1">Nama ruangan<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="text"
                        defaultValue={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
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
                    <label className="block font-medium mb-1">Kapasitas<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="number"
                        defaultValue={formData.capacity}
                        onChange={(e) => handleFieldChange('capacity', e.target.value)}
                        required
                    />
                </div>

                 <div>
                    <label className="block font-medium mb-1">Detail Lokasi<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="text"
                        placeholder="e.g., Lantai 5, Wing A"
                        defaultValue={formData.location}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">Deskripsi</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder=""
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/manage-booking/master/rooms")}
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
                        {loading ? "Menambahkan..." : "Tambahkan Ruangan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}