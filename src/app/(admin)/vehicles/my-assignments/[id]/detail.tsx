"use client";

// --- Imports ---
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut } from "@/../helpers"; 
import ComponentCard from "@/components/common/ComponentCard"; 
import {
    FaClock, FaUsers, FaBuilding, FaMapMarkerAlt, FaClipboardList, FaStickyNote,
    FaCalendarDay, FaCar, FaPlay, FaStop, FaUserTie, FaMapPin
} from "react-icons/fa"; 
import { Loader2 } from "lucide-react";
import Badge from "@/components/ui/badge/Badge"; 
import { FaFilePdf } from "react-icons/fa"; 
import { saveAs } from 'file-saver';
interface AssignmentDetail {
    id: number; request_id: number; vehicle_id: number; driver_id: number | null;
    note_for_driver: string | null;
    vehicle: { id: number; name: string; license_plate: string; };
    driver: { id: number; name: string; } | null;
}
interface VehicleRequestData {
    id: number; purpose: string; passenger_count: number; passenger_names: string | null;
    start_time: string; end_time: string | null; note: string | null;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled' | 'In Progress';
    destination: string; pickup_location_text: string | null;
    requested_vehicle_count: number; requires_driver: number;
    approved_by: string | null; updated_at: string;
    cabang: { id_cab: number; nama_cab: string; };
    user: { id_user: string; nama_user: string; };
    vehicle_type: { id: number; name: string; } | null;
    detail: AssignmentDetail[]; rejection_reason: string | null;
}


export default function DriverAssignmentDetailPage() { 
    const [data, setData] = useState<VehicleRequestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id); 
    moment.locale('id');
    const [isGeneratingSPJ, setIsGeneratingSPJ] = useState(false);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
    const [targetStatus, setTargetStatus] = useState<'In Progress' | 'Completed' | null>(null);
    


    const getDetail = useCallback(async () => {
        if (!id ) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`vehicle-requests/${id}`), true);
            const requestData: VehicleRequestData = response.data.data;
            setData(requestData);
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast.error("Pengajuan tidak ditemukan atau Anda tidak berhak melihatnya.");
                router.push('/vehicles/my-assignments');
            } else {
                toast.error("Gagal mengambil detail pengajuan.");
            }
             setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

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

    const handleTriggerStatus = async (newStatus: 'In Progress' | 'Completed') => {
        if (!data) return;
        setIsSubmittingStatus(true);
        setTargetStatus(newStatus);
        try {
            await httpPut(endpointUrl(`vehicle-requests/status/${data.id}`), { status: newStatus }, true);
            toast.success(`Status perjalanan berhasil diubah menjadi "${newStatus}"`);
            getDetail(); 
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmittingStatus(false);
            setTargetStatus(null);
        }
    };
    const handleGenerateSPJ = async () => {
        if (!data) return;
        setIsGeneratingSPJ(true);
        try {
            const response = await httpGet(
                endpointUrl(`vehicle-requests/spj/${data.id}`),
                true,
                {},
                'blob'
            );

            const filename = `SPJ_Request_${data.id}_${moment(data.start_time).format('YYYYMMDD')}.pdf`;

            saveAs(response.data, filename);

            toast.success("SPJ berhasil diunduh.");

        } catch (error: any) {
            console.error("Error generating SPJ:", error);
            try {
                const errorText = await (error.response?.data as Blob)?.text();
                const errorJson = JSON.parse(errorText);
                toast.error(errorJson.message || "Gagal mengunduh SPJ.");
            } catch {
                toast.error("Gagal mengunduh SPJ. Terjadi kesalahan tidak dikenal.");
            }
        } finally {
            setIsGeneratingSPJ(false);
        }
    };

    if (isLoading) return <p className="text-center mt-10">Memuat penugasan Anda...</p>;
    if (!data) return <p className="text-center mt-10">Penugasan tidak ditemukan.</p>;

    const myAssignment = data.detail?.find(assignment => assignment.driver_id !== null);
    const locationName = data.pickup_location_text || data.cabang?.nama_cab || 'Lokasi tidak diset';
    const showSPJButton = ['Approved', 'In Progress', 'Completed'].includes(data.status) && data.detail.length > 0;
    const showStartButton = data.status === 'Approved' && !!myAssignment; 
    const showCompleteButton = data.status === 'In Progress' && !!myAssignment;

    return (
        <ComponentCard title="Detail Penugasan Kendaraan">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{data.purpose}</h1>
                    <p className="text-sm text-gray-500">
                        Request ID: <strong className="text-gray-700">#{data.id}</strong> | Pemohon: <strong className="text-gray-700">{data.user?.nama_user}</strong>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(data.status)}
                    {showStartButton && (
                         <button
                             onClick={() => handleTriggerStatus('In Progress')}
                             title="Mulai Perjalanan"
                             disabled={isSubmittingStatus}
                             className="p-2 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50"
                         >
                             {isSubmittingStatus && targetStatus === 'In Progress' ? <Loader2 className="animate-spin w-4 h-4" /> : <FaPlay className="w-3 h-3" />}
                             <span className="hidden sm:inline">Mulai</span>
                         </button>
                     )}
                     {showCompleteButton && (
                          <button
                             onClick={() => handleTriggerStatus('Completed')}
                             title="Selesaikan Perjalanan"
                             disabled={isSubmittingStatus}
                             className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50"
                         >
                             {isSubmittingStatus && targetStatus === 'Completed' ? <Loader2 className="animate-spin w-4 h-4" /> : <FaStop className="w-3 h-3" />}
                             <span className="hidden sm:inline">Selesai</span>
                         </button>
                     )}
                     {showSPJButton && (
                            <button
                                onClick={handleGenerateSPJ}
                                title="Unduh Surat Perintah Jalan (PDF)"
                                disabled={isGeneratingSPJ}
                                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50"
                            >
                                {isGeneratingSPJ ? <Loader2 className="animate-spin w-4 h-4" /> : <FaFilePdf className="w-3 h-3" />}
                                <span className="hidden sm:inline">Unduh SPJ</span>
                            </button>
                        )}
                </div>
            </div>

            <div className="space-y-6">
                <Section title="Informasi Utama Perjalanan" icon={<FaClipboardList />}>
                    <InfoRow icon={<FaCalendarDay />} label="Waktu Mulai" value={moment(data.start_time).format('dddd, DD MMMM YYYY, HH:mm')} isBold/>
                    <InfoRow icon={<FaMapMarkerAlt />} label="Lokasi Jemput" value={locationName} />
                    <InfoRow icon={<FaMapPin />} label="Tujuan" value={data.destination} />
                     <InfoRow icon={<FaClock />} label="Estimasi Selesai" value={data.end_time ? moment(data.end_time).format('dddd, DD MMMM YYYY, HH:mm') : "Belum Ditentukan"} />
                </Section>

                 {myAssignment && (
                     <Section title="Detail Penugasan Anda" icon={<FaCar />}>
                         <InfoRow icon={<FaCar />} label="Kendaraan" value={`${myAssignment.vehicle.name} (${myAssignment.vehicle.license_plate})`} isBold/>
                         <InfoRow icon={<FaUserTie />} label="Supir" value={myAssignment.driver?.name || '-'} />
                         {myAssignment.note_for_driver && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FaStickyNote /> Catatan dari Admin:</p>
                                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">{myAssignment.note_for_driver}</p>
                            </div>
                         )}
                     </Section>
                 )}

                 <Section title="Informasi Penumpang" icon={<FaUsers />}>
                    <InfoRow icon={<FaUsers />} label="Jumlah" value={`${data.passenger_count} orang`} />
                    <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Nama Penumpang:</p>
                        {data.passenger_names ? (
                             <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200 whitespace-pre-wrap">{data.passenger_names}</p>
                         ) : (
                             <p className="text-gray-500 italic text-sm">Tidak disebutkan.</p>
                         )}
                     </div>
                 </Section>

                 {data.note && (
                     <Section title="Catatan dari Pemohon" icon={<FaStickyNote />}>
                         <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">{data.note}</p>
                     </Section>
                 )}
            </div>

             <div className="mt-8 pt-6 border-t flex justify-start">
                 <button onClick={() => router.back()} className="px-5 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 text-sm">
                     Kembali ke Daftar Tugas
                 </button>
             </div>

        </ComponentCard>
    );
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg p-4 sm:p-5">
        <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            {icon} {title}
        </h4>
        {children}
    </div>
);

const InfoRow: React.FC<{ icon?: React.ReactNode; label: string; value: string | number | null; isBold?: boolean }> =
({ icon, label, value, isBold = false }) => (
    <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-gray-100 last:border-b-0">
        <span className="text-sm text-gray-500 flex items-center gap-2 mb-1 sm:mb-0">
            {icon}
            {label}
        </span>
        <span className={`text-sm sm:text-base text-gray-800 text-left sm:text-right ${isBold ? 'font-bold' : 'font-medium'}`}>
            {value || '-'}
        </span>
    </div>
);