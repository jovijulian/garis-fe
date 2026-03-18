"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";

import ReminderAlerts from '@/components/dashboard-reminder/ReminderAlerts';


export default function OrderDashboardPage() {
    const [dashboardData, setDashboardData] = useState<any | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false);
    const currentStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const currentEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    const getData = async () => {
        setIsLoading(true);



        try {
            const response = await httpGet(
                endpointUrl("/dashboard/alert-reminder"),
                true
            );
            const responseData = response.data.data;
            setDashboardData(responseData);

        } catch (error) {
            toast.error("Failed to fetch data");
            setDashboardData(null);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        getData();
    }, [searchParams]);



    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-50">
                <div className="text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl">Tidak ada data untuk ditampilkan</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Pengingat</h1>
                    <p className="text-gray-600 mt-1">
                        Pantau pengingat penting yang memerlukan perhatian segera.
                    </p>
                </div>
            </div>
            <ReminderAlerts />


        </div>
    );
}