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
    FaCalendarCheck, FaUsers, FaBuilding,
    FaStickyNote, FaCheckCircle, FaTimesCircle, FaHourglassHalf,
    FaUserCheck, FaClipboardList, FaMapMarkerAlt, FaClock,
    FaTrain, FaPlane, FaBus, FaCar, FaTicketAlt, FaSuitcase
} from "react-icons/fa";


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

interface UserEmployee {
    nama: string;
    email: string;
}

interface UserData {
    id_user: string;
    nama_user: string;
    employee: UserEmployee;
}

interface CabangData {
    id_cab: number;
    nama_cab: string;
}

interface TransportData {
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
    is_active: number;
    approved_by: string | null;
    created_at: string;
    updated_at: string;
    passengers: PassengerItem[];
    transport_type: TransportType;
    cabang: CabangData;
    user: UserData;
}

export default function TransportOrderDetailPage() {
    const [data, setData] = useState<TransportData | null>(null);
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

    if (isLoading) return <p className="text-center mt-10">Memuat data transportasi...</p>;
    if (!data) return <p className="text-center mt-10">Pesanan tidak ditemukan.</p>;

    const canBeModified = data.status === 'Submit';

    return (
        <>
            <ComponentCard title="Detail Pesanan Transportasi">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            {getTransportIcon(data.transport_type.name)}
                            {data.transport_type.name}
                        </h1>
                        <p className="text-gray-500 mt-1">ID Pesanan: <strong>#{data.id}</strong></p>
                    </div>
                    {getStatusBadge(data.status)}
                </div>

                {/* Action Bar (Only for Submit status) */}
                {canBeModified && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 flex-grow mb-2 md:mb-0">
                            Pesanan ini masih bisa diubah atau dibatalkan sebelum disetujui admin.
                        </p>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={() => router.push(`/orders/my-orders/transport/edit/${data.id}`)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
                            >
                                Ubah
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Info Grid (Route & Time) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <DetailItem
                        icon={<FaMapMarkerAlt />}
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
                        icon={<FaCalendarCheck />}
                        label="Tanggal Keberangkatan"
                        value={moment(data.date).format('DD MMM YYYY')}
                    />
                    <DetailItem
                        icon={<FaClock />}
                        label="Waktu / Jam"
                        value={data.time}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Passenger List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FaClipboardList /> Daftar Penumpang ({data.total_pax} Orang)
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            {data.passengers.map((passenger, index) => (
                                <div key={passenger.id} className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-800">{passenger.passenger_name}</h5>
                                            <p className="text-sm text-gray-500">
                                                No. HP: {passenger.phone_number || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Additional Details */}
                    <div className="space-y-6">
                        {/* Box 1: Ticket Details */}
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

                        {/* Box 2: Site Info */}
                        <div className="bg-white border rounded-lg p-5 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <FaBuilding className="text-gray-500" /> Request Info
                            </h4>
                            <div className="text-sm">
                                <p className="text-gray-500">Cabang:</p>
                                <p className="font-semibold text-gray-800 mb-2">{data.cabang.nama_cab}</p>
                                <p className="text-gray-500">Pemohon:</p>
                                <p className="font-semibold text-gray-800">{data.user.nama_user}</p>
                            </div>
                        </div>

                        {/* Box 3: Notes */}
                        <div className="bg-white border rounded-lg p-5 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <FaStickyNote /> Catatan Tambahan
                            </h4>
                            {data.note ? (
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap text-sm italic">"{data.note}"</p>
                            ) : (
                                <p className="text-gray-500 italic text-sm">Tidak ada catatan tambahan.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Status Info */}
                {data.status !== 'Submit' && (
                    <div className="mt-8 border-t pt-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FaUserCheck /> Log Aktivitas
                        </h4>
                        <div className="bg-gray-50 border rounded-lg p-4">
                            <p className="text-sm text-gray-600">
                                Status terakhir diperbarui pada <strong>{moment(data.updated_at).format('DD MMM YYYY, HH:mm')}</strong>
                                {data.approved_by && <span> oleh <strong>{data.approved_by}</strong></span>}.
                            </p>
                        </div>
                    </div>
                )}
            </ComponentCard>

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                // Sesuaikan URL delete/cancel jika berbeda
                url={`transport-orders/${data?.id}`}
                selectedData={data}
                itemName={`Pesanan Transportasi #${data?.id}`}
                onSuccess={() => router.push('/orders/my-orders/transport')}
                message="Pesanan transportasi berhasil dibatalkan!"
            />
        </>
    );
}

// Sub-component untuk item detail grid
const DetailItem = ({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | null, subValue?: string | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 shadow-sm hover:border-blue-300 transition-colors">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">{label}</span>
            <span className="font-bold text-gray-800 block">{value || '-'}</span>
            {subValue && <span className="text-xs text-gray-500 mt-1 block">{subValue}</span>}
        </div>
    </div>
);