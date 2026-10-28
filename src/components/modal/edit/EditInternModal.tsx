"use client";

import React, { useEffect, useState } from "react";
import _ from "lodash";
import { toast } from "react-toastify";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";

import { Modal } from "@/components/ui/modal";
import Select from "@/components/form/Select-custom";
import MultiSelect from "@/components/form/MultiSelect-custom";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface InternData {
    name: string;
    cab_id: number | null;
    phone_number: string; 
   
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

const EditInternModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<InternData>({
        name: "",
        cab_id: null,
        phone_number: "",
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFieldChange = (field: keyof InternData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                const siteResponse = await httpGet(endpointUrl("/rooms/site-options"), true);
                const formattedSites = siteResponse.data.data.map((site: any) => ({
                    value: site.id_cab.toString(),
                    label: site.nama_cab,
                }));
                setSiteOptions(formattedSites);

               
            } catch (error) {
                toast.error("Gagal memuat data opsi.");
            } finally {
                setLoadingOptions(false);
            }
        };

        const fetchIntern = async () => {
            if (!selectedId) return;
            setIsLoading(true);
            try {
                const response = await httpGet(endpointUrl(`interns/${selectedId}`), true);
                const internData = response.data.data;
              

                setFormData({
                    name: internData.name || "",
                    cab_id: internData.cab_id || null,
                    phone_number: internData.phone_number || "",
                });
            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal mengambil data karyawan.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchOptions();
            fetchIntern();
        }
    }, [isOpen, selectedId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            cab_id: parseInt(formData.cab_id!.toString(), 10),
        };

        try {
            await httpPut(endpointUrl(`interns/${selectedId}`), payload, true);
            toast.success("Karyawan berhasil diperbarui");
            onClose(); 
            onSuccess?.(); 
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memperbarui Karyawan.");
        } finally {
            setIsSubmitting(false);
        }
    };

  

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10">
                    <h4 className="mb-4 text-xl font-semibold lg:text-2xl">
                        Ubah Karyawan
                    </h4>
                </div>

                {isLoading ? (
                    <p>Memuat data...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="space-y-5 px-2 pb-3">
                            <div>
                                <Label htmlFor="name">Nama</Label>
                                <Input
                                    type="text"
                                    id="name"
                                    defaultValue={formData.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">No. Handphone</Label>
                                <Input
                                    type="text"
                                    id="phone_number"
                                    defaultValue={formData.phone_number}
                                    onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Lokasi (Cabang)</Label>
                                <Select
                                    onValueChange={(opt) => handleFieldChange('cab_id', parseInt(opt.value, 10))}
                                    placeholder={loadingOptions ? "Memuat..." : "Pilih Lokasi"}
                                    value={_.find(siteOptions, { value: formData.cab_id?.toString() })}
                                    options={siteOptions}
                                    disabled={loadingOptions}
                                />
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

export default EditInternModal;