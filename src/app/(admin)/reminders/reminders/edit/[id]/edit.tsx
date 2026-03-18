"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import _ from "lodash";
import { toast } from "react-toastify";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";
import moment from "moment";

interface ReminderFormData {
    title: string;
    reminder_type_id: number | null;
    due_date: string;
}

interface SelectOption {
    value: string;
    label: string;
}

export default function EditReminderPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [formData, setFormData] = useState<ReminderFormData>({
        title: "",
        reminder_type_id: null,
        due_date: "",
    });

    const [typeOptions, setTypeOptions] = useState<SelectOption[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

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

        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchDetailData = async () => {
            if (!id) return;

            try {
                const response = await httpGet(endpointUrl(`/reminders/${id}`), true);
                const data = response.data.data;
                const apiDate = moment(data.due_date).isValid() ? moment(data.due_date).format('YYYY-MM-DD') : "";
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
                router.push("/reminders/reminders"); 
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchDetailData();
    }, [id, router]);

    const handleFieldChange = (field: keyof ReminderFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { title, reminder_type_id, due_date } = formData;

        if (!title || !reminder_type_id || !due_date) {
            toast.error("Semua field yang bertanda * wajib diisi.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title,
                reminder_type_id: parseInt(reminder_type_id.toString(), 10),
                due_date: moment(due_date).format('YYYY-MM-DD'),
                
            };

            await httpPut(endpointUrl(`/reminders/${id}`), payload, true);
            
            toast.success("Pengingat berhasil diperbarui!");
            router.push("/reminders/reminders"); 

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memperbarui pengingat");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <ComponentCard title="Edit Pengingat">
                <div className="flex justify-center items-center py-20">
                    <span className="text-gray-500 font-medium animate-pulse">Memuat data pengingat...</span>
                </div>
            </ComponentCard>
        );
    }

    return (
        <ComponentCard title="Edit Pengingat">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Keterangan <span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        placeholder="Contoh: Perpanjang STNK Mobil Avanza"
                        defaultValue={formData.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Jenis Pengingat <span className="text-red-400 ml-1">*</span>
                    </label>
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

                <div className="flex flex-col z-[100]">
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Tanggal Jatuh Tempo <span className="text-red-400 ml-1">*</span>
                    </label>
                    <SingleDatePicker 
                        placeholderText="Pilih tanggal jatuh tempo" 
                        onClearFilter={() => handleFieldChange('due_date', '')}
                        selectedDate={formData.due_date ? new Date(formData.due_date) : null}
                        onChange={(date: any) => handleFieldChange('due_date', date)}
                        viewingMonthDate={viewingMonthDate} 
                        onMonthChange={setViewingMonthDate} 
                        minDate={new Date()}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-8">
                    <button
                        onClick={() => router.push("/reminders/reminders")}
                        type="button"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || loadingTypes}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[120px]"
                    >
                        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}