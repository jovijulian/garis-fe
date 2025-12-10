import React from 'react';
import moment from 'moment';
import 'moment/locale/id';
import { Calendar, Users, MapPin, Car, User, StickyNote, Eye, Play, Ban } from 'lucide-react'; 
import Badge from '@/components/ui/badge/Badge'; 
import { Loader2 } from 'lucide-react';

interface Assignment {
    id: number; 
    note_for_driver: string | null;
    vehicle: {
        id: number;
        name: string;
        license_plate: string;
    };
    vehicle_request: {
        id: number; 
        purpose: string;
        destination: string;
        start_time: string;
        status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress';
        user: { nama_user: string };
        cabang: { nama_cab: string };
        pickup_location_text: string | null;
        passenger_count: number;
    };
}

interface AssignmentCardProps {
    assignment: Assignment;
    onDetailClick: () => void;
    onTriggerStatus: (requestId: number, newStatus: 'In Progress' | 'Completed') => Promise<void>;
    isSubmittingStatus: boolean;
    targetRequestId: number | null; 
    targetStatus: 'In Progress' | 'Completed' | null; 
}

const getStatusBadge = (status: string) => {
    let color: "success" | "error" | "warning" | "info" | "purple" | "gray" | "pending" = "pending";
    let label = status;
    switch (status) {
        case 'Approved': color = 'success'; label = 'Approved'; break;
        case 'Rejected': color = 'error'; label = 'Rejected'; break;
        case 'Canceled': color = 'error'; label = 'Canceled'; break;
        case 'In Progress': color = 'info'; label = 'In Progress'; break;
        case 'Completed': color = 'success'; label = 'Completed'; break;
        case 'Submit': color = 'warning'; label = 'Submit'; break;
        default: color = 'info'; break;
    }
    return <Badge color={color}>{label}</Badge>;
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({
    assignment,
    onDetailClick,
    onTriggerStatus,
    isSubmittingStatus,
    targetRequestId,
    targetStatus
}) => {
    moment.locale('id');
    const req = assignment.vehicle_request;
    const location = req.pickup_location_text || req.cabang?.nama_cab || '-';

    const isCurrentActionLoading = isSubmittingStatus && targetRequestId === req.id;

    const showStartButton = req.status === 'Approved';
    const showCompleteButton = req.status === 'In Progress';

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Request #{req.id}
                    </span>
                    {getStatusBadge(req.status)}
                </div>

                <h3 className="text-lg font-bold text-gray-800 truncate mb-1" title={req.purpose}>{req.purpose}</h3>
                <p className="text-sm text-gray-600 truncate mb-3" title={req.destination}>
                    Tujuan: {req.destination}
                </p>

                <div className="border-t border-gray-100 my-4"></div>

                <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>Waktu Mulai: <strong className="text-gray-900">{moment(req.start_time).format('DD MMM YYYY, HH:mm')}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>Jemput: {location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>Kendaraan: <strong className="text-gray-900">{assignment.vehicle.name} ({assignment.vehicle.license_plate})</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>Penumpang: {req.passenger_count} orang</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>Pemohon: {req.user?.nama_user}</span>
                    </div>
                    {assignment.note_for_driver && (
                        <div className="flex items-start gap-2 pt-1">
                            <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>Catatan Admin: <span className="italic text-gray-600 bg-yellow-50 px-1 rounded">{assignment.note_for_driver}</span></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t">
                {/* {showStartButton && (
                    <button
                        onClick={() => onTriggerStatus(req.id, 'In Progress')}
                        disabled={isCurrentActionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCurrentActionLoading && targetStatus === 'In Progress' ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-3 h-3" />}
                        Mulai
                    </button>
                )}
                {showCompleteButton && (
                    <button
                        onClick={() => onTriggerStatus(req.id, 'Completed')}
                        disabled={isCurrentActionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCurrentActionLoading && targetStatus === 'Completed' ? <Loader2 className="animate-spin w-4 h-4" /> : <Ban className="w-3 h-3" />}
                        Selesai
                    </button>
                )} */}
                <button
                    onClick={onDetailClick}
                    title="Lihat Detail Lengkap Permintaan"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCurrentActionLoading}
                >
                    <Eye className="w-4 h-4" /> Lihat Detail
                </button>
            </div>
        </div>
    );
};

export default AssignmentCard;