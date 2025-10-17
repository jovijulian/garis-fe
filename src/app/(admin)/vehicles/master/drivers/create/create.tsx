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
    id_user: string;
    name: string;
    phone_number: string;
    cab_id: number;
}

interface SelectOption {
    value: string;
    label: string;
}

export default function CreateDriverForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<Payload>({
        id_user: "",
        name: "",
        cab_id: 0,
        phone_number: "",
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
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
                toast.error("Gagal memuat data lokasi.");
            } finally {
                setLoadingSites(false);
            }
        };
        const fetchUsers = async () => {
            try {
                const response = await httpGet(endpointUrl("/users/options"), true);
                const formattedOptions = response.data.data.map((type: any) => ({
                    value: type.id_user.toString(),
                    label: type.nama_user,
                }));
                setUserOptions(formattedOptions);
            } catch (error) {
                toast.error("Gagal memuat data pengguna.");
            } finally {
                setLoadingUsers(false);
            }
        }

        fetchSites();
        fetchUsers();
    }, []);

    const handleFieldChange = (updates: Partial<Payload>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, cab_id, id_user, phone_number } = formData;

        if (!name || !cab_id || !id_user || !phone_number) {
            toast.error("Semua field yang bertanda * harus diisi.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                cab_id: parseInt(cab_id!.toString(), 10),
            };

            await httpPost(
                endpointUrl("/drivers"),
                payload,
                true,
            );
            toast.success("Supir berhasil ditambahkan");
            router.push("/vehicles/master/drivers");
        } catch (error: any) {
            alertToast(error, "Gagal menambahkan supir");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Data Supir">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-medium mb-1">Pilih User / Karyawan<span className="text-red-400 ml-1">*</span></label>
                    <Select
                        onValueChange={(selectedOption) => {
                           if (selectedOption) {
                             handleFieldChange({
                                id_user: selectedOption.value,
                                name: selectedOption.label,
                            });
                           }
                        }}
                        placeholder={loadingUsers ? "Loading user..." : "Pilih user"}
                        value={_.find(userOptions, { value: formData.id_user?.toString() })}
                        options={userOptions}
                        disabled={loadingUsers}
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Nama<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="text"
                        defaultValue={formData.name}
                        required
                        disabled
                        className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Nomor Telepon<span className="text-red-400 ml-1">*</span></label>
                    <Input
                        type="text"
                        defaultValue={formData.phone_number}
                        onChange={(e) => handleFieldChange({ phone_number: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">Cabang<span className="text-red-400 ml-1">*</span></label>
                    <Select
                        onValueChange={(selectedOption) => {
                           if (selectedOption) {
                             handleFieldChange({ cab_id: parseInt(selectedOption.value, 10) });
                           }
                        }}
                        placeholder={loadingSites ? "Loading locations..." : "Select location"}
                        value={_.find(siteOptions, { value: formData.cab_id?.toString() })}
                        options={siteOptions}
                        disabled={loadingSites}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => router.push("/vehicles/master/drivers")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading || loadingSites || loadingUsers}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menambahkan..." : "Tambahkan Supir"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}