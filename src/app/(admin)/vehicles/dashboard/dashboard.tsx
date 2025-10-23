"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, Car, Users, Building, BarChart3 } from 'lucide-react';
import { endpointUrl, httpGet } from '@/../helpers';
import KeyMetrics from '@/components/dashboard-vehicle/KeyMetrics';
import DateRangePicker from '@/components/common/DateRangePicker';
import { StatusDistributionChart } from '@/components/dashboard-vehicle/StatusDistributionChart';
import { RequestTrendChart } from '@/components/dashboard-vehicle/RequestTrendChart';
import { TopDriverList } from '@/components/dashboard-vehicle/TopDriverList';
import { TopVehicleList } from '@/components/dashboard-vehicle/TopVehicleList';
import { TopVehicleTypeList } from '@/components/dashboard-vehicle/TopVehicleTypeList';
import BranchRequestChart from '@/components/dashboard-vehicle/BranchRequestChart';
import BranchVehicleChart from '@/components/dashboard-vehicle/BranchVehicleChart';
import BranchDriverChart from '@/components/dashboard-vehicle/BranchDriverChart';

import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";
interface VehicleKpiData {
    total_requests_in_range: number;
    pending_requests_count: number;
    most_requested_vehicle_type: string;
    top_requester: string;
}
interface VehicleChartData {
    request_trend: { date: string; count: number }[];
    status_distribution: { status: string; count: number }[];
    request_count_by_branch: { nama_cab: string; request_count: number }[];
    vehicle_count_by_branch: { nama_cab: string; vehicle_count: number }[];
    driver_count_by_branch: { nama_cab: string; driver_count: number }[];
}

interface VehicleRankingData {
    top_vehicle_types_requested: { name: string; request_count: number }[];
    top_vehicles_used: { name: string; license_plate: string; assignment_count: number }[];
    top_drivers_assigned: { name: string; assignment_count: number }[];
}

interface VehicleDashboardData {
    kpi: VehicleKpiData;
    charts: VehicleChartData;
    rankings: VehicleRankingData;
}

export default function VehicleDashboardPage() {
    const [dashboardData, setDashboardData] = useState<VehicleDashboardData | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false)
    const currentStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const currentEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    const getData = async () => {
        setIsLoading(true);
        setDashboardData(null);

        const params: any = {};
        if (currentStartDate) params.startDate = currentStartDate;
        if (currentEndDate) params.endDate = currentEndDate;

        try {
            const response = await httpGet(
                endpointUrl("/dashboard/vehicle-requests?" + new URLSearchParams(params).toString()),
                true
            );
            const responseData = response.data.data;
            setDashboardData(responseData);

        } catch (error) {
            console.error("Dashboard fetch error:", error);
            toast.error("Gagal memuat data dashboard.");
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
        router.push(`?${currentParams.toString()}`, { scroll: false });
    };


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Memuat data dashboard...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Dashboard Pengajuan Kendaraan</h1>
                        <p className="text-gray-600 mt-1">Ringkasan aktivitas peminjaman kendaraan</p>
                    </div>
                    <DateRangePicker
                        onDatesChange={handleDatesChange}
                        initialStartDate={currentStartDate}
                        initialEndDate={currentEndDate}
                    />
                </div>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center bg-white rounded-lg shadow-sm">
                    <div className="text-gray-400">
                        <Car className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-xl font-semibold">Tidak ada data</p>
                        <p className="text-sm mt-1">Tidak ada data pengajuan kendaraan untuk rentang tanggal yang dipilih.</p>
                    </div>
                </div>
            </div>
        );
    }

    const { kpi, charts, rankings } = dashboardData;

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Pengajuan Kendaraan</h1>
                    <p className="text-gray-600 mt-1">Ringkasan aktivitas peminjaman kendaraan</p>
                </div>
                <DateRangePicker
                    onDatesChange={handleDatesChange}
                    initialStartDate={currentStartDate}
                    initialEndDate={currentEndDate}
                />
            </div>

            <KeyMetrics data={kpi} />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Tren Pengajuan
                    </h3>
                    <RequestTrendChart data={charts.request_trend} />
                </div>
                <div className="xl:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm bg-white p-4 dark:border-gray-800 dark:bg-gray-900 min-h-[350px]"> {/* Added min-height */}
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Distribusi Status
                    </h3>
                    <StatusDistributionChart data={charts.status_distribution} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm bg-white p-4 dark:border-gray-800 dark:bg-gray-900 min-h-[350px]">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Pengajuan per Cabang
                    </h3>
                    <BranchRequestChart data={charts.request_count_by_branch} />
                </div>
                <div className=" h-full">
                    <TopVehicleTypeList
                        data={rankings.top_vehicle_types_requested}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className=" h-full">
                    <TopVehicleList
                        data={rankings.top_vehicles_used.map(v => ({ ...v, label: `${v.name} (${v.license_plate})` }))}
                    />
                </div>
                <div className=" h-full">
                    <TopDriverList
                        data={rankings.top_drivers_assigned}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm bg-white p-4 dark:border-gray-800 dark:bg-gray-900 min-h-[350px]">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Jumlah Kendaraan per Cabang
                    </h3>
                    <BranchVehicleChart data={charts.vehicle_count_by_branch} />
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm bg-white p-4 dark:border-gray-800 dark:bg-gray-900 min-h-[350px]">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Jumlah Supir per Cabang
                    </h3>
                    <BranchDriverChart data={charts.driver_count_by_branch} />
                </div>
            </div>
        </div>
    );
}
