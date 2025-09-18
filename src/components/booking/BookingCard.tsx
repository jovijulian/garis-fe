// components/booking/BookingCard.tsx

import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, Clock, Edit, Trash2, Building, CheckCircle, XCircle, Hourglass, Info, Pin } from 'lucide-react';
import Link from 'next/link';

// Definisikan interface yang akurat sesuai respons API
interface Booking {
    id: number;
    purpose: string;
    detail_topic: string;
    start_time: string;
    end_time: string;
    status: 'Submit' | 'Approved' | 'Rejected';
    room: { name: string };
    topic: { name: string };
}

interface BookingCardProps {
    booking: Booking;
    onEdit: () => void;
    onDelete: () => void;
}

const statusConfig = {
    Submit: {
        label: 'Menunggu Persetujuan',
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

const BookingCard: React.FC<BookingCardProps> = ({ booking, onEdit, onDelete }) => {
    moment.locale('id');
    const { label, icon, style } = statusConfig[booking.status];
    const canBeModified = booking.status === 'Submit';

    return (

        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
            <Link
                href={`/manage-booking/my-bookings/${booking.id}`}
                className="block h-full group"
            >
                <div className="p-5 flex-grow">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
                        {icon}
                        <span>{label}</span>
                    </div>

                    {/* Judul Keperluan */}
                    <h3 className="text-lg font-bold text-gray-800 mt-3">{booking.purpose}</h3>

                    {/* Detail Ruangan & Waktu */}
                    <div className="space-y-3 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                            <Pin className="w-4 h-4 text-gray-400" />
                            <span>{booking.topic.name} {booking.detail_topic ? `(${booking.detail_topic})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>{booking.room.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{moment(booking.start_time).format('dddd, DD MMMM YYYY')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{moment(booking.start_time).format('HH:mm')} - {moment(booking.end_time).format('HH:mm')}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Tombol Aksi */}
            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
                <button
                    onClick={onDelete}
                    disabled={!canBeModified}
                    title={canBeModified ? "Batalkan Booking" : "Tidak dapat dibatalkan"}
                    className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onEdit}
                    disabled={!canBeModified}
                    title={canBeModified ? "Ubah Booking" : "Tidak dapat diubah"}
                    className="p-2 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <Edit className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default BookingCard;