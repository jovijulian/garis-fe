"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
import { endpointUrl, httpPost } from "@/../helpers";
import axios from "axios";
import { toast } from "react-toastify";
import moment from "moment";
import { CheckCircle, Loader2 } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedData: any;
}

export default function MarkCompleteModal({ isOpen, onClose, onSuccess, selectedData }: Props) {
    const [cost, setCost] = useState("");
    const [nextDueDate, setNextDueDate] = useState<any>("");
    const [viewingMonthDate, setViewingMonthDate] = useState(new Date());
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !selectedData) return null;

    const isRecurring = selectedData.is_recurring === 1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isRecurring && !nextDueDate) {
            toast.warning("Silakan pilih tanggal jatuh tempo berikutnya.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            if (cost) formData.append("cost", cost);
            if (file) formData.append("attachment", file);
            if (isRecurring && nextDueDate) {
                formData.append("next_due_date", moment(nextDueDate).format("YYYY-MM-DD"));
            }


            await httpPost(endpointUrl(`reminders/mark/${selectedData.id}`), formData, true);

            toast.success("Pengingat berhasil diselesaikan!");

            setCost("");
            setNextDueDate("");
            setFile(null);

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal memproses penyelesaian pengingat.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-slate-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Selesaikan Pengingat
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedData.title}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {isRecurring && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl mb-4">
                            <label className="block font-medium mb-1 text-orange-800 text-sm">
                                Tanggal Jatuh Tempo Berikutnya <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-orange-600 mb-3">
                                Pengingat ini bersifat berulang. Tentukan tanggal tagihan periode selanjutnya.
                            </p>
                            <div className="z-[100] relative">
                                <SingleDatePicker
                                    placeholderText="Pilih tanggal"
                                    onClearFilter={() => setNextDueDate("")}
                                    selectedDate={nextDueDate ? new Date(nextDueDate) : null}
                                    onChange={(date: any) => setNextDueDate(date)}
                                    viewingMonthDate={viewingMonthDate}
                                    onMonthChange={setViewingMonthDate}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block font-medium mb-1 text-gray-700 text-sm">
                            Biaya Aktual (Opsional)
                        </label>
                        <Input
                            type="number"
                            placeholder="Contoh: 150000"
                            defaultValue={cost}
                            onChange={(e) => setCost(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1 text-gray-700 text-sm">
                            Upload Bukti (Opsional)
                        </label>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, PDF</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center min-w-[120px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Selesaikan"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}