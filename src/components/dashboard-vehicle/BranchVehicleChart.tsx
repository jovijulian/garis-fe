import React from 'react';
import { BarChart3, AlertTriangle, Car } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
interface ChartData {
    nama_cab: string;
    vehicle_count: number;
}

interface BranchVehicleChartProps {
    data: ChartData[];
}

const BranchVehicleChart: React.FC<BranchVehicleChartProps> = ({ data }) => {

    if (!data || data.length === 0) {
        return <NoDataMessage message="Tidak ada data kendaraan per cabang." />;
    }
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nama_cab" fontSize={10} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} fontSize={10} />
                <Tooltip wrapperStyle={{ fontSize: '12px' }} />
                <Legend verticalAlign="top" height={30} />
                <Bar dataKey="vehicle_count" name="Jumlah Kendaraan" fill="#3b82f6" barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );
};

const NoDataMessage: React.FC<{ message?: string }> = ({ message = "Tidak ada data untuk ditampilkan." }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p>{message}</p>
    </div>
);

export default BranchVehicleChart;