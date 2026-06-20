"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { endpointUrl, httpPost } from "@/../helpers";
import axios from "axios";
import { toast } from "react-toastify";
import { UploadCloud, Loader2 } from "lucide-react";
import Input from "../form/input/InputField";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedId: number | null;
}

export default function UploadProofModal({ isOpen, onClose, onSuccess, selectedId }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [cost, setCost] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen || !selectedId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
      

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("attachment", file || "");
            formData.append("cost", cost)
            await httpPost(endpointUrl(`reminders/upload-proof/${selectedId}`), formData, true);

            toast.success("Bukti berhasil diunggah!");
            setFile(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal mengunggah bukti.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-6 py-5 border-b border-gray-100 dark:bg-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg"><UploadCloud className="w-5 h-5 text-blue-600" /></div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Susulkan Bukti</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                        <label className="block font-medium mb-2 text-gray-700 text-sm">Pilih File Bukti</label>
                        <input
                            type="file" accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full px-3 py-3 border border-dashed border-gray-300 rounded-xl text-sm bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700">Batal</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center min-w-[100px] justify-center">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}