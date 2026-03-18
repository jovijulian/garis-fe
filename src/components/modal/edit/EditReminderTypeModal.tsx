"use client";

import React, { useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import { endpointUrl, httpGet, httpPut } from "@/../helpers";
import { toast } from "react-toastify";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { X } from "lucide-react";

interface EditProps {
    isOpen: boolean;
    selectedId: number;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditReminderTypeModal: React.FC<EditProps> = ({
    isOpen,
    selectedId,
    onClose,
    onSuccess,
}) => {
    const [name, setName] = useState("");
    const [intervals, setIntervals] = useState<number[]>([]);
    const [intervalInput, setIntervalInput] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedId) return;

            setIsLoading(true);
            setError("");
            try {
                const response = await httpGet(endpointUrl(`reminder-types/${selectedId}`), true);
                const typeData = response.data.data;

                setName(typeData.name || "");

                let fetchedIntervals = typeData.notification_intervals || [];
                if (typeof fetchedIntervals === 'string') {
                    try {
                        fetchedIntervals = JSON.parse(fetchedIntervals);
                    } catch (e) {
                        fetchedIntervals = [];
                    }
                }
                setIntervals(fetchedIntervals);

            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal mengambil data tipe pengingat.");
                setError("Tidak dapat memuat data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
        } else {
            handleCancel();
        }
    }, [isOpen, selectedId]);

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

    const handleSubmit = async () => {
        setError("");

        if (!name) {
            toast.error("Nama tipe reminder wajib diisi.");
            return;
        }

        if (intervals.length === 0) {
            toast.error("Minimal harus ada 1 jadwal pengingat.");
            return;
        }

        const payload = {
            name,
            notification_intervals: intervals
        };

        try {
            await httpPut(endpointUrl(`reminder-types/${selectedId}`), payload, true);
            toast.success("Berhasil mengubah tipe pengingat");
            
            handleCancel();
            onSuccess?.();  
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengubah tipe pengingat");
            setError(error?.response?.data?.message || "Gagal mengubah data.");
        }
    };

    const handleCancel = () => {
        onClose();
        setError("");
        setName("");
        setIntervals([]);
        setIntervalInput("");
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
            <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                <div className="pr-10 mb-6">
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                        Edit Jenis Pengingat
                    </h4>
                </div>
                
                {isLoading ? (
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
                            <div>
                                <Label htmlFor="name">Nama Pengingat<span className="text-red-400 ml-1">*</span></Label>
                                <Input
                                    type="text"
                                    id="name"
                                    name="name"
                                    defaultValue={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="intervals">Jadwal Notifikasi (H-?)<span className="text-red-400 ml-1">*</span></Label>
                                <p className="text-xs text-gray-500 mb-2 mt-1">
                                    Ketik angka hari lalu tekan <strong>Enter</strong>.
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
                                        className="flex-1 min-w-[130px] outline-none bg-transparent text-gray-700 dark:text-white placeholder-gray-400 text-sm"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 px-2 mt-6 justify-end">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all min-w-[80px]"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default EditReminderTypeModal;