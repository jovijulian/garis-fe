// file: app/dashboard/page.tsx
"use client";
import { Metadata } from "next";
import React, { useEffect, useState } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TransactionTrendChart } from "@/components/dashboard/TransactionTrendChart";
import { PopularServicesChart } from "@/components/dashboard/PopularServicesChart";
import { CustomerLeaderboard } from "@/components/dashboard/CustomerLeaderboard";
import { MechanicLeaderboard } from "@/components/dashboard/MechanicLeaderboard";
import { useRouter, useSearchParams } from "next/navigation";
import DateRangePicker from "@/components/common/DateRangePicker";
import { endpointUrl, httpGet, httpPost } from "@/../helpers";
import toast from "react-hot-toast";
import moment from "moment";



export const metadata: Metadata = {
    title: "Dashboard | GARIS PT. Cisangkan",
};

export default function Dashboard() {
    const searchParams = useSearchParams();
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const currentStartDate = searchParams.get("start_date") || moment().startOf('month').format("YYYY-MM-DD");
    const currentEndDate = searchParams.get("end_date") || moment().endOf('month').format("YYYY-MM-DD");

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Bagian Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Dashboard </h1>
                </div>

            </div>

        </div>
    );
}