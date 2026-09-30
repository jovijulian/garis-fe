"use client";
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export interface TrendItem {
    date: string;
    count: number;
    total_amount: string | number;
}

export const ReimbursementTrendChart = ({ data }: { data: TrendItem[] }) => {
    const [activeTab, setActiveTab] = useState<'count' | 'amount'>('count');

    const labels = (data || []).map(d => {
        try {
            return new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        } catch {
            return d.date;
        }
    });

    const isCount = activeTab === 'count';

    const counts = (data || []).map(d => Number(d.count) || 0);
    const amounts = (data || []).map(d => {
        const val = typeof d.total_amount === 'string' ? parseFloat(d.total_amount) : d.total_amount;
        return isNaN(val) ? 0 : val;
    });

    const totalCount = counts.reduce((acc, curr) => acc + curr, 0);
    const totalAmount = amounts.reduce((acc, curr) => acc + curr, 0);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: isCount ? 'Jumlah Pengajuan' : 'Total Biaya',
                data: isCount ? counts : amounts,
                borderColor: isCount ? '#3b82f6' : '#10b981',
                backgroundColor: isCount ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: isCount ? '#3b82f6' : '#10b981',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Total Periode:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        {isCount
                            ? `${totalCount} Pengajuan`
                            : `Rp ${totalAmount.toLocaleString('id-ID')}`}
                    </span>
                </div>

                <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('count')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            isCount
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Jumlah Pengajuan
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('amount')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            !isCount
                                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Total Nominal (Rp)
                    </button>
                </div>
            </div>

            <div className="h-72 w-full">
                <Line
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const raw = Number(context.raw) || 0;
                                        if (isCount) {
                                            return ` Jumlah: ${raw} Pengajuan`;
                                        }
                                        return ` Total: Rp ${raw.toLocaleString('id-ID')}`;
                                    },
                                    afterLabel: (context) => {
                                        const index = context.dataIndex;
                                        if (isCount) {
                                            const amt = amounts[index] || 0;
                                            return `Nominal: Rp ${amt.toLocaleString('id-ID')}`;
                                        } else {
                                            const cnt = counts[index] || 0;
                                            return `Pengajuan: ${cnt} klaim`;
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                ticks: {
                                    precision: isCount ? 0 : undefined,
                                    callback: (value) => {
                                        const num = Number(value);
                                        if (isCount) return num;
                                        if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}Jt`;
                                        if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}Rb`;
                                        return `Rp ${num}`;
                                    }
                                }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ReimbursementTrendChart;
