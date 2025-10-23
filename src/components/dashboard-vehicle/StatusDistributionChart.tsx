"use client";
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export const StatusDistributionChart = ({ data }: { data: any[] }) => {
    const chartData = {
        labels: data.map(d => d.status),
        datasets: [{
            data: data.map(d => d.count),
            backgroundColor: ['#10b981', '#6b7280', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'],
            borderColor: '#ffffff',
            borderWidth: 2,
        }],
    };
    return <div className="bg-white dark:bg-gray-800 h-80 flex flex-col items-center">
        <div className="flex-grow flex items-center justify-center w-full max-w-[250px]">
            <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
    </div>
};