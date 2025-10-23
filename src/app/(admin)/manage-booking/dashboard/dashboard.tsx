"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';

import KeyMetrics from '@/components/dashboard-booking/KeyMetrics';
import DateRangePicker from '@/components/common/DateRangePicker';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";
import BookingCalendar from '@/components/calendar/BookingCalendar';
import { StatusDistributionChart } from '@/components/dashboard-booking/StatusDistributionChart';
import { BookingTrendChart } from '@/components/dashboard-booking/BookingTrendChart';
import { RoomUtilizationChart } from '@/components/dashboard-booking/RoomUtilizationChart';
import { TopTopicsList } from '@/components/dashboard-booking/TopTopicsList';
import { TopAmenitiesList } from '@/components/dashboard-booking/TopAmenitiesList';


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

    const { kpi, charts, rankings } = dashboardData;
    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
            {/* Header dengan Judul dan Date Range Picker */}
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

            <KeyMetrics data={kpi} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-9">
                    <BookingCalendar />
                </div>

                <div className="xl:col-span-3">
                    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 h-full">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Status Booking
                        </h3>
                        <StatusDistributionChart data={rankings.status_distribution} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-6">
                    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Tren Booking
                        </h3>
                        <BookingTrendChart data={charts.booking_trend} />
                    </div>
                </div>

                <div className="xl:col-span-6">
                    <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Top 5 Ruangan Digunakan
                        </h3>
                        <RoomUtilizationChart data={charts.room_utilization} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-6">
                    <div className="h-full">
                        <TopTopicsList data={rankings.top_topics} />
                    </div>
                </div>

                <div className="xl:col-span-6">
                    <div className="h-full">
                        <TopAmenitiesList data={rankings.top_amenities} />
                    </div>
                </div>
            </div>

        </div>
    );
}