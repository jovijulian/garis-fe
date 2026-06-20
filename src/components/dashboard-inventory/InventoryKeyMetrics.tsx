import { Package, AlertTriangle, UserCheck, Activity } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation'; 

const InventoryKeyMetrics = ({ data }: { data: any }) => {
    const metrics = [
        { 
            icon: Package, 
            label: "Total Master Barang", 
            value: data.total_inventory_items, 
            color: "blue",
            href: "/inventory/items" 
        },
        { 
            icon: AlertTriangle, 
            label: "Stok Kritis / Habis", 
            value: data.low_stock_items, 
            color: "red",
        },
        { 
            icon: UserCheck, 
            label: "Peminjaman Aktif", 
            value: data.total_active_loans, 
            color: "orange",
            href: "/inventory/returns" 
        },
        { 
            icon: Activity, 
            label: "Transaksi Hari Ini", 
            value: data.todays_transactions, 
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

const MetricCard = ({ icon: Icon, label, value, color, href }: any) => {
    const router = useRouter();
    const isClickable = !!href;

    return (
        <div 
            onClick={isClickable ? () => router.push(href) : undefined} 
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm 
            ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : ''}`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 mb-4`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
        </div>
    );
};

export default InventoryKeyMetrics;