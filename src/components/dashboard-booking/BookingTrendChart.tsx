"use client";
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const BookingTrendChart = ({ data }: { data: any[] }) => {
    const chartData = {
        labels: data.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
        datasets: [{
            label: 'Jumlah Booking',
            data: data.map(d => d.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
        }],
    };
    return <div className="h-72"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>;
};