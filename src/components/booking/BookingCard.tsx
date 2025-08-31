import React from 'react';
import moment from 'moment';
import { Clock, Calendar, Bookmark, Home, Edit, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/badge/Badge';

interface Booking {
    id: number;
    purpose: string;
    booking_date: string;
    start_time: string;
    duration_minutes: number;
    status: 'Submit' | 'Approved' | 'Rejected';
    room: { name: string };
}

interface BookingCardProps {
    booking: Booking;
    onEdit: () => void;
    onDelete: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onEdit, onDelete }) => {
    const startTime = moment(booking.start_time, "HH:mm:ss");
    const endTime = startTime.clone().add(booking.duration_minutes, 'minutes');
    const isActionable = booking.status === 'Submit';

    const getStatusColor = () => {
        switch (booking.status) {
            case 'Approved': return 'success';
            case 'Rejected': return 'error';
            default: return 'warning';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow p-5 flex flex-col justify-between transition hover:shadow-lg">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800 break-all">{booking.room.name}</h3>
                    <Badge color={getStatusColor()}>{booking.status}</Badge>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-gray-400" /><span>{moment(booking.booking_date).format("dddd, DD MMMM YYYY")}</span></div>
                    <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-gray-400" /><span>{startTime.format("HH:mm")} - {endTime.format("HH:mm")} ({booking.duration_minutes} min)</span></div>
                    <div className="flex items-center gap-3"><Bookmark className="w-4 h-4 text-gray-400" /><span>{booking.purpose}</span></div>
                </div>
            </div>
            <div className="border-t mt-4 pt-4 flex justify-end gap-3">
                <button 
                    onClick={onEdit}
                    disabled={!isActionable}
                    className="flex items-center gap-2 text-sm text-blue-600 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed hover:text-blue-800"
                >
                    <Edit className="w-4 h-4" /> Edit
                </button>
                <button 
                    onClick={onDelete}
                    disabled={!isActionable}
                    className="flex items-center gap-2 text-sm text-red-600 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed hover:text-red-800"
                >
                    <Trash2 className="w-4 h-4" /> Delete
                </button>
            </div>
        </div>
    );
};

export default BookingCard;