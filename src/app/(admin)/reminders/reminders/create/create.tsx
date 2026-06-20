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
    identity_number: string | null;
    description: string | null;
    is_recurring: number | null;
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
        identity_number: "",
        description: "",
        is_recurring: 1 // Set default ke 1 (Berulang) atau 0 (Sekali)
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
        const { title, reminder_type_id, due_date, identity_number, description, is_recurring } = formData;

        if (!title || !reminder_type_id || !due_date) {
            toast.error("Semua field yang bertanda * wajib diisi.");
            return;
        }

        try {
            setLoading(true);

            // Payload disesuaikan dengan request terbaru
            const payload = {
                title,
                reminder_type_id: parseInt(reminder_type_id.toString(), 10),
                due_date: moment(due_date).format('YYYY-MM-DD'),
                identity_number: identity_number || null,
                description: description || null,
                is_recurring: is_recurring,
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
                    <label className="block font-medium mb-1 text-gray-700 text-sm">
                        Judul Pengingat <span className="text-red-400 ml-1">*</span>
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
                    <label className="block font-medium mb-1 text-gray-700 text-sm">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-medium mb-1 text-gray-700 text-sm">
                            Nomor Identitas
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh No. STNK / Kontrak (Opsional)"
                            defaultValue={formData.identity_number || ""}
                            onChange={(e) => handleFieldChange('identity_number', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1 text-gray-700 text-sm">
                            Keterangan Tambahan
                        </label>
                        <textarea
                            value={formData.description || ""}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Deskripsi singkat (Opsional)"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-2 text-gray-700 text-sm">
                        Sifat Pengingat <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors flex-1">
                            <input
                                type="radio"
                                name="is_recurring"
                                value={1}
                                checked={formData.is_recurring === 1}
                                onChange={() => handleFieldChange('is_recurring', 1)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-800">Berulang</span>
                                <span className="text-xs text-gray-500">Akan generate otomatis bulan/tahun depan saat dibayar</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors flex-1">
                            <input
                                type="radio"
                                name="is_recurring"
                                value={0}
                                checked={formData.is_recurring === 0}
                                onChange={() => handleFieldChange('is_recurring', 0)}
                                className="w-4 h-4 text-blue-600"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-800">Sekali Saja</span>
                                <span className="text-xs text-gray-500">Berhenti setelah tagihan ini diselesaikan</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block font-medium mb-1 text-gray-700 text-sm">
                        Tanggal Jatuh Tempo Pertama <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="w-full sm:w-1/2">
                        <SingleDatePicker placeholderText="Pilih tanggal jatuh tempo"
                            selectedDate={formData.due_date ? new Date(formData.due_date) : null}
                            onChange={(date: any) => handleFieldChange('due_date', date)}
                            onClearFilter={() => handleFieldChange('due_date', '')}
                            viewingMonthDate={viewingMonthDate} onMonthChange={setViewingMonthDate}
                            minDate={new Date()}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        onClick={() => router.push("/reminders")}
                        type="button"
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading || loadingTypes}
                        className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[120px] shadow-sm"
                    >
                        {loading ? "Menyimpan..." : "Simpan Pengingat"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}