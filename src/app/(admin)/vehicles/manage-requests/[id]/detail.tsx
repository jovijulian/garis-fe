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
    FaUsers, FaBuilding, FaMapMarkerAlt, FaClipboardList, FaStickyNote,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUserCheck, FaCalendarDay, FaCar, FaPlus
} from "react-icons/fa";
import { CircleX, Loader2 } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ChangeStatusModal from "@/components/modal/ChangeStatusVehicleRequestModal";
import CancelModal from '@/components/modal/CancelVehicleRequestModal';
import AssignmentModal from '@/components/modal/VehicleAssignmentModal';
import { FaPlay, FaStop } from "react-icons/fa";
import { FaFilePdf } from "react-icons/fa"; // Import ikon PDF
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

export default function AdminVehicleRequestDetailPage() {
    const [data, setData] = useState<VehicleRequestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    const [isGeneratingSPJ, setIsGeneratingSPJ] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState<'In Progress' | 'Completed' | null>(null);
    const [adminCabId, setAdminCabId] = useState<number | null>(null);

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`vehicle-requests/${id}`), true);
            setData(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast.error("Pengajuan tidak ditemukan atau Anda tidak berhak melihatnya.");
                router.push('/vehicles/requests');
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
        const cabId = localStorage.getItem("sites");
        if (cabId) {
            setAdminCabId(parseInt(cabId, 10));
        }
    }, [getDetail]);

    const getStatusBadge = (status: string) => {
        let color: "success" | "error" | "warning" | "info";
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

    const handleOpenStatusModal = (reqData: VehicleRequestData, action: 'Approved' | 'Rejected') => {
        setData(reqData);
        setActionType(action);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async (reason?: string) => {
        if (!actionType || !data) return;
        setIsSubmittingStatus(true);
        try {
            const payload: { status: string; rejection_reason?: string } = { status: actionType };
            if (actionType === 'Rejected' && reason) {
                payload.rejection_reason = reason;
            }
            await httpPut(endpointUrl(`vehicle-requests/status/${data.id}`), payload, true);
            toast.success(`Pengajuan berhasil diubah menjadi "${actionType}"`);
            setIsStatusModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmittingStatus(false);
        }
    };

    const handleOpenCancelModal = (reqData: VehicleRequestData) => {
        setData(reqData);
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!data) return;
        setIsSubmittingCancel(true);
        try {
            await httpPut(endpointUrl(`vehicle-requests/cancel/${data.id}`), {}, true);
            toast.success("Pengajuan berhasil dibatalkan.");
            setIsCancelModalOpen(false);
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan pengajuan.");
        } finally {
            setIsSubmittingCancel(false);
        }
    };

    const handleOpenAssignmentModal = () => {
        setIsAssignmentModalOpen(true);
    };

    const handleTriggerStatus = async (newStatus: 'In Progress' | 'Completed') => {
        if (!data) return;
        setIsSubmittingStatus(true);
        setTargetStatus(newStatus);
        try {
            await httpPut(endpointUrl(`vehicle-requests/status/${data.id}`), { status: newStatus }, true);
            toast.success(`Status pengajuan berhasil diubah menjadi "${newStatus}"`);
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
            const response = await httpGet(endpointUrl(`vehicle-requests/spj/${data.id}`), true);
            const htmlContent = response.data;

            if (!htmlContent) {
                toast.error('Gagal mendapatkan data spj untuk dicetak.');
                return;
            }

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            iframe.contentDocument?.open();
            iframe.contentDocument?.write(htmlContent);
            iframe.contentDocument?.close();

            iframe.onload = function () {
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            };

        } catch (error) {
            setIsGeneratingSPJ(false);
            console.error('Gagal mencetak nota:', error);
            toast.error('Terjadi kesalahan saat menyiapkan nota.');
        } finally {
            setIsGeneratingSPJ(false);
        }
    };


    if (isLoading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail pengajuan...</p>
        </div>
    );
    if (!data) return (
        <div className="text-center mt-10 p-4">
            <p className="text-red-600">Gagal memuat data atau pengajuan tidak ditemukan.</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Kembali ke Daftar
            </button>
        </div>
    );


    const locationName = data.pickup_location_text || data.cabang?.nama_cab || 'Lokasi tidak diset';
    const showCancelButton = ['Approved', 'In Progress'].includes(data.status);
    const showStartButton = data.status === 'Approved' && data.detail.length > 0;
    const showCompleteButton = data.status === 'In Progress';
    const showSPJButton = ['Approved', 'In Progress', 'Completed'].includes(data.status) && data.detail.length > 0;
    const count = data.requested_vehicle_count;
    const isVehicle = count > 0;
    return (
        <>
            <ComponentCard title="Detail Pengajuan Kendaraan (Admin)">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-800">
                                {data.purpose}
                            </h1>

                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
            ${isVehicle
                                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                                        : "bg-green-100 text-green-700 border border-green-300"
                                    }`}
                            >
                                {isVehicle ? "Peminjaman Kendaraan" : "Peminjaman Pengemudi"}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500">
                            Diajukan oleh
                            <strong className="text-gray-700"> {data.user?.nama_user}</strong>
                            <span className="mx-1">•</span>
                            ID:
                            <strong className="text-gray-700"> #{data.id}</strong>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {getStatusBadge(data.status)}
                        {/* {showStartButton && (
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
                        )} */}
                        {showCancelButton && (
                            <button
                                onClick={() => handleOpenCancelModal(data)}
                                title="Batalkan Pengajuan"
                                className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                <CircleX className="w-4 h-4 text-red-500" />
                            </button>
                        )}
                        {showSPJButton && (
                            <button
                                onClick={handleGenerateSPJ}
                                title="Unduh Surat Perintah Jalan (PDF)"
                                disabled={isGeneratingSPJ || isSubmittingStatus}
                                className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1 text-xs sm:text-sm disabled:opacity-50"
                            >
                                {isGeneratingSPJ ? <Loader2 className="animate-spin w-4 h-4" /> : <FaFilePdf className="w-3 h-3" />}
                                <span className="hidden sm:inline">Unduh SPJ</span>
                            </button>
                        )}
                        {/* Print SPJ Button (Conditional - e.g., show if Approved and has assignments) */}
                        {/* {data.status === 'Approved' && data.detail.length > 0 && ( ... Print Button ...)} */}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<FaBuilding />} label="Cabang Pemohon" value={data.cabang?.nama_cab} />
                    <DetailItem icon={<FaMapMarkerAlt />} label="Lokasi Jemput" value={locationName} />
                    <DetailItem icon={<FaCalendarDay />} label="Waktu Mulai" value={moment(data.start_time).format('DD MMM YYYY, HH:mm')} />
                    <DetailItem icon={<FaUsers />} label="Jumlah Penumpang" value={`${data.passenger_count}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Section title="Detail Permintaan" icon={<FaClipboardList />}>
                            <InfoRow label="Tujuan" value={data.destination} />
                            <InfoRow label="Waktu Selesai" value={data.end_time ? moment(data.end_time).format('DD MMM YYYY, HH:mm') : "-"} />
                            <InfoRow label="Jenis Kendaraan Diminta" value={data.vehicle_type?.name || 'Tidak spesifik'} />
                            <InfoRow label="Jumlah Unit Diminta" value={`${data.requested_vehicle_count} unit`} />
                            <InfoRow label="Butuh Supir?" value={data.requires_driver === 1 ? 'Ya' : 'Tidak'} />
                        </Section>

                        <Section title="Informasi Penumpang" icon={<FaUsers />}>
                            {data.passenger_names ? (
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{data.passenger_names}</p>
                            ) : (
                                <p className="text-gray-500 italic">Tidak ada daftar nama penumpang.</p>
                            )}
                        </Section>

                        {['Approved', 'In Progress', 'Completed'].includes(data.status) && (
                            <Section title="Penugasan Kendaraan & Supir" icon={<FaCar />}>
                                {data.detail && data.detail.length > 0 ? (
                                    <div className="space-y-4">
                                        {data.detail.map((assignment, index) => (
                                            <div key={assignment.id} className={`p-3 rounded-md bg-gray-50 ${index > 0 ? 'mt-3' : ''}`}>
                                                <p className="font-semibold text-gray-800">
                                                    {assignment.vehicle ? assignment.vehicle?.name : <span className="italic text-gray-400">Tidak ada kendaraan</span>} {assignment.vehicle ? (assignment.vehicle?.license_plate) : ""}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Supir: {assignment.driver ? assignment.driver.name : <span className="italic text-gray-400">Tidak ada supir</span>}
                                                </p>
                                                {/* Optional: Add button to remove assignment here */}
                                                {/* <button onClick={() => handleRemoveAssignment(assignment.id)}>Hapus</button> */}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm">Belum ada penugasan.</p>
                                )}
                                {data.status === 'Approved' && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={handleOpenAssignmentModal}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                                        >
                                            <FaPlus className="w-4 h-4" />
                                            Kelola Penugasan
                                        </button>
                                    </div>
                                )}
                            </Section>
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

                {data.status === 'Submit' && (
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                        <button
                            className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleOpenStatusModal(data, "Rejected")}
                        >
                            Tolak Pengajuan
                        </button>
                        <button
                            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                            onClick={() => handleOpenStatusModal(data, "Approved")}
                        >
                            Setujui Pengajuan
                        </button>
                    </div>
                )}

                {data.approved_by && (
                    <div className="mt-6">
                        <Section title="Informasi Status" icon={<FaUserCheck />}>
                            <p>Status terakhir diperbarui pada {moment(data.updated_at).format('DD MMM YYYY, HH:mm')}
                                {data.approved_by && ` oleh ${data.approved_by}`}.
                            </p>
                            {data.status === 'Rejected' && data.rejection_reason && (
                                <div className="mt-3 border-t pt-3">
                                    <p className="font-semibold text-red-600">Alasan Penolakan:</p>
                                    <p className="text-gray-700">{data.rejection_reason}</p>
                                </div>
                            )}
                        </Section>
                    </div>
                )}
            </ComponentCard>

            <ChangeStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onConfirm={handleUpdateStatus}
                vehicleRequest={data}
                actionType={actionType}
                isSubmitting={isSubmittingStatus}
            />

            <CancelModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                vehicleRequest={data}
                isSubmitting={isSubmittingCancel}
            />

            <AssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                requestId={data.id}
                existingAssignments={data.detail}
                requiresDriver={data.requires_driver === 1}
                onSuccess={() => {
                    setIsAssignmentModalOpen(false);
                    getDetail();
                }}
                adminCabId={adminCabId}
                startTime={data.start_time}
                endTime={data.end_time}
                onlyDriver={!isVehicle}
            />
        </>
    );
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            {icon} {title}
        </h4>
        {children}
    </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);

const InfoRow = ({ label, value }: { label: string, value: string | number | null }) => (
    <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 py-2 last:border-b-0">
        <span className="text-gray-500 text-sm sm:text-base">{label}</span>
        <span className="font-semibold text-gray-800 text-left sm:text-right text-sm sm:text-base">{value || '-'}</span>
    </div>
);