import { BarChart, Clock, School, Pin } from 'lucide-react';
import React from 'react';

const KeyMetrics = ({ data }: { data: any }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={BarChart} label="Total Booking" value={data.total_bookings_this_month} color="blue" />
        <MetricCard icon={Clock} label="Menunggu Persetujuan" value={data.pending_bookings_count} color="yellow" />
        <MetricCard icon={School} label="Ruangan Terpopuler" value={data.most_popular_room} color="green" />
        <MetricCard icon={Pin} label="Topik Teratas" value={data.most_popular_topic} color="purple" />
    </div>
);

const MetricCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100 text-${color}-600`}>
            <Icon size={24} />
        </div>
        <p className="text-sm text-gray-500 mt-4">{label}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-white truncate">{value}</p>
    </div>
);

export default KeyMetrics;