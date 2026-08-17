"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, ClipboardList } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";

import DateRangePicker from '@/components/common/DateRangePicker';
import ProjectKeyMetrics from '@/components/dashboard-project/ProjectKeyMetrics';
import ProjectTrendChart from '@/components/dashboard-project/ProjectTrendChart';
import ProjectStatusDistributionChart from '@/components/dashboard-project/ProjectStatusDistributionChart';
import TopDepartmentsList from '@/components/dashboard-project/TopDepartmentsList';

interface KpiData {
    total_requests_in_range: number;
    pending_requests_count: number;
    most_problematic_department: string;
    top_requester: string;
}

interface ChartData {
    request_trend: { date: string; count: number }[];
    status_distribution: { status: string; count: number }[];
}

interface RankingData {
    top_departments_requested: { department_name: string; request_count: number }[];
}

interface DashboardData {
    kpi: KpiData;
    charts: ChartData;
    rankings: RankingData;
}

export default function ProjectDashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const currentStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const currentEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    const getData = async () => {
        setIsLoading(true);
        const params: any = {};
        if (currentStartDate) params.startDate = currentStartDate;
        if (currentEndDate) params.endDate = currentEndDate;

        try {
            const response = await httpGet(
                endpointUrl("/dashboard/project-requests?" + new URLSearchParams(params).toString()),
                true
            );
            const responseData = response.data.data;
            setDashboardData(responseData);
        } catch (error) {
            toast.error("Gagal memuat data dashboard project request");
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
                    <p className="text-gray-600 dark:text-gray-400">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-500">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl">Tidak ada data project request untuk ditampilkan</p>
                </div>
            </div>
        );
    }

    const { kpi, charts, rankings } = dashboardData;

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Project Request</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Ringkasan pengajuan project dan perkembangannya</p>
                </div>
                <DateRangePicker
                    onDatesChange={handleDatesChange}
                    initialStartDate={currentStartDate}
                    initialEndDate={currentEndDate}
                />
            </div>

            <ProjectKeyMetrics data={kpi} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl shadow-sm border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Tren Pengajuan Project</h3>
                    <ProjectTrendChart data={charts.request_trend} />
                </div>
                <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Distribusi Status</h3>
                    <ProjectStatusDistributionChart data={charts.status_distribution} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <TopDepartmentsList
                    title="Top Departemen Pengaju"
                    subtitle="Berdasarkan jumlah pengajuan project request"
                    data={rankings.top_departments_requested.map(item => ({
                        name: item.department_name,
                        sub_info: "Total Pengajuan",
                        count: item.request_count
                    }))}
                />
            </div>
        </div>
    );
}