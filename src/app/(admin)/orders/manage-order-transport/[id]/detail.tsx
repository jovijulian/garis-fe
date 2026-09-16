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
import { CircleX, Loader2, Printer } from "lucide-react";
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="ml-4 text-gray-700">Memuat detail pesanan...</p>
            </div>
        );
    }
    if (!data) return <p className="text-center mt-10">Data tidak ditemukan.</p>;

    return (
        <ComponentCard title="Detail - Pesanan Transportasi">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">

                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {data.transport_type.name}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-1">
                        <span>Diajukan oleh</span>
                        <strong className="text-gray-700">
                            {data.user.nama_user}
                        </strong>
                    </p>
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
                    {data.status === 'Submit' && (
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                                onClick={() => { setActionType("Rejected"); setIsStatusModalOpen(true); }}
                            >
                                Tolak
                            </button>
                            <button
                                className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                                onClick={() => { setActionType("Approved"); setIsStatusModalOpen(true); }}
                            >
                                Setujui
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <DetailItem
                    icon={<FaMapMarkerAlt />}
                    label="Asal (Origin)"
                    value={data.origin}
                    subValue={data.origin_detail}
                />
                <DetailItem
                    icon={<FaMapMarkerAlt />}
                    label="Tujuan (Destination)"
                    value={data.destination}
                    subValue={data.destination_detail}
                />
                <DetailItem
                    icon={<FaCalendarCheck />}
                    label="Tanggal Berangkat"
                    value={moment(data.date).format('DD MMM YYYY')}
                />
                <DetailItem
                    icon={<FaClock />}
                    label="Waktu / Jam"
                    value={data.time}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border rounded-lg p-5">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">  Daftar Penumpang ({data.total_pax} Org)
                        </h4>
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
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            Catatan Tambahan
                        </h4>
                        {data.note ? (
                             <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap italic">
                                "{data.note}"
                            </p>
                        ) : (
                            <p className="text-gray-500 italic text-sm">Tidak ada catatan.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Section title="Detail Pesanan" icon={null}>
                        <InfoRow label="Keperluan" value={data.purpose} />
                        <InfoRow label="Kelas" value={data.transport_class} />
                        <InfoRow label="Provider / Maskapai" value={data.preferred_provider} />
                        <InfoRow label="Cabang Pemohon" value={data.cabang.nama_cab} />
                        <InfoRow label="Nama User" value={data.user.nama_user} />
                        <InfoRow
                            label="Waktu Pengajuan"
                            value={moment(data.created_at).format("DD MMMM YYYY, HH:mm")}
                        />
                    </Section>
                </div>
            </div>




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
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || "-"}</span>
            {subValue && <span className="text-xs text-gray-500 mt-1 block">{subValue}</span>}
        </div>
    </div>
);

const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, icon, children }) => (
    <div className="bg-white border rounded-lg p-5">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
            <span>{title}</span>
        </h4>
        {children}
    </div>
);

const InfoRow = ({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined | React.ReactNode;
}) => (
    <div className="flex flex-col sm:flex-row justify-between border-b border-gray-100 py-2.5 last:border-b-0 gap-1">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className="font-semibold text-gray-800 text-left sm:text-right text-sm">
            {value || "-"}
        </span>
    </div>
);
