"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import Badge from "@/components/ui/badge/Badge";
import 'moment/locale/id';
import { endpointUrl, getBadgeStatus, httpGet, httpPut } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    FaUser, FaBuilding, FaUsers, FaClock, FaClipboardList, FaStickyNote,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaMapMarkerAlt,
    FaTrain, FaPlane, FaBus, FaCar, FaTicketAlt, FaCalendarCheck, FaPhone
} from "react-icons/fa";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import { CircleX, Printer } from "lucide-react";
import CancelOrderModal from "@/components/modal/CancelOrderModal";

interface PassengerItem {
    id: number;
    transport_order_id: number;
    passenger_name: string;
    phone_number: number | string;
}

interface TransportType {
    id: number;
    name: string;
    is_active: number;
}

interface UserData {
    id_user: string;
    nama_user: string;
}

interface CabangData {
    id_cab: number;
    nama_cab: string;
}

interface TransportOrderData {
    id: number;
    user_id: string;
    cab_id: number;
    transport_type_id: number;
    origin: string;
    origin_detail: string | null;
    destination: string;
    destination_detail: string | null;
    date: string;
    time: string;
    total_pax: number;
    transport_class: string | null;
    preferred_provider: string | null;
    purpose: string | null;
    note: string | null;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
    created_at: string;
    updated_at: string;
    approved_by: string | null;
    is_active: number;
    passengers: PassengerItem[];
    transport_type: TransportType;
    cabang: CabangData;
    user: UserData;
}

export default function TransportAdminDetailPage() {
    const [data, setData] = useState<TransportOrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const id = Number(params.id);
    moment.locale('id');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const getDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`transport-orders/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            toast.error("Gagal mengambil detail pesanan transportasi.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getDetail();
    }, [getDetail]);

    // Helper: Icon berdasarkan jenis transport
    const getTransportIcon = (typeName: string) => {
        const lowerName = typeName.toLowerCase();
        if (lowerName.includes('kereta')) return <FaTrain className="text-orange-600" />;
        if (lowerName.includes('pesawat') || lowerName.includes('udara')) return <FaPlane className="text-blue-600" />;
        if (lowerName.includes('bus') || lowerName.includes('bis')) return <FaBus className="text-green-600" />;
        return <FaCar className="text-gray-600" />;
    };

    const getStatusBadge = (status: string) => {
        const statusMap = {
            'Approved': { icon: <FaCheckCircle />, color: 'green', label: 'Approved' },
            'Rejected': { icon: <FaTimesCircle />, color: 'red', label: 'Rejected' },
            'Canceled': { icon: <FaTimesCircle />, color: 'red', label: 'Canceled' },
            'Submit': { icon: <FaHourglassHalf />, color: 'yellow', label: 'Submit' },
        };
        const currentStatus = statusMap[status as keyof typeof statusMap] || statusMap['Submit'];
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>
                {currentStatus.icon} {currentStatus.label}
            </div>
        );
    };

    const handlePrint = async () => {
        try {
            const response = await httpGet(endpointUrl(`transport-orders/${id}/receipt`), true);
            const htmlContent = response.data;

            if (!htmlContent) {
                toast.error('Gagal mendapatkan data nota transportasi.');
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
                setTimeout(() => { document.body.removeChild(iframe); }, 1000);
            };
        } catch (error) {
            toast.error('Terjadi kesalahan saat mencetak nota.');
        }
    };

    const handleUpdateStatus = async () => {
        if (!actionType || !data) return;
        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`transport-orders/status/${data.id}`), { status: actionType }, true);
            toast.success(`Pesanan transportasi berhasil di-${actionType}`);
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsStatusModalOpen(false);
        }
    };

    const handleConfirmCancel = async () => {
        if (!data) return;
        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`transport-orders/cancel/${data.id}`), {}, true);
            toast.success("Pesanan transportasi berhasil dibatalkan.");
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan pesanan.");
        } finally {
            setIsSubmitting(false);
            setIsCancelModalOpen(false);
        }
    };

    if (isLoading) return <p className="text-center mt-10">Memuat data transportasi...</p>;
    if (!data) return <p className="text-center mt-10">Data tidak ditemukan.</p>;

    return (
        <ComponentCard title="Detail Admin - Pesanan Transportasi">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        {getTransportIcon(data.transport_type.name)}
                        {data.transport_type.name}
                    </h1>
                    <p className="text-gray-500 mt-1">Diajukan oleh: <strong>{data.user.nama_user}</strong></p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Badge {...getBadgeStatus(data.status)} />
                    {data.status === 'Approved' && (
                        <>
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">
                                <Printer size={18} /> Cetak Nota
                            </button>
                            <button onClick={() => setIsCancelModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-100 rounded-lg text-red-600 hover:bg-red-200 transition font-medium">
                                <CircleX size={18} /> Cancel Booking
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <DetailItem
                    icon={<FaMapMarkerAlt className="text-blue-500" />}
                    label="Asal (Origin)"
                    value={data.origin}
                    subValue={data.origin_detail}
                />
                <DetailItem
                    icon={<FaMapMarkerAlt className="text-red-500" />}
                    label="Tujuan (Destination)"
                    value={data.destination}
                    subValue={data.destination_detail}
                />
                <DetailItem
                    icon={<FaCalendarCheck className="text-green-600" />}
                    label="Tanggal Berangkat"
                    value={moment(data.date).format('DD MMM YYYY')}
                />
                <DetailItem
                    icon={<FaClock className="text-purple-600" />}
                    label="Waktu / Jam"
                    value={data.time}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaClipboardList /> Daftar Penumpang ({data.total_pax} Org)
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                        {data.passengers.map((p, index) => (
                            <div key={p.id} className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800">{p.passenger_name}</h5>
                                        {p.phone_number && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <FaPhone size={12} /> {p.phone_number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border rounded-lg p-5 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaBuilding className="text-gray-500" /> Info Pemohon
                        </h4>
                        <div className="text-sm space-y-2">
                            <div>
                                <span className="text-gray-500">Cabang:</span>
                                <p className="font-semibold text-gray-800">{data.cabang.nama_cab}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Nama User:</span>
                                <p className="font-semibold text-gray-800">{data.user.nama_user}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg p-5 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FaTicketAlt className="text-yellow-600" /> Detail Tiket
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Kelas</span>
                                <p className="font-medium text-gray-800">{data.transport_class || '-'}</p>
                            </div>
                            <hr className="border-dashed" />
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Provider / Maskapai</span>
                                <p className="font-medium text-gray-800">{data.preferred_provider || '-'}</p>
                            </div>
                            <hr className="border-dashed" />
                            <div>
                                <span className="text-xs text-gray-400 uppercase font-bold">Keperluan</span>
                                <p className="font-medium text-gray-800">{data.purpose || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border rounded-lg p-5 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaStickyNote className="text-yellow-500" /> Catatan Tambahan
                        </h4>
                        {data.note ? (
                            <p className="text-gray-600 bg-yellow-50 p-3 rounded-md whitespace-pre-wrap text-sm italic border border-yellow-100">
                                "{data.note}"
                            </p>
                        ) : (
                            <p className="text-gray-500 italic text-sm">Tidak ada catatan.</p>
                        )}
                    </div>
                </div>
            </div>

            {data.status === 'Submit' && (
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-lg">
                    <button
                        className="px-6 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 font-bold hover:bg-red-50 transition shadow-sm"
                        onClick={() => { setActionType("Rejected"); setIsStatusModalOpen(true); }}
                    >
                        Tolak Pengajuan
                    </button>
                    <button
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                        onClick={() => { setActionType("Approved"); setIsStatusModalOpen(true); }}
                    >
                        Setujui Pengajuan
                    </button>
                </div>
            )}

            <ChangeStatusOrderModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onConfirm={handleUpdateStatus}
                order={data}
                actionType={actionType}
                isSubmitting={isSubmitting}
            />

            <CancelOrderModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={handleConfirmCancel}
                order={data}
                isSubmitting={isSubmitting}
            />
        </ComponentCard>
    );
}

const DetailItem = ({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | null, subValue?: string | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 shadow-sm transition hover:shadow-md hover:border-blue-300">
        <div className="text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">{label}</span>
            <span className="font-bold text-gray-800 block">{value || '-'}</span>
            {subValue && <span className="text-xs text-gray-500 mt-1 block">{subValue}</span>}
        </div>
    </div>
);