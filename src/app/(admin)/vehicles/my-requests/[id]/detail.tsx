"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import DeactiveModal from "@/components/modal/deactive/Deactive";
import {
    FaClock, FaUsers, FaBuilding, FaMapMarkerAlt, FaClipboardList, FaStickyNote,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUserCheck, FaCalendarDay, FaCar, FaCarAlt, FaUserTie
} from "react-icons/fa";

interface AssignedVehicle {
    id: number;
    vehicle_request_id: number;
    vehicle_id: number;
    vehicle: {
        id: number;
        name: string;
        license_plate: string;
    };
}

interface AssignedDriver {
    id: number;
    vehicle_request_id: number;
    driver_id: number;
    driver: {
        id: number;
        name: string;
    };
}

interface VehicleRequestData {
    id: number;
    purpose: string;
    passenger_count: number;
    passenger_names: string | null;
    start_time: string;
    end_time: string;
    note: string | null;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress';
    destination: string;
    pickup_location_text: string | null;
    requested_vehicle_count: number;
    approved_by: string | null;
    updated_at: string;
    cabang: { id_cab: number; nama_cab: string; };
    user: { id_user: string; nama_user: string; };
    vehicle_type: { id: number; name: string; } | null;
    assigned_vehicles: AssignedVehicle[];
    assigned_drivers: AssignedDriver[];
    rejection_reason: string | null;
}

export default function MyVehicleRequestDetailPage() {
    const [data, setData] = useState<VehicleRequestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`vehicle-requests/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            toast.error("Gagal mengambil detail pengajuan.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    const getStatusBadge = (status: string) => {
        const statusMap = {
            'Approved': { icon: <FaCheckCircle />, color: 'green', label: 'Approved' },
            'Completed': { icon: <FaCheckCircle />, color: 'green', label: 'Completed' },
            'Rejected': { icon: <FaTimesCircle />, color: 'red', label: 'Rejected' },
            'Canceled': { icon: <FaTimesCircle />, color: 'red', label: 'Canceled' },
            'Submit': { icon: <FaHourglassHalf />, color: 'yellow', label: 'Diajukan' },
            'In Progress': { icon: <FaClock />, color: 'blue', label: 'Dalam Proses' },
        };
        const currentStatus = statusMap[status as keyof typeof statusMap] || statusMap['Submit'];
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>
                {currentStatus.icon} {currentStatus.label}
            </div>
        );
    };

    if (isLoading) return <p className="text-center mt-10">Memuat pengajuan Anda...</p>;
    if (!data) return <p className="text-center mt-10">Pengajuan tidak ditemukan.</p>;

    const locationName = data.pickup_location_text || data.cabang?.nama_cab || 'Lokasi tidak diset';

    const canBeModified = data.status === 'Submit';

    return (
        <>
            <ComponentCard title="Detail Pengajuan Kendaraan">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{data.purpose}</h1>
                        <p className="text-gray-500">ID Pengajuan: <strong>#{data.id}</strong></p>
                    </div>
                    {getStatusBadge(data.status)}
                </div>

                {canBeModified && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 flex-grow mb-2 md:mb-0">
                            Pengajuan Anda masih bisa diubah atau dibatalkan.
                        </p>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={() => router.push(`/vehicles/edit/${data.id}`)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
                            >
                                Ubah
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<FaBuilding />} label="Cabang Asal" value={data.cabang?.nama_cab} />
                    <DetailItem icon={<FaMapMarkerAlt />} label="Lokasi Jemput" value={locationName} />
                    <DetailItem icon={<FaCalendarDay />} label="Waktu Mulai" value={moment(data.start_time).format('DD MMM YYYY, HH:mm')} />
                    <DetailItem icon={<FaUsers />} label="Jumlah Penumpang" value={`${data.passenger_count}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">

                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaClipboardList /> Detail Permintaan</h4>
                            <div className="space-y-2">
                                <InfoRow label="Tujuan" value={data.destination} />
                                <InfoRow label="Waktu Selesai" value={data.end_time ? moment(data.end_time).format('DD MMM YYYY, HH:mm') : "-"} />
                                <InfoRow label="Jenis Kendaraan" value={data.vehicle_type?.name || 'Tidak spesifik'} />
                                <InfoRow label="Jumlah Unit Diminta" value={`${data.requested_vehicle_count} unit`} />
                            </div>
                        </div>

                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaUsers /> Informasi Penumpang</h4>
                            {data.passenger_names ? (
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{data.passenger_names}</p>
                            ) : (
                                <p className="text-gray-500 italic">Tidak ada daftar nama penumpang.</p>
                            )}
                        </div>

                        {data.status !== 'Submit' && (
                            <div className="bg-white border rounded-lg p-5">
                                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaCar /> Hasil Penugasan</h4>

                                {data.assigned_vehicles.length > 0 ? (
                                    <div className="mb-4">
                                        <h5 className="font-semibold text-gray-600 mb-2">Kendaraan:</h5>
                                        <ul className="list-disc list-inside space-y-1">
                                            {data.assigned_vehicles.map(v => (
                                                <li key={v.id}>{v.vehicle.name} ({v.vehicle.license_plate})</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm mb-2">Belum ada kendaraan ditugaskan.</p>
                                )}

                                {data.assigned_drivers.length > 0 ? (
                                    <div>
                                        <h5 className="font-semibold text-gray-600 mb-2">Supir:</h5>
                                        <ul className="list-disc list-inside space-y-1">
                                            {data.assigned_drivers.map(d => (
                                                <li key={d.id}>{d.driver.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">Belum ada supir ditugaskan.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white border rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaStickyNote /> Catatan Tambahan</h4>
                            {data.note ? (
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{data.note}</p>
                            ) : (
                                <p className="text-gray-500 italic">Tidak ada catatan tambahan.</p>
                            )}
                        </div>
                    </div>
                </div>

                {data.status !== 'Submit' && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaUserCheck /> Informasi Status</h4>
                        <div className="bg-white border rounded-lg p-5">
                            <p>Status terakhir diperbarui pada {moment(data.updated_at).format('DD MMM YYYY, HH:mm')} oleh <strong>{data.user?.nama_user || data.approved_by || 'Sistem'}</strong>.</p>
                            {data.status === 'Rejected' && data.rejection_reason && (
                                <div className="mt-3 border-t pt-3">
                                    <p className="font-semibold text-red-600">Alasan Penolakan:</p>
                                    <p className="text-gray-700">{data.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </ComponentCard>

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                url={`vehicle-requests/${data?.id}`}
                selectedData={data}
                itemName={data?.purpose || ""}
                onSuccess={() => router.push('/vehicles/my-requests')}
                message="Pengajuan berhasil dibatalkan!"
            />
        </>
    );
}

// Helper component (tetap sama)
const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);

// Helper component baru untuk baris info
const InfoRow = ({ label, value }: { label: string, value: string | number | null }) => (
    <div className="flex justify-between border-b border-gray-100 py-2">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-800 text-right">{value || '-'}</span>
    </div>
);