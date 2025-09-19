"use client";
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement);

export const RoomUtilizationChart = ({ data }: { data: any[] }) => {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [{
            label: 'Jumlah Digunakan',
            data: data.map(d => d.booking_count),
            backgroundColor: '#10b981',
        }],
    };
    return <div className="h-72"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' }} /></div>;
};