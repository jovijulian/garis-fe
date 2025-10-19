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
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUserCheck, FaCalendarDay, FaCar
} from "react-icons/fa";
import Badge from "@/components/ui/badge/Badge";

interface AssignmentDetail {
    id: number;
    request_id: number;
    vehicle_id: number;
    driver_id: number | null;
    note_for_driver: string | null;
    vehicle: {
        id: number;
        name: string;
        license_plate: string;
    };
    driver: {
        id: number;
        name: string;
    } | null;
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
    requires_driver: number;
    approved_by: string | null;
    updated_at: string;
    cabang: { id_cab: number; nama_cab: string; };
    user: { id_user: string; nama_user: string; };
    vehicle_type: { id: number; name: string; } | null;
    detail: AssignmentDetail[];
    rejection_reason: string | null;
}

export default function VehicleRequestDetailPage() {
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
         let color: "success" | "error" | "warning" | "info" ;
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


    if (isLoading) return <p className="text-center mt-10">Memuat pengajuan Anda...</p>;
    if (!data) return <p className="text-center mt-10">Pengajuan tidak ditemukan atau Anda tidak berhak melihatnya.</p>;

    const locationName = data.pickup_location_text || data.cabang?.nama_cab || 'Lokasi tidak diset';

    const canBeModified = data.status === 'Submit';

    return (
        <>
            <ComponentCard title="Detail Pengajuan Kendaraan">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{data.purpose}</h1>
                        <p className="text-gray-500">Diajukan oleh: <strong>{data.user?.nama_user}</strong> | ID: <strong>#{data.id}</strong></p>
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
                    <DetailItem icon={<FaBuilding />} label="Cabang Pemohon" value={data.cabang?.nama_cab} />
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
                                <InfoRow label="Jenis Kendaraan Diminta" value={data.vehicle_type?.name || 'Tidak spesifik'} />
                                <InfoRow label="Jumlah Unit Diminta" value={`${data.requested_vehicle_count} unit`} />
                                <InfoRow label="Butuh Supir?" value={data.requires_driver === 1 ? 'Ya' : 'Tidak'} />
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

                        {data.status !== 'Submit' && data.status !== 'Rejected' && (
                            <div className="bg-white border rounded-lg p-5">
                                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaCar /> Hasil Penugasan</h4>

                                {data.detail && data.detail.length > 0 ? (
                                    <div className="space-y-4">
                                        {data.detail.map((assignment, index) => (
                                            <div key={assignment.id} className={`p-3 rounded-md ${index > 0 ? 'border-t mt-4 pt-4' : ''}`}>
                                                <p className="font-semibold text-gray-800">
                                                    {assignment.vehicle.name} ({assignment.vehicle.license_plate})
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Supir: {assignment.driver ? assignment.driver.name : <span className="italic text-gray-400">Tidak ada supir ditugaskan</span>}
                                                </p>
                                                {assignment.note_for_driver && <p className="text-xs text-gray-500 mt-1">Catatan: {assignment.note_for_driver}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">Belum ada kendaraan/supir yang ditugaskan.</p>
                                )}
                            </div>
                        )}

                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white border rounded-lg p-5 sticky top-24">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaStickyNote /> Catatan Tambahan dari Pemohon</h4>
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
                            <p>Status terakhir diperbarui pada {moment(data.updated_at).format('DD MMM YYYY, HH:mm')}
                                {data.approved_by && ` oleh ${data.approved_by}`}.
                            </p>
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
                url={`vehicle-requests/cancel/${data?.id}`}
                selectedData={data}
                itemName={data?.purpose || ""}
                onSuccess={() => {
                    setDeleteModalOpen(false);
                    getDetail();
                }}
                message="Pengajuan berhasil dibatalkan!"
            />
        </>
    );
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value }: { label: string, value: string | number | null }) => (
    <div className="flex justify-between border-b border-gray-100 py-2">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-800 text-right">{value || '-'}</span>
    </div>
);