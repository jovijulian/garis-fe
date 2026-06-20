"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, PackageSearch } from 'lucide-react';
import { endpointUrl, httpGet } from '../../../../../helpers'; 
import moment from 'moment';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";

import DateRangePicker from '@/components/common/DateRangePicker';
import InventoryKeyMetrics from '@/components/dashboard-inventory/InventoryKeyMetrics'; 
import { InventoryTrendChart } from '@/components/dashboard-inventory/InventoryTrendChart';
import { ActiveLoansTable } from '@/components/dashboard-inventory/ActiveLoansTable';
import { TopInventoryList } from '@/components/dashboard-inventory/TopInventoryList';

interface KpiData {
    total_inventory_items: number;
    low_stock_items: number;
    total_active_loans: number;
    todays_transactions: number;
}
interface ChartData {
    transaction_trend: { date: string; count: number }[];
}
interface RankingData {
    top_requested_items: { item_name: string; total_qty_requested: number; request_count: number }[];
    top_borrowers: { borrower_name: string; transaction_count: number }[];
}
interface ActiveLoan {
    id: number;
    item_name: string;
    barcode: string;
    borrower_name: string;
    qty_borrowed: number;
    qty_returned: number;
    qty_remaining: number;
    unit: string;
    borrowed_at: string;
    days_borrowed: number;
    status: string;
}
interface DashboardData {
    kpi: KpiData;
    active_loans: ActiveLoan[];
    charts: ChartData;
    rankings: RankingData;
}

export default function InventoryDashboardPage() {
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
                endpointUrl("/dashboard/inventories?" + new URLSearchParams(params).toString()),
                true
            );
            const responseData = response.data.data;
            setDashboardData(responseData);
        } catch (error) {
            toast.error("Gagal memuat data dashboard inventaris");
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
                    <PackageSearch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl">Tidak ada data inventaris untuk ditampilkan</p>
                </div>
            </div>
        );
    }

    const { kpi, charts, rankings, active_loans } = dashboardData;

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Inventaris</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Ringkasan aktivitas barang, aset, dan peminjaman</p>
                </div>
                <DateRangePicker
                    onDatesChange={handleDatesChange}
                    initialStartDate={currentStartDate}
                    initialEndDate={currentEndDate}
                />
            </div>

            <InventoryKeyMetrics data={kpi} />

            <div className="grid grid-cols-1 gap-6">
                <div className="rounded-2xl shadow-sm border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Tren Transaksi Barang Keluar</h3>
                    <InventoryTrendChart data={charts.transaction_trend} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <ActiveLoansTable data={active_loans} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-full">
                    <TopInventoryList
                        title="Top Barang Sering Diminta"
                        subtitle="Berdasarkan jumlah transaksi permintaan"
                        data={rankings.top_requested_items.map(item => ({
                            name: item.item_name,
                            sub_info: `${item.total_qty_requested} Pcs dikeluarkan`,
                            count: item.request_count
                        }))}
                    />
                </div>
                <div className="h-full">
                    <TopInventoryList
                        title="Top Karyawan Teraktif"
                        subtitle="Karyawan yang paling banyak meminta/meminjam"
                        iconType="users"
                        data={rankings.top_borrowers.map(user => ({
                            name: user.borrower_name,
                            sub_info: "Total Transaksi",
                            count: user.transaction_count
                        }))}
                    />
                </div>
            </div>
        </div>
    );
}