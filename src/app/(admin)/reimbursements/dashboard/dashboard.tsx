"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, ReceiptText } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";

import DateRangePicker from '@/components/common/DateRangePicker';
import {
    ReimbursementKeyMetrics,
    ReimbursementTrendChart,
    ReimbursementStatusDistributionChart,
    TopClaimedItemsList,
    TopDestinationsList
} from '@/components/dashboard-reimbursement';

interface KpiData {
    total_reimbursements_in_range: number;
    pending_reimbursements_count: number;
    most_frequent_destination: string;
    top_requester: string;
}

interface ReimbursementTrendItem {
    date: string;
    count: number;
    total_amount: string | number;
}

interface StatusDistributionItem {
    status: string;
    count: number;
}

interface ChartData {
    reimbursement_trend: ReimbursementTrendItem[];
    status_distribution: StatusDistributionItem[];
}

interface TopClaimedItem {
    item_name: string;
    claim_count: number;
    total_amount: string | number;
}

interface TopDestinationItem {
    destination: string;
    visit_count: number;
}

interface RankingData {
    top_claimed_items: TopClaimedItem[];
    top_destinations: TopDestinationItem[];
}

interface DashboardData {
    kpi: KpiData;
    charts: ChartData;
    rankings: RankingData;
}

export default function ReimbursementDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const currentStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const currentEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    const getData = async () => {
        setIsLoading(true);
        const params: Record<string, string> = {};
        if (currentStartDate) params.startDate = currentStartDate;
        if (currentEndDate) params.endDate = currentEndDate;

        try {
            const response = await httpGet(
                endpointUrl("/dashboard/reimbursements?" + new URLSearchParams(params).toString()),
                true
            );
            const responseData = response.data?.data;
            setDashboardData(responseData);
        } catch (error) {
            toast.error("Gagal memuat data dashboard reimbursement");
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
        if (dates.startDate) currentParams.set("start_date", dates.startDate);
        else currentParams.delete("start_date");

        if (dates.endDate) currentParams.set("end_date", dates.endDate);
        else currentParams.delete("end_date");

        router.push(`?${currentParams.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Memuat data dashboard reimbursement...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-500">
                    <ReceiptText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl">Tidak ada data reimbursement untuk ditampilkan</p>
                </div>
            </div>
        );
    }

    const { kpi, charts, rankings } = dashboardData;

    return (
        <div className="p-4 md:p-6 space-y-6 min-h-screen">
            {/* Header & Date Filter */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Reimbursement</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Ringkasan pengajuan klaim reimbursement dan perkembangannya
                    </p>
                </div>
                <DateRangePicker
                    onDatesChange={handleDatesChange}
                    initialStartDate={currentStartDate}
                    initialEndDate={currentEndDate}
                />
            </div>

            {/* KPI Summary Cards */}
            <ReimbursementKeyMetrics data={kpi} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl shadow-sm border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        Tren Pengajuan Reimbursement
                    </h3>
                    <ReimbursementTrendChart data={charts.reimbursement_trend} />
                </div>
                <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Distribusi Status
                    </h3>
                    <ReimbursementStatusDistributionChart data={charts.status_distribution} />
                </div>
            </div>

            {/* Rankings Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopClaimedItemsList data={rankings.top_claimed_items} />
                <TopDestinationsList data={rankings.top_destinations} />
            </div>
        </div>
    );
}