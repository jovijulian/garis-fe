"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _, { set } from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpGet, httpPost } from "@/../helpers";
import { toast } from "react-toastify";

interface CreateData {
    name: string;
    phone_number: string;
    cab_id: number | null;
}
interface SelectOption {
    value: string;
    label: string;
}

export default function CreateForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<CreateData>({
        name: "",
        cab_id: null,
        phone_number: "",
      
    });
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingSites, setLoadingSites] = useState(true);
    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const siteRes = await httpGet(endpointUrl("/rooms/site-options"), true);
                const formattedSites = siteRes.data.data.map((site: any) => ({
                    value: site.id_cab.toString(),
                    label: site.nama_cab,
                }));
                setSiteOptions(formattedSites);
                setLoadingSites(false);

            } catch (error) {
                toast.error("Gagal memuat data opsi.");
                setLoadingSites(false);
            }
        };

        fetchData();
    }, []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, cab_id, phone_number } = formData;
        if (!name || !cab_id || !phone_number) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            setLoading(true);
            const payload = {
                ...formData,
                cab_id: parseInt(cab_id!.toString(), 10),
            };

            await httpPost(
                endpointUrl("/interns"),
                payload,
                true,
            );
            toast.success("Karyawan berhasil ditambahkan!");
            router.push("/admin-panel/intern");
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.type || "Gagal menambahkan karyawan");
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (field: keyof CreateData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <ComponentCard title="Data Karyawan">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Nama<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        No. Handphone<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={formData.phone_number}
                        onChange={(e) => handleFieldChange('phone_number', e.target.value)}
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

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/admin-panel/intern")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menambahkan..." : "Tambahkan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}

