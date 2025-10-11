// components/order/BookingCard.tsx

import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, Clock, Edit, Trash2, Building, CheckCircle, XCircle, Hourglass, Info, Pin, Users } from 'lucide-react';
import Link from 'next/link';
interface Order {
    id: number;
    purpose: string;
    pax: number;
    location_text: string;
    order_date: string;
    status: 'Submit' | 'Approved' | 'Rejected';
    room: { name: string };
}

interface OrderCardProps {
    order: Order;
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
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onEdit, onDelete }) => {
    moment.locale('id');
    const { label, icon, style } = statusConfig[order.status];
    const canBeModified = order.status === 'Submit';

    return (

        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
            <Link
                href={`/orders/my-orders/${order.id}`}
                className="block h-full group"
            >
                <div className="p-5 flex-grow">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
                        {icon}
                        <span>{label}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mt-3">{order.purpose}</h3>

                    <div className="space-y-3 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{order.pax} orang</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>{order.room ? order.room.name : order.location_text}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{moment(order.order_date).format('dddd, DD MMMM YYYY')}</span>
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