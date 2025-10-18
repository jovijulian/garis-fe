// components/order/BookingCard.tsx

import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, Clock, Edit, Trash2, Building, CheckCircle, XCircle, Hourglass, Info, Pin, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
interface VehicleRequest {
    id: number;
    purpose: string;
    destination: string;
    passenger_count: number;
    start_time: string;
    end_time: string;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress';
    cabang: { id_cab: number; nama_cab: string; };
    vehicle_type: { id: number; name: string; } | null;
    pickup_location_text: string | null;
}

interface VehicleRequestCardProps {
    vehicleRequest: VehicleRequest;
    onEdit: () => void;
    onDelete: () => void;
}

const statusConfig = {
    Submit: {
        label: 'Submit',
        icon: <Hourglass className="w-4 h-4 text-yellow-600" />,
        style: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    Approved: {
        label: 'Disetujui',
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        style: 'bg-green-100 text-green-800 border-green-300',
    },
    Rejected: {
        label: 'Ditolak',
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        style: 'bg-red-100 text-red-800 border-red-300',
    },
    Canceled: {
        label: 'Dibatalkan',
        icon: <Info className="w-4 h-4 text-gray-600" />,
        style: 'bg-gray-200 text-gray-800 border-gray-300',
    },
    "In Progress": {
        label: 'Dalam Proses',
        icon: <Clock className="w-4 h-4 text-blue-600" />,
        style: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    Completed: {
        label: 'Selesai',
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        style: 'bg-green-100 text-green-800 border-green-300',
    },
};

const VehicleRequestCard: React.FC<VehicleRequestCardProps> = ({ vehicleRequest, onEdit, onDelete }) => {
    moment.locale('id');
    const { label, icon, style } = statusConfig[vehicleRequest.status];
    const canBeModified = vehicleRequest.status === 'Submit';
    const location = vehicleRequest.pickup_location_text || vehicleRequest.cabang?.nama_cab || 'Lokasi tidak diset';
    return (

        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
            <Link
                href={`/vehicles/my-requests/${vehicleRequest.id}`}
                className="block h-full group"
            >
                <div className="p-5 flex-grow">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
                        {icon}
                        <span>{label}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 truncate">{vehicleRequest.purpose}</h3>
                    <p className="text-sm text-gray-600 truncate" title={vehicleRequest.destination}>
                        Tujuan: {vehicleRequest.destination}
                    </p>

                    <div className="border-t border-gray-100 my-4"></div>

                    <div className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>Jemput: {location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{moment(vehicleRequest.start_time).format('DD MMM YYYY, HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{vehicleRequest.passenger_count} Penumpang</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Tombol Aksi */}
            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
                <button
                    onClick={onDelete}
                    disabled={!canBeModified}
                    title={canBeModified ? "Batalkan Pengajuan" : "Tidak dapat dibatalkan"}
                    className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onEdit}
                    disabled={!canBeModified}
                    title={canBeModified ? "Ubah Pengajuan" : "Tidak dapat diubah"}
                    className="p-2 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <Edit className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default VehicleRequestCard;