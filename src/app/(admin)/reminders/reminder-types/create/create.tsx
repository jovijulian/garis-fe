"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { endpointUrl, httpPost } from "@/../helpers";
import { toast } from "react-toastify";
import { X } from "lucide-react";

interface CreateData {
    name: string;
    notification_intervals: number[];
}

export default function CreateReminderType() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [intervals, setIntervals] = useState<number[]>([7, 3, 1, 0]);
    const [intervalInput, setIntervalInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAddInterval = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();

            const numValue = parseInt(intervalInput, 10);

            if (isNaN(numValue) || numValue < 0) {
                toast.warning("Masukkan angka yang valid (0 atau lebih)");
                return;
            }

            if (intervals.includes(numValue)) {
                toast.info(`Interval ${numValue} hari sudah ditambahkan.`);
                setIntervalInput("");
                return;
            }

            const newIntervals = [...intervals, numValue].sort((a, b) => b - a);
            setIntervals(newIntervals);
            setIntervalInput("");
        }
    };

    const handleRemoveInterval = (valueToRemove: number) => {
        setIntervals(intervals.filter((val) => val !== valueToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            toast.error("Nama tipe reminder wajib diisi.");
            return;
        }

        if (intervals.length === 0) {
            toast.error("Minimal harus ada 1 jadwal pengingat (misal: 0 untuk hari H).");
            return;
        }

        try {
            setLoading(true);
            const payload: CreateData = {
                name,
                notification_intervals: intervals
            };

            await httpPost(
                endpointUrl("/reminder-types"),
                payload,
                true,
            );

            toast.success("Tipe Reminder berhasil ditambahkan!");
            router.push("/reminders/reminder-types");

        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menambahkan tipe reminder.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ComponentCard title="Data Jenis Pengingat">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Nama Pengingat<span className="text-red-400 ml-1">*</span>
                    </label>
                    <Input
                        type="text"
                        defaultValue={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Perpanjangan STNK"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Jadwal Notifikasi (H-?)<span className="text-red-400 ml-1">*</span>
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                        Ketik angka hari (misal 14 untuk H-14), lalu tekan <strong>Enter</strong>. Masukkan 0 untuk notifikasi pada hari H.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                        {intervals.map((interval) => (
                            <span
                                key={interval}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-sm font-semibold rounded-full"
                            >
                                {interval === 0 ? "Hari H (0)" : `H-${interval}`}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveInterval(interval)}
                                    className="hover:text-red-500 focus:outline-none ml-1 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}

                        <input
                            type="number"
                            min="0"
                            value={intervalInput}
                            onChange={(e) => setIntervalInput(e.target.value)}
                            onKeyDown={handleAddInterval}
                            placeholder="Ketik angka & Enter..."
                            className="flex-1 min-w-[150px] outline-none bg-transparent text-gray-700 dark:text-white placeholder-gray-400 text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        onClick={() => router.push("/reminders/reminder-types")}
                        type="button"
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </ComponentCard>
    );
}