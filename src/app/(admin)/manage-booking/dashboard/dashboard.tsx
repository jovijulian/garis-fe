"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';

// Impor komponen-komponen baru kita
import KeyMetrics from '@/components/dashboard-booking/KeyMetrics';
import Charts from '@/components/dashboard-booking/Charts';
import TopLists from '@/components/dashboard-booking/TopLists';
import FilterComponent from '@/components/common/FilterComponent'; // Komponen Anda
import DateRangePicker from '@/components/common/DateRangePicker';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";

// --- Definisikan interface sesuai respons BE ---
interface KpiData {
    total_bookings_this_month: number;
    pending_bookings_count: number;
    most_popular_room: string;
    most_popular_topic: string;
}
interface ChartData {
    booking_trend: { date: string; count: string }[];
    room_utilization: { name: string; booking_count: string }[];
}
interface RankingData {
    status_distribution: { status: string; count: string }[];
    top_topics: { name: string; booking_count: string }[];
    top_amenities: { name: string; request_count: string }[];
}
interface DashboardData {
    kpi: KpiData;
    charts: ChartData;
    rankings: RankingData;
}

export default function BookingDashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false);
    const currentStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const currentEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    const getData = async () => {
        setIsLoading(true);

        const params: any = {
        };
        if (currentStartDate) params.startDate = currentStartDate;
        if (currentEndDate) params.endDate = currentEndDate;

        try {
            const response = await httpGet(
                endpointUrl("/dashboard?" + new URLSearchParams(params).toString()),
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

    const handleDatesChange = (dates: { startDate: string | null; endDate: string | null }) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

        if (dates.startDate) {
            currentParams.set("start_date", dates.startDate);
        } else {
            currentParams.delete("start_date");
        }
        if (dates.endDate) {
            currentParams.set("end_date", dates.endDate);
        } else {
            currentParams.delete("end_date");
        }
        router.push(`?${currentParams.toString()}`);
    };
    
   
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
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Booking</h1>
                    <p className="text-gray-600 mt-1">Ringkasan aktivitas peminjaman ruangan</p>
                </div>
                <DateRangePicker
                    onDatesChange={handleDatesChange}
                    initialStartDate={searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD")}
                    initialEndDate={searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD")}
                />
            </div>

            <KeyMetrics data={dashboardData?.kpi} />
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Charts data={dashboardData?.charts} />
                </div>
                <div className="lg:col-span-2">
                    <TopLists data={dashboardData?.rankings} />
                </div>
            </div>
        </div>
    );
}