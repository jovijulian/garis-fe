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

interface EditProps {
    isOpen: boolean;
    selectedId: number | null;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditRoomModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<RoomFormData>({
        name: "",
        cab_id: null,
        capacity: "",
        location: "",
        description: "",
    });

    const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
    const [loadingSites, setLoadingSites] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleFieldChange = (field: keyof RoomFormData, value: any) => {
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

        const fetchRoomData = async () => {
            if (!selectedId) return;
            setIsLoading(true);
            try {
                const response = await httpGet(endpointUrl(`rooms/${selectedId}`), true);
                const roomData = response.data.data;
                setFormData({
                    name: roomData.name || "",
                    cab_id: roomData.cab_id || null,
                    capacity: roomData.capacity?.toString() || "",
                    location: roomData.location || "",
                    description: roomData.description || "",
                });
            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal mengambil data ruangan.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchSites();
            fetchRoomData();
        }
    }, [isOpen, selectedId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            cab_id: parseInt(formData.cab_id!.toString(), 10),
            capacity: parseInt(formData.capacity, 10),
        };

        try {
            await httpPut(endpointUrl(`rooms/${selectedId}`), payload, true);
            toast.success("Ruangan berhasil diperbarui");
            onClose(); 
            onSuccess?.(); 
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memperbarui ruangan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10">
                    <h4 className="mb-4 text-xl font-semibold lg:text-2xl">
                        Ubah Ruangan
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
                                <Label>Lokasi (Cabang)</Label>
                                <Select
                                    onValueChange={(opt) => handleFieldChange('cab_id', parseInt(opt.value, 10))}
                                    placeholder={loadingSites ? "Memuat..." : "Pilih Lokasi"}
                                    value={_.find(siteOptions, { value: formData.cab_id?.toString() })}
                                    options={siteOptions}
                                    disabled={loadingSites}
                                />
                            </div>
                            {/* Field Kapasitas */}
                            <div>
                                <Label htmlFor="capacity">Kapasitas</Label>
                                <Input
                                    type="number"
                                    id="capacity"
                                    defaultValue={formData.capacity}
                                    onChange={(e) => handleFieldChange('capacity', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="location">Detail Lokasi</Label>
                                <Input
                                    type="text"
                                    id="location"
                                    placeholder="Contoh: Lantai 5, Wing A"
                                    defaultValue={formData.location}
                                    onChange={(e) => handleFieldChange('location', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Deskripsi</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
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

export default EditRoomModal;