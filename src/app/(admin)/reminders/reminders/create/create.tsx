"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select-custom";
import Input from "@/components/form/input/InputField";
import React, { useEffect, useState } from "react";
import _ from "lodash";
import { useRouter } from "next/navigation";
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import { toast } from "react-toastify";
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
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

export default function CreateReminderForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<ReminderFormData>({
        title: "",
        reminder_type_id: null,
        due_date: "",
    });

    const [typeOptions, setTypeOptions] = useState<SelectOption[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loading, setLoading] = useState(false);
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
                setLoadingTypes(false);
            } catch (error) {
                toast.error("Gagal memuat data jenis pengingat.");
                setLoadingTypes(false);
            }
        };

        fetchOptions();
    }, []);

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

        try {
            setLoading(true);
            const payload = {
                title,
                reminder_type_id: parseInt(reminder_type_id.toString(), 10),
                due_date: moment(due_date).format('YYYY-MM-DD'),
            };

            await httpPost(
                endpointUrl("/reminders"),
                payload,
                true,
            );

            toast.success("Pengingat berhasil ditambahkan");
            router.push("/reminders/reminders");

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menambahkan pengingat");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Tambah Pengingat Baru">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-medium mb-1">
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
                    <label className="block font-medium mb-1">
                        Jenis Pengingat <span className="text-red-400 ml-1">*</span>
                    </label>
                    <Select
                        onValueChange={(selectedOption) => {
                            handleFieldChange('reminder_type_id', parseInt(selectedOption.value, 10));
                        }}
                        placeholder={loadingTypes ? "Memuat jenis pengingat..." : "Pilih jenis pengingat"}
                        value={_.find(typeOptions, { value: formData.reminder_type_id?.toString() })}
                        options={typeOptions}
                        disabled={loadingTypes}
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1">
                        Tanggal Jatuh Tempo <span className="text-red-400 ml-1">*</span>
                    </label>

                    <SingleDatePicker placeholderText="Pilih tanggal pesanan"
                        selectedDate={formData.due_date ? new Date(formData.due_date) : null}
                        onChange={(date: any) => handleFieldChange('due_date', date)}
                        onClearFilter={() => handleFieldChange('due_date', '')}
                        viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                        minDate={new Date()}
                    />

                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        onClick={() => router.push("/reminders")}
                        type="button"
                        className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading || loadingTypes}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[120px]"
                    >
                        {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}