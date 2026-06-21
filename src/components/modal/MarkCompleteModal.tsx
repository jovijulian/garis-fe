"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
import { endpointUrl, httpPost } from "@/../helpers";
import axios from "axios";
import { toast } from "react-toastify";
import moment from "moment";
import { CheckCircle, Loader2, AlertOctagon } from "lucide-react";

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

    // State baru untuk menahan laju recurring (Siklus Terakhir)
    const [isFinalPayment, setIsFinalPayment] = useState(false);

    if (!isOpen || !selectedData) return null;

    const isRecurring = selectedData.is_recurring === 1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi: Jika recurring DAN BUKAN pembayaran terakhir, tanggal WAJIB diisi
        if (isRecurring && !isFinalPayment && !nextDueDate) {
            toast.warning("Silakan pilih tanggal jatuh tempo berikutnya atau tandai ini sebagai siklus terakhir.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            if (cost) formData.append("cost", cost);
            if (file) formData.append("attachment", file);

            // Hanya kirim next_due_date jika bukan pembayaran terakhir
            if (isRecurring && !isFinalPayment && nextDueDate) {
                formData.append("next_due_date", moment(nextDueDate).format("YYYY-MM-DD"));
            }

            const token = localStorage.getItem("token");

            await httpPost(endpointUrl(`reminders/mark/${selectedData.id}`), formData,
                true);

            if (isFinalPayment) {
                toast.success("Pengingat diselesaikan dan siklus berulang resmi dihentikan!");
            } else {
                toast.success("Pengingat berhasil diselesaikan!");
            }

            // Reset state
            setCost("");
            setNextDueDate("");
            setFile(null);
            setIsFinalPayment(false); // Reset state final payment

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

                    {/* Logika Tampilan Khusus Pengingat Berulang */}
                    {isRecurring && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-xl mb-4 space-y-4">

                            {/* Checkbox Akhiri Siklus */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="pt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={isFinalPayment}
                                        onChange={(e) => setIsFinalPayment(e.target.checked)}
                                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-orange-900 dark:text-orange-400 flex items-center gap-1.5">
                                        <AlertOctagon className="w-4 h-4" /> Akhiri Siklus Pengingat
                                    </p>
                                    <p className="text-xs text-orange-700 dark:text-orange-500 mt-1">
                                        Centang ini jika ini adalah tagihan / perpanjangan terakhir. Sistem tidak akan membuat pengingat untuk periode berikutnya.
                                    </p>
                                </div>
                            </label>

                            {/* Form Tanggal (Akan disembunyikan jika siklus diakhiri) */}
                            {!isFinalPayment && (
                                <div className="pt-3 border-t border-orange-200/50 dark:border-orange-800/50">
                                    <label className="block font-medium mb-1 text-orange-800 dark:text-orange-300 text-sm">
                                        Tanggal Jatuh Tempo Berikutnya <span className="text-red-500">*</span>
                                    </label>
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
                        </div>
                    )}

                    <div>
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300 text-sm">
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
                        <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300 text-sm">
                            Upload Bukti (Opsional)
                        </label>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                        />
                        <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, PDF</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Batal
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center min-w-[120px] transition-colors shadow-sm">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Selesaikan"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}