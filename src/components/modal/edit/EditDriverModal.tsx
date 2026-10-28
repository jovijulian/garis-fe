"use client";

import React, { useEffect, useState } from "react";
import _ from "lodash";
import { toast } from "react-toastify";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";

import { Modal } from "@/components/ui/modal";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";

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

interface EditProps {
    isOpen: boolean;
    selectedId: number | null;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditDriverModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<Payload>({
        name: "",
        cab_id: 0,
        id_user: null,
        intern_id: null,
        phone_number: "",
        is_external: 0,
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [internList, setInternList] = useState<InternItem[]>([]);
    const [internOptions, setInternOptions] = useState<SelectOption[]>([]);
    const [selectedInternId, setSelectedInternId] = useState<string>("");
    const [loadingSites, setLoadingSites] = useState(true);
    const [loadingInterns, setLoadingInterns] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        const fetchInterns = async () => {
            setLoadingInterns(true);
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
                console.error("Gagal memuat data magang / eksternal:", error);
            } finally {
                setLoadingInterns(false);
            }
        };

        const fetchDetail = async () => {
            if (!selectedId) return;
            setIsLoading(true);
            try {
                const response = await httpGet(endpointUrl(`drivers/${selectedId}`), true);
                const data = response.data.data;
                const isExt = Boolean(data.intern_id || data.is_external === 1 || !data.id_user) ? 1 : 0;
                const internId = data.intern_id || null;
                setFormData({
                    name: data.name || "",
                    cab_id: data.cab_id || 0,
                    phone_number: data.phone_number || "",
                    id_user: isExt === 1 ? null : (data.id_user ? data.id_user.toString() : ""),
                    intern_id: internId,
                    is_external: isExt,
                });
                if (internId) {
                    setSelectedInternId(internId.toString());
                }
            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal mengambil data supir.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchSites();
            fetchInterns();
            fetchDetail();
        }
    }, [isOpen, selectedId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, cab_id, id_user, phone_number, is_external, intern_id } = formData;

        if (!name || !cab_id || !phone_number) {
            toast.error("Semua field yang bertanda * harus diisi.");
            return;
        }

        setIsSubmitting(true);

        const payload = is_external === 1
            ? {
                id_user: null,
                intern_id: selectedInternId ? parseInt(selectedInternId, 10) : intern_id,
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

        try {
            await httpPut(endpointUrl(`drivers/${selectedId}`), payload, true);
            toast.success("Supir berhasil diperbarui");
            onClose();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memperbarui supir.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10">
                    <h4 className="mb-4 text-xl font-semibold lg:text-2xl">
                        Ubah Supir
                    </h4>
                </div>

                {isLoading ? (
                    <p className="text-gray-500 py-4">Memuat data...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="space-y-4 px-2 pb-3">
                            <div>
                                <Label>Tipe Supir</Label>
                                <div className="flex items-center gap-2.5 mt-1">
                                    <Badge
                                        color={formData.is_external === 1 ? "warning" : "primary"}
                                        size="md"
                                    >
                                        {formData.is_external === 1 ? "Eksternal" : "Internal (Karyawan)"}
                                    </Badge>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        (Jenis supir tidak dapat diubah)
                                    </span>
                                </div>
                            </div>

                            {formData.is_external === 1 && (
                                <div>
                                    <Label>Pilih Anak Magang / Eksternal</Label>
                                    <Select
                                        onValueChange={(selectedOption) => {
                                            if (selectedOption) {
                                                const internId = parseInt(selectedOption.value, 10);
                                                setSelectedInternId(selectedOption.value);
                                                const intern = _.find(internList, { id: internId });
                                                if (intern) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        intern_id: internId,
                                                        name: intern.name,
                                                        phone_number: intern.phone_number || prev.phone_number,
                                                        cab_id: intern.cab_id || prev.cab_id,
                                                    }));
                                                }
                                            }
                                        }}
                                        placeholder={loadingInterns ? "Memuat..." : "Pilih anak magang / eksternal"}
                                        value={
                                            selectedInternId
                                                ? _.find(internOptions, { value: selectedInternId })
                                                : _.find(internOptions, { label: formData.name })
                                        }
                                        options={internOptions}
                                        disabled={loadingInterns}
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="name">Nama Supir</Label>
                                <Input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    disabled
                                    className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                />
                                {formData.is_external === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Nama supir terikat dengan akun karyawan internal
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="phone_number">
                                    Nomor Telepon <span className="text-red-400 ml-1">*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="phone_number"
                                    value={formData.phone_number}
                                    onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                                    placeholder="Contoh: 08122122822"
                                    required
                                />
                            </div>

                            <div>
                                <Label>
                                    Lokasi (Cabang) <span className="text-red-400 ml-1">*</span>
                                </Label>
                                <Select
                                    onValueChange={(opt) => handleFieldChange('cab_id', parseInt(opt.value, 10))}
                                    placeholder={loadingSites ? "Memuat..." : "Pilih Lokasi"}
                                    value={_.find(siteOptions, { value: formData.cab_id?.toString() })}
                                    options={siteOptions}
                                    disabled={loadingSites}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-md border text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || loadingSites}
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

export default EditDriverModal;