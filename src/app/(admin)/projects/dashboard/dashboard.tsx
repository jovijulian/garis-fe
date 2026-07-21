"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';

import KeyMetrics from '@/components/dashboard-order/KeyMetrics';
import DateRangePicker from '@/components/common/DateRangePicker';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";
import BookingCalendar from '@/components/calendar/BookingCalendar';
import { StatusDistributionChart } from '@/components/dashboard-order/StatusDistributionChart';
import { OrderTrendChart } from '@/components/dashboard-order/OrderTrendChart';
import { TopOrdersList } from '@/components/dashboard-order/TopOrdersList';


interface KpiData {
    total_orders_in_range: number;
    pending_orders_count: number;
    most_popular_consumption_type: string;
    top_requester: string;
}
interface ChartData {
    order_trend: { date: string; count: string }[];
}
interface RankingData {
    status_distribution: { status: string; count: string }[];
    top_consumption_types: { name: string; order_count: string }[];
}
interface DashboardData {
    kpi: KpiData;
    charts: ChartData;
    rankings: RankingData;
}

export default function OrderDashboardPage() {
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
                endpointUrl("/dashboard/orders?" + new URLSearchParams(params).toString()),
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
        // getData();
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

        </div>
    );
}