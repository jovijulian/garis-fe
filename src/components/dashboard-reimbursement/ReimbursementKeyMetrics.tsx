import React from 'react';
import { Receipt, Clock, MapPin, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ReimbursementKpiData {
    total_reimbursements_in_range: number;
    pending_reimbursements_count: number;
    most_frequent_destination: string;
    top_requester: string;
}

const colorClasses: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        darkBg: "dark:bg-blue-900/30",
        darkText: "dark:text-blue-400"
    },
    orange: {
        bg: "bg-orange-100",
        text: "text-orange-600",
        darkBg: "dark:bg-orange-900/30",
        darkText: "dark:text-orange-400"
    },
    emerald: {
        bg: "bg-emerald-100",
        text: "text-emerald-600",
        darkBg: "dark:bg-emerald-900/30",
        darkText: "dark:text-emerald-400"
    },
    purple: {
        bg: "bg-purple-100",
        text: "text-purple-600",
        darkBg: "dark:bg-purple-900/30",
        darkText: "dark:text-purple-400"
    }
};

const MetricCard = ({ icon: Icon, label, value, color, href }: { icon: any; label: string; value: string | number; color: string; href?: string }) => {
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

export const ReimbursementKeyMetrics = ({ data }: { data: ReimbursementKpiData }) => {
    const metrics = [
        {
            icon: Receipt,
            label: "Total Pengajuan",
            value: data.total_reimbursements_in_range ?? 0,
            color: "blue",
            href: "/reimbursements/manage-request"
        },
        {
            icon: Clock,
            label: "Menunggu Persetujuan",
            value: data.pending_reimbursements_count ?? 0,
            color: "orange",
            href: "/reimbursements/manage-request"
        },
        {
            icon: MapPin,
            label: "Destinasi Paling Sering",
            value: data.most_frequent_destination || "-",
            color: "emerald",
        },
        {
            icon: User,
            label: "Requester Teraktif",
            value: data.top_requester || "-",
            color: "purple"
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

export default ReimbursementKeyMetrics;
