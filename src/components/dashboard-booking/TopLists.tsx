import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopLists = ({ data }: { data: any }) => {
    const doughnutData = {
        labels: data.status_distribution.map((d: any) => d.status),
        datasets: [{
            data: data.status_distribution.map((d: any) => d.count),
            backgroundColor: ['#10b981', '#6b7280', '#ef4444', '#f59e0b'], // Approved, Submit, Rejected, Canceled
        }],
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow h-80 flex flex-col items-center">
                <h3 className="font-semibold w-full">Distribusi Status</h3>
                <div className="flex-grow flex items-center justify-center w-full max-w-[250px]">
                    <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
                <h3 className="font-semibold mb-4">Top 5 Topik Meeting</h3>
                <ul className="space-y-3">
                    {data.top_topics.map((item: any, index: number) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                            <span>{index + 1}. {item.name}</span>
                            <span className="font-bold">{item.booking_count} kali</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
                <h3 className="font-semibold mb-4">Top 5 Fasilitas Dipesan</h3>
                <ul className="space-y-3">
                    {data.top_amenities.map((item: any, index: number) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                            <span>{index + 1}. {item.name}</span>
                            <span className="font-bold">{item.request_count} kali</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TopLists;