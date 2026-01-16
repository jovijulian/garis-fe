// components/order/BookingCard.tsx

import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, Clock, Edit, Trash2, Building, CheckCircle, XCircle, Hourglass, Info, Pin, Users, Bus, MapPin, Flag } from 'lucide-react';
import Link from 'next/link';
interface Transport {
    id: number;
    purpose: string
    date: string;
    time: string;
    origin: string;
    destination: string;
    transport_type: {
        id: number;
        name: string;
    }
    total_pax: number;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
}

interface OrderCardProps {
    transport: Transport;
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
        label: 'Approved',
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        style: 'bg-green-100 text-green-800 border-green-300',
    },
    Rejected: {
        label: 'Rejected',
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        style: 'bg-red-100 text-red-800 border-red-300',
    },
    Canceled: {
        label: 'Canceled',
        icon: <Info className="w-4 h-4 text-gray-600" />,
        style: 'bg-gray-200 text-gray-800 border-gray-300',
    },
};

const OrderCard: React.FC<OrderCardProps> = ({ transport, onEdit, onDelete }) => {
    moment.locale('id');
    const { label, icon, style } = statusConfig[transport.status];
    const canBeModified = transport.status === 'Submit';

    return (

        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
            <Link
                href={`/orders/my-orders/transport/${transport.id}`}
                className="block h-full group"
            >
                <div className="p-5 flex-grow">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
                        {icon}
                        <span>{label}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mt-3">{transport.purpose}</h3>

                    <div className="space-y-3 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{transport.total_pax} orang</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Bus className="w-4 h-4 text-gray-400" />
                            <span>{transport.transport_type ? transport.transport_type.name : "-"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Tanggal/Waktu: {moment(transport.date).format('DD MMMM YYYY')} / {transport.time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>Titik Awal: {transport.origin}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Flag className="w-4 h-4 text-gray-400" />
                            <span>Titik Akhir: {transport.destination}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Tombol Aksi */}
            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
                <button
                    onClick={onDelete}
                    disabled={!canBeModified}
                    title={canBeModified ? "Batalkan Order" : "Tidak dapat dibatalkan"}
                    className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onEdit}
                    disabled={!canBeModified}
                    title={canBeModified ? "Ubah Order" : "Tidak dapat diubah"}
                    className="p-2 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <Edit className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default OrderCard;