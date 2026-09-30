"use client";
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export interface StatusDistributionItem {
    status: string;
    count: number;
}

const statusLabels: Record<string, string> = {
    WAITING_MANAGER: "Menunggu Manager",
    WAITING_GA: "Menunggu GA",
    WAITING_APPROVAL: "Menunggu Persetujuan",
    IN_PROGRESS: "Dalam Proses",
    REVISION: "Revisi",
    CLOSED: "Closed / Selesai",
    REJECTED: "Ditolak"
};

const statusColors: Record<string, string> = {
    WAITING_MANAGER: "#f59e0b", // Amber
    WAITING_GA: "#3b82f6",      // Blue
    WAITING_APPROVAL: "#f97316", // Orange
    IN_PROGRESS: "#6366f1",     // Indigo
    REVISION: "#eab308",        // Yellow
    CLOSED: "#10b981",          // Emerald
    REJECTED: "#f43f5e"         // Rose
};

const defaultColor = "#6b7280";

export const ReimbursementStatusDistributionChart = ({ data }: { data: StatusDistributionItem[] }) => {
    const validData = (data || []).filter(d => (d.count || 0) > 0);

    if (validData.length === 0) {
        return (
            <div className="h-80 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <p className="text-sm">Belum ada data status</p>
            </div>
        );
    }

    const labels = validData.map(d => statusLabels[d.status] || d.status);
    const counts = validData.map(d => d.count);
    const colors = validData.map(d => statusColors[d.status] || defaultColor);

    const chartData = {
        labels: labels,
        datasets: [{
            data: counts,
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2,
        }],
    };

    return (
        <div className="bg-white dark:bg-gray-800 h-80 flex flex-col items-center justify-center">
            <div className="flex-grow flex items-center justify-center w-full max-w-[280px]">
                <Doughnut
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    padding: 10,
                                    font: {
                                        size: 11
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const label = context.label || '';
                                        const value = context.parsed || 0;
                                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                                        return ` ${label}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ReimbursementStatusDistributionChart;
