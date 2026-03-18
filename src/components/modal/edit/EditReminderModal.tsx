"use client";

import React, { useEffect, useState } from "react";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import _ from "lodash";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";
import { toast } from "react-toastify";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import SingleDatePicker from "@/components/calendar/SingleDatePicker";

interface EditProps {
    isOpen: boolean;
    selectedId: number;
    onClose: () => void;
    onSuccess?: () => void;
}

interface ReminderFormData {
    title: string;
    reminder_type_id: number | null;
    due_date: string;
}

interface SelectOption {
    value: string;
    label: string;
}

const EditReminderModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState<ReminderFormData>({
        title: "",
        reminder_type_id: null,
        due_date: "",
    });

    const [typeOptions, setTypeOptions] = useState<SelectOption[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

    // Fetch Master Options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await httpGet(endpointUrl("/reminder-types/options"), true);
                const formattedTypes = res.data.data.map((item: any) => ({
                    value: item.id.toString(),
                    label: item.name || item.title,
                }));
                setTypeOptions(formattedTypes);
            } catch (error) {
                toast.error("Gagal memuat data jenis pengingat.");
            } finally {
                setLoadingTypes(false);
            }
        };

        if (isOpen) {
            fetchOptions();
        }
    }, [isOpen]);

    // Fetch Detail Data
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedId) return;

            setIsLoadingData(true);
            setError("");
            try {
                // Sesuaikan endpoint sesuai route BE kamu
                const response = await httpGet(endpointUrl(`/reminders/${selectedId}`), true);
                const data = response.data.data;

                // Set initial date format (pastikan formatnya YYYY-MM-DD)
                const apiDate = data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : "";

                setFormData({
                    title: data.title || "",
                    reminder_type_id: data.reminder_type_id || data.reminder_type?.id || null,
                    due_date: apiDate,
                });

                if (data.due_date) {
                    setViewingMonthDate(new Date(data.due_date));
                }

            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal mengambil data pengingat.");
                setError("Tidak dapat memuat data pengingat.");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (isOpen) {
            fetchData();
        } else {
            handleCancel();
        }
    }, [isOpen, selectedId]);

    const handleFieldChange = (field: keyof ReminderFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setError("");
        const { title, reminder_type_id, due_date } = formData;

        if (!title || !reminder_type_id || !due_date) {
            toast.error("Semua field yang bertanda * wajib diisi.");
            return;
        }

        const payload = {
            title,
            reminder_type_id: parseInt(reminder_type_id.toString(), 10),
            due_date
        };

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`/reminders/${selectedId}`), payload, true);
            toast.success("Berhasil mengubah pengingat");
            
            handleCancel();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengubah pengingat");
            setError(error?.response?.data?.message || "Gagal mengubah data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        onClose();
        setError("");
        setFormData({
            title: "",
            reminder_type_id: null,
            due_date: "",
        });
        setViewingMonthDate(new Date());
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10 mb-6">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                        Edit Pengingat
                    </h4>
                </div>
                
                {isLoadingData ? (
                    <div className="flex justify-center py-10">
                        <span className="text-gray-500">Memuat data...</span>
                    </div>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="flex flex-col"
                    >
                        <div className="space-y-5 px-2 pb-3">
                            {/* Keterangan */}
                            <div>
                                <Label htmlFor="title">Keterangan <span className="text-red-400 ml-1">*</span></Label>
                                <Input
                                    type="text"
                                    id="title"
                                    name="title"
                                    defaultValue={formData.title}
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                    placeholder="Contoh: Perpanjang STNK Mobil Avanza"
                                    required
                                />
                            </div>

                            {/* Jenis Pengingat */}
                            <div>
                                <Label htmlFor="reminder_type_id">Jenis Pengingat <span className="text-red-400 ml-1">*</span></Label>
                                <Select
                                    onValueChange={(selectedOption) => {
                                        handleFieldChange('reminder_type_id', parseInt(selectedOption.value, 10));
                                    }}
                                    placeholder={loadingTypes ? "Memuat jenis pengingat..." : "Pilih jenis pengingat"}
                                    value={_.find(typeOptions, { value: formData.reminder_type_id?.toString() }) || null}
                                    options={typeOptions}
                                    disabled={loadingTypes}
                                />
                            </div>

                            {/* Tanggal Jatuh Tempo */}
                            <div className="flex flex-col z-[100]">
                                <Label htmlFor="due_date">Tanggal Jatuh Tempo <span className="text-red-400 ml-1">*</span></Label>
                                <SingleDatePicker 
                                    placeholderText="Pilih tanggal jatuh tempo" 
                                    selectedDate={formData.due_date ? new Date(formData.due_date) : null}
                                    onChange={(date) => handleFieldChange('due_date', date ? date.toISOString().split('T')[0] : '')}
                                    onClearFilter={() => handleFieldChange('due_date', '')}
                                    viewingMonthDate={viewingMonthDate} 
                                    onMonthChange={setViewingMonthDate} 
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 px-2 mt-6 justify-end">
                            <button
                                type="button"
                                title="Batal"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                title="Simpan"
                                disabled={isSubmitting || loadingTypes}
                                className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all min-w-[80px] flex justify-center"
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

export default EditReminderModal;