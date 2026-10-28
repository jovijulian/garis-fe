"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _ from "lodash";
import { useRouter } from "next/navigation";
import { alertToast, endpointUrl, httpGet, httpPost } from "@/../helpers";
import { toast } from "react-toastify";

interface Payload {
    id_user: string | null;
    intern_id: number | null;
    name: string;
    phone_number: string;
    cab_id: number;
    is_external: number;
}

interface SelectOption {
    value: string;
    label: string;
}

interface InternItem {
    id: number;
    name: string;
    phone_number: string;
    cab_id: number;
    cabang?: {
        id_cab: number;
        nama_cab: string;
    };
}

export default function CreateDriverForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<Payload>({
        id_user: "",
        intern_id: null,
        name: "",
        cab_id: 0,
        phone_number: "",
        is_external: 0,
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
    const [internList, setInternList] = useState<InternItem[]>([]);
    const [internOptions, setInternOptions] = useState<SelectOption[]>([]);
    const [selectedInternId, setSelectedInternId] = useState<string>("");

    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingInterns, setLoadingInterns] = useState(true);
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
        };

        const fetchInterns = async () => {
            try {
                const response = await httpGet(endpointUrl("/interns/options"), true);
                const interns: InternItem[] = response.data.data || [];
                setInternList(interns);
                const formattedOptions = interns.map((item: InternItem) => ({
                    value: item.id.toString(),
                    label: item.name,
                }));
                setInternOptions(formattedOptions);
            } catch (error) {
                toast.error("Gagal memuat data magang / eksternal.");
            } finally {
                setLoadingInterns(false);
            }
        };

        fetchSites();
        fetchUsers();
        fetchInterns();
    }, []);

    const handleFieldChange = (updates: Partial<Payload>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleTypeChange = (type: number) => {
        setFormData(prev => ({
            ...prev,
            is_external: type,
            id_user: type === 1 ? null : "",
            intern_id: null,
            name: "",
            phone_number: "",
            cab_id: 0,
        }));
        setSelectedInternId("");
    };

    const handleInternSelect = (selectedOption: SelectOption | null) => {
        if (selectedOption) {
            const internId = parseInt(selectedOption.value, 10);
            setSelectedInternId(selectedOption.value);
            const intern = _.find(internList, { id: internId });
            if (intern) {
                handleFieldChange({
                    id_user: null,
                    intern_id: internId,
                    name: intern.name,
                    phone_number: intern.phone_number || "",
                    cab_id: intern.cab_id || 0,
                });
            }
        } else {
            setSelectedInternId("");
            handleFieldChange({
                id_user: null,
                intern_id: null,
                name: "",
                phone_number: "",
                cab_id: 0,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, cab_id, id_user, phone_number, is_external } = formData;

        if (is_external === 0) {
            if (!id_user || !name || !cab_id || !phone_number) {
                toast.error("Semua field yang bertanda * harus diisi.");
                return;
            }
        } else {
            if (!selectedInternId || !name || !cab_id || !phone_number) {
                toast.error("Semua field yang bertanda * harus diisi.");
                return;
            }
        }

        try {
            setLoading(true);
            const payload = is_external === 1
                ? {
                    id_user: null,
                    intern_id: parseInt(selectedInternId, 10),
                    name: name.trim(),
                    phone_number: phone_number.trim(),
                    cab_id: parseInt(cab_id!.toString(), 10),
                }
                : {
                    id_user: id_user,
                    intern_id: null,
                    name: name.trim(),
                    phone_number: phone_number.trim(),
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
                    <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300 text-sm">
                        Tipe Supir <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label
                            onClick={() => handleTypeChange(0)}
                            className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all flex-1 ${
                                formData.is_external === 0
                                    ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 dark:bg-blue-950/20 dark:border-blue-500"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
                            }`}
                        >
                            <input
                                type="radio"
                                name="driver_type"
                                value="internal"
                                checked={formData.is_external === 0}
                                onChange={() => handleTypeChange(0)}
                                className="w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                    Internal (Karyawan)
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Pilih supir dari daftar data karyawan terdaftar
                                </span>
                            </div>
                        </label>

                        <label
                            onClick={() => handleTypeChange(1)}
                            className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-all flex-1 ${
                                formData.is_external === 1
                                    ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 dark:bg-blue-950/20 dark:border-blue-500"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
                            }`}
                        >
                            <input
                                type="radio"
                                name="driver_type"
                                value="external"
                                checked={formData.is_external === 1}
                                onChange={() => handleTypeChange(1)}
                                className="w-4 h-4 text-blue-600 mt-0.5"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                    Eksternal
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Pilih supir dari daftar data anak magang / eksternal
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                {formData.is_external === 0 ? (
                    <>
                        <div>
                            <label className="block font-medium mb-1">
                                Pilih User / Karyawan<span className="text-red-400 ml-1">*</span>
                            </label>
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
                            <label className="block font-medium mb-1">
                                Nama<span className="text-red-400 ml-1">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formData.name}
                                placeholder="Otomatis terisi dari user terpilih"
                                required
                                disabled
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block font-medium mb-1">
                                Pilih Anak Magang / Eksternal<span className="text-red-400 ml-1">*</span>
                            </label>
                            <Select
                                onValueChange={(selectedOption) => {
                                    if (selectedOption) {
                                        handleInternSelect(selectedOption);
                                    }
                                }}
                                placeholder={loadingInterns ? "Loading anak magang..." : "Pilih anak magang / eksternal"}
                                value={_.find(internOptions, { value: selectedInternId })}
                                options={internOptions}
                                disabled={loadingInterns}
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">
                                Nama Supir<span className="text-red-400 ml-1">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formData.name}
                                placeholder="Otomatis terisi dari data magang terpilih"
                                required
                                disabled
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label className="block font-medium mb-1">
                        Nomor Telepon<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        value={formData.phone_number}
                        onChange={(e) => handleFieldChange({ phone_number: e.target.value })}
                        placeholder="Contoh: 08122122822"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">
                        Cabang<span className="text-red-400 ml-1">*</span>
                    </label>
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
                        disabled={
                            loading ||
                            loadingSites ||
                            (formData.is_external === 0 && loadingUsers) ||
                            (formData.is_external === 1 && loadingInterns)
                        }
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menambahkan..." : "Tambahkan Supir"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}