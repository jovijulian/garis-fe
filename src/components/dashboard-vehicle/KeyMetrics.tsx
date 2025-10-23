"use client";
import { CarFront, ClipboardList, Clock, BarChart3, Crown } from "lucide-react";
import React from 'react';
import { useRouter } from 'next/navigation'; 

const KeyMetrics = ({ data }: { data: any }) => {
    const metrics = [
        { 
            icon: ClipboardList, 
            label: "Total Pengajuan Kendaraan", 
            value: data.total_requests_in_range, 
            color: "blue" 
        },
        { 
            icon: Clock, 
            label: "Menunggu Persetujuan", 
            value: data.pending_requests_count, 
            color: "yellow",
            href: "/vehicles/manage-requests" 
        },
        { 
            icon: CarFront, 
            label: "Jenis Kendaraan Terpopuler", 
            value: data.most_requested_vehicle_type, 
            color: "green" 
        },
        { 
            icon: Crown, 
            label: "Pemesan Terbanyak", 
            value: data.top_requester, 
            color: "purple" 
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => (
                <MetricCard
                    key={metric.label}
                    icon={metric.icon}
                    label={metric.label}
                    value={metric.value}
                    color={metric.color}
                    href={metric.href} 
                />
            ))}
        </div>
    );
};


const MetricCard = ({ icon: Icon, label, value, color, href }: any) => {
    const router = useRouter();

    const isClickable = !!href;

    const handleClick = () => {
        if (href) {
            router.push(href);
        }
    };

    return (
        <div 
            onClick={isClickable ? handleClick : undefined} 
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow 
            ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all' : ''}`}
        >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100 text-${color}-600`}>
                <Icon size={24} />
            </div>
            <p className="text-sm text-gray-500 mt-4">{label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white truncate">{value}</p>
        </div>
    );
};

export default KeyMetrics;