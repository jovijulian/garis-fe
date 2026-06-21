"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { endpointUrl, httpGet } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import moment from "moment";
import { toast } from "react-toastify";
import {
    ArrowLeft, CalendarClock, MapPin, Tag, CheckCircle,
    Clock, XCircle, FileText, Download, AlertTriangle, History
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";

export default function UnifiedDetailHistoryPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const imageUrl = process.env.IMAGE_URL
    const [detail, setDetail] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDetailAndHistory = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const [detailRes, historyRes] = await Promise.all([
                    httpGet(endpointUrl(`reminders/${id}`), true),
                    httpGet(endpointUrl(`reminders/history/${id}`), true)
                ]);

                setDetail(detailRes.data.data);
                setHistory(historyRes.data.data);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Gagal memuat data pengingat.");
                toast.error("Gagal memuat data pengingat.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetailAndHistory();
    }, [id]);

    const downloadFile = (path: string) => {
        window.open(`${imageUrl}${path}`, '_blank');
    };

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

    if (loading) {
        return <div className="p-10 text-center animate-pulse text-gray-500">Memuat detail dan histori pengingat...</div>;
    }

    if (error || !detail) {
        return (
            <div className="py-10 text-center space-y-4">
                <p className="text-red-500 bg-red-50 p-3 rounded-lg inline-block">{error || "Data tidak ditemukan."}</p>
                <br />
                <button onClick={() => router.back()} className="text-blue-600 font-medium hover:underline">Kembali</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ComponentCard title="Informasi Pengingat">
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {detail.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold px-2.5 py-0.5 rounded text-xs">
                                    {detail.reminder_code}
                                </span>
                                {detail.is_recurring === 1 && (
                                    <span className="bg-purple-100 text-purple-700 font-bold px-2.5 py-0.5 rounded text-xs flex items-center gap-1">
                                        <History className="w-3 h-3" /> BERULANG
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>{renderStatusBadge(detail.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"><Tag className="w-4 h-4 text-blue-500" /></div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5">Jenis Pengingat</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{detail.reminder_type?.name || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"><MapPin className="w-4 h-4 text-orange-500" /></div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5">Cabang</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{detail.cabang?.nama_cab || "-"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"><CalendarClock className="w-4 h-4 text-red-500" /></div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5">Jatuh Tempo Saat Ini</p>
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{moment(detail.due_date).format("DD MMMM YYYY")}</p>
                            </div>
                        </div>

                        {detail.identity_number && (
                            <div className="flex items-start gap-3 sm:col-span-2 md:col-span-3 mt-2">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Nomor Identita</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{detail.identity_number}</p>
                                </div>
                            </div>
                        )}

                        {detail.description && (
                            <div className="flex items-start gap-3 sm:col-span-2 md:col-span-3 mt-2">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Keterangan Tambahan</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-300">{detail.description}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ComponentCard>

            <ComponentCard title="Riwayat Siklus & Perpanjangan">
                {history.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">Tidak ada histori ditemukan.</p>
                ) : (
                    <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 md:ml-6 mt-4 mb-4 space-y-8">
                        {history.map((item, index) => {
                            const isCurrent = item.id === detail.id;

                            return (
                                <div key={item.id} className="relative pl-6 md:pl-8">
                                    <div className={`absolute -left-[11px] top-4 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 shadow-sm
                                        ${item.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'} 
                                        ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                    ></div>

                                    <div className={`bg-white dark:bg-gray-800 border ${isCurrent ? 'border-blue-400 shadow-md' : 'border-gray-200 dark:border-gray-700 shadow-sm'} rounded-2xl p-4 md:p-5 transition-all`}>
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`font-bold ${isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {item.reminder_code}
                                                    </h4>
                                                    {index === 0 && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">ORIGINAL</span>}
                                                </div>
                                                <p className="text-xs text-gray-500">{moment(item.created_at).format("DD MMM YYYY, HH:mm")}</p>
                                            </div>
                                            <div>
                                                <Badge color={item.status === 'COMPLETED' ? 'success' : item.status === 'OVERDUE' ? 'error' : 'warning'}>{item.status}</Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Jatuh Tempo</p>
                                                <p className="text-sm font-semibold text-red-600">{moment(item.due_date).format("DD MMM YYYY")}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Biaya Tercatat</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {item.cost ? `Rp ${Number(item.cost).toLocaleString('id-ID')}` : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Dibuat Oleh</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.created_by_user?.nama_user}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Diselesaikan Oleh</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {item.status === 'COMPLETED' ? item.updated_by_user?.nama_user : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {item.attachment_path && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    Terdapat Lampiran Bukti
                                                </div>
                                                <button
                                                    onClick={() => downloadFile(item.attachment_path)}
                                                    className="text-sm px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium flex items-center gap-2 transition-colors w-fit"
                                                >
                                                    <Download className="w-4 h-4" /> Lihat Berkas
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ComponentCard>
        </div>
    );
}