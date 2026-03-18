"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { endpointUrl, httpGet } from "@/../helpers";
import moment from "moment";
import { 
    CalendarClock, 
    MapPin, 
    Tag, 
    User, 
    CheckCircle, 
    Clock, 
    XCircle, 
    AlertTriangle 
} from "lucide-react";

interface DetailProps {
    isOpen: boolean;
    selectedId: number | null;
    onClose: () => void;
}

export default function DetailReminderModal({ isOpen, selectedId, onClose }: DetailProps) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDetail = async () => {
            if (!selectedId) return;

            setIsLoading(true);
            setError("");
            try {
                const response = await httpGet(endpointUrl(`reminders/${selectedId}`), true);
                setData(response.data.data);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Gagal memuat detail pengingat.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchDetail();
        } else {
            setData(null);
        }
    }, [isOpen, selectedId]);

    if (!isOpen) return null;

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                        <CheckCircle className="w-4 h-4" /> COMPLETED
                    </span>
                );
            case 'OVERDUE':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold border border-red-200">
                        <XCircle className="w-4 h-4" /> OVERDUE
                    </span>
                );
            case 'PENDING':
            default:
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold border border-yellow-200">
                        <Clock className="w-4 h-4" /> PENDING
                    </span>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[550px] m-4">
            <div className="relative w-full overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-blue-500" />
                        Detail Pengingat
                    </h3>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-sm animate-pulse">Memuat data...</p>
                        </div>
                    ) : error ? (
                        <div className="py-10 text-center">
                            <p className="text-red-500 bg-red-50 p-3 rounded-lg inline-block">{error}</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight pr-4">
                                        {data.title}
                                    </h4>
                                    {renderStatusBadge(data.status)}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                            <Tag className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Jenis Pengingat</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                {data.reminder_type?.name || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                            <MapPin className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Cabang</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                {data.cabang?.nama_cab || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 sm:col-span-2 mt-1">
                                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                            <CalendarClock className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Jatuh Tempo</p>
                                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                {moment(data.due_date).format("DD MMMM YYYY")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 px-1 uppercase tracking-wider">Aktivitas</h5>
                                
                                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                                    
                                    <div className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900"></div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {moment(data.created_at).format("DD MMM YYYY, HH:mm")}
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Dibuat oleh <span className="font-bold text-gray-900 dark:text-white">{data.created_by_user?.nama_user || data.created_by}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {data.status !== 'PENDING' && data.updated_by_user && (
                                        <div className="relative pl-6">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 shadow-sm ring-2 ring-green-100"></div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                {moment(data.updated_at).format("DD MMM YYYY, HH:mm")}
                                            </p>
                                            <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-3 border border-green-100 dark:border-green-800/30">
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {data.status === 'COMPLETED' ? 'Diselesaikan oleh' : 'Terakhir diperbarui oleh'} <span className="font-bold text-green-700 dark:text-green-400">{data.updated_by_user.nama_user}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                    >
                        Tutup
                    </button>
                </div>

            </div>
        </Modal>
    );
}