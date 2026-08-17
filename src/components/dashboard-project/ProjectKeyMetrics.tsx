import { FileText, Clock, Building2, User } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';

const ProjectKeyMetrics = ({ data }: { data: any }) => {
    const metrics = [
        {
            icon: FileText,
            label: "Total Pengajuan",
            value: data.total_requests_in_range,
            color: "blue",
            href: "/projects/manage-request"
        },
        {
            icon: Clock,
            label: "Menunggu Persetujuan",
            value: data.pending_requests_count,
            color: "orange",
            href: "/projects/manage-request"
        },
        {
            icon: Building2,
            label: "Departemen Terbanyak Mengajukan",
            value: data.most_problematic_department || "-",
            color: "red",
        },
        {
            icon: User,
            label: "Requester Teraktif",
            value: data.top_requester || "-",
            color: "green"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
            ))}
        </div>
    );
};

const colorClasses: Record<string, { bg: string, text: string, darkBg: string, darkText: string }> = {
    blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        darkBg: "dark:bg-blue-900/30",
        darkText: "dark:text-blue-400"
    },
    red: {
        bg: "bg-red-100",
        text: "text-red-600",
        darkBg: "dark:bg-red-900/30",
        darkText: "dark:text-red-400"
    },
    orange: {
        bg: "bg-orange-100",
        text: "text-orange-600",
        darkBg: "dark:bg-orange-900/30",
        darkText: "dark:text-orange-400"
    },
    green: {
        bg: "bg-green-100",
        text: "text-green-600",
        darkBg: "dark:bg-green-900/30",
        darkText: "dark:text-green-400"
    }
};

const MetricCard = ({ icon: Icon, label, value, color, href }: any) => {
    const router = useRouter();
    const isClickable = !!href;
    const colors = colorClasses[color] || colorClasses.blue;

    return (
        <div
            onClick={isClickable ? () => router.push(href) : undefined}
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm
            ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : ''}`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg} ${colors.darkBg} ${colors.text} ${colors.darkText} mb-4`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white mt-1 break-words leading-tight">{value}</p>
        </div>
    );
};

export default ProjectKeyMetrics;
