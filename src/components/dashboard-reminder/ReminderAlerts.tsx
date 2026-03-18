"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { endpointUrl, httpGet } from '@/../helpers';
import moment from 'moment';
import toast from 'react-hot-toast';

export interface AlertItem {
    id: number;
    title: string;
    module_name: string;
    cabang: string;
    due_date: string;
    status: string;
    days_left: number;
    severity: 'danger' | 'warning' | string;
    message: string;
}

export default function ReminderAlerts() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [markingId, setMarkingId] = useState<number | null>(null);

    const fetchAlerts = async () => {
        setIsLoading(true);
        try {
            const res = await httpGet(endpointUrl("dashboard/alert-reminder"), true);
            setAlerts(res.data.data || []);
        } catch (error) {
            console.error("Gagal memuat alert reminder", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleMarkComplete = async (id: number) => {
        try {
            setMarkingId(id);
            await httpGet(endpointUrl(`reminders/mark/${id}`), true);
            toast.success("Pengingat berhasil diselesaikan!");
            fetchAlerts();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menandai pengingat.");
        } finally {
            setMarkingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl mb-6"></div>
        );
    }

    if (alerts.length === 0) {
        return null; 
    }

    return (
        <div className="mb-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                Perhatian: Perlu Tindakan Segera ({alerts.length})
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-5">
                {alerts.map((alert) => {
                    const isDanger = alert.severity === 'danger';
                    const bgColor = isDanger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20';
                    const borderColor = isDanger ? 'border-red-200 dark:border-red-800/50' : 'border-yellow-200 dark:border-yellow-800/50';
                    const textColor = isDanger ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100';
                    const mutedTextColor = isDanger ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300';
                    const buttonClass = isDanger 
                        ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500';

                    return (
                        <div 
                            key={alert.id} 
                            className={`relative overflow-hidden rounded-2xl border ${borderColor} ${bgColor} p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isDanger ? 'bg-red-500' : 'bg-yellow-500'}`}></div>

                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2.5 py-1 border border-gray-600 rounded-md text-xs font-bold uppercase tracking-wider bg-white/60 dark:bg-black/20 ${textColor}`}>
                                        {alert.module_name}
                                    </span>
                                    <span className={`text-sm font-bold flex items-center gap-1.5 ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                        <Clock className="w-4 h-4" />
                                        {alert.message}
                                    </span>
                                </div>
                                
                                <h3 className={`font-bold text-lg mb-2 leading-tight ${textColor}`}>
                                    {alert.title}
                                </h3>
                                
                                <div className={`text-sm flex flex-col gap-1.5 mt-3 ${mutedTextColor}`}>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 opacity-70" /> 
                                        <span>Jatuh Tempo: <strong>{moment(alert.due_date).format("DD/MM/YYYY")}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 opacity-70" /> 
                                        <span>Cabang: <strong>{alert.cabang || "-"}</strong></span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex justify-end">
                                <button
                                    onClick={() => handleMarkComplete(alert.id)}
                                    disabled={markingId === alert.id}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed ${buttonClass}`}
                                >
                                    {markingId === alert.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    {markingId === alert.id ? "Memproses..." : "Tandai Selesai"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}