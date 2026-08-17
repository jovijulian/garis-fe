"use client";
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const statusLabels: Record<string, string> = {
    WAITING_APPROVAL: "Waiting Approval",
    WAITING_GA: "Waiting GA",
    IN_PROGRESS: "In Progress",
    WAITING_VERIFICATION: "Waiting Verification",
    REVISION: "Revision",
    CLOSED: "Closed",
    REJECTED: "Rejected"
};

const statusColors: Record<string, string> = {
    WAITING_APPROVAL: "#f59e0b", // Amber
    WAITING_GA: "#3b82f6",       // Blue
    IN_PROGRESS: "#6366f1",      // Indigo
    WAITING_VERIFICATION: "#a855f7", // Purple
    REVISION: "#f97316",         // Orange
    CLOSED: "#10b981",           // Emerald/Green
    REJECTED: "#f43f5e"          // Rose/Red
};

const defaultColor = "#6b7280"; // Gray

export const ProjectStatusDistributionChart = ({ data }: { data: { status: string, count: number }[] }) => {
    const labels = data.map(d => statusLabels[d.status] || d.status);
    const counts = data.map(d => d.count);
    const colors = data.map(d => statusColors[d.status] || defaultColor);

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
        <div className="bg-white dark:bg-gray-800 h-80 flex flex-col items-center">
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
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ProjectStatusDistributionChart;
