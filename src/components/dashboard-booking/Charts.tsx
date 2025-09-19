import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Charts = ({ data }: { data: any }) => {
    const lineChartData = {
        labels: data.booking_trend.map((d: any) => new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
        datasets: [{
            label: 'Jumlah Booking',
            data: data.booking_trend.map((d: any) => d.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
        }],
    };

    const barChartData = {
        labels: data.room_utilization.map((d: any) => d.name),
        datasets: [{
            label: 'Jumlah Digunakan',
            data: data.room_utilization.map((d: any) => d.booking_count),
            backgroundColor: '#10b981',
        }],
    };

    const options = { responsive: true, maintainAspectRatio: false };

    return (
        <div className="space-y-6">
            {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow h-80">
                <h3 className="font-semibold mb-4">Tren Booking</h3>
                <Line data={lineChartData} options={options} />
            </div> */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 lg:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold mb-4">Tren Booking</h3>
                </div>
                <div className="h-70 w-full flex justify-center">
                <Line data={lineChartData} options={options} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 lg:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold mb-4">Top 5 Ruangan Digunakan</h3>
                </div>
                <div className="h-70 w-full flex justify-center">
                <Bar data={barChartData} options={{...options, indexAxis: 'y' as const}} />
                </div>
            </div>
            {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow h-80">
                <h3 className="font-semibold mb-4">Top 5 Ruangan Digunakan</h3>
                <Bar data={barChartData} options={{...options, indexAxis: 'y' as const}} />
            </div> */}
        </div>
    );
};

export default Charts;