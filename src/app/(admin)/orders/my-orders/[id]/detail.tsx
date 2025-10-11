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
    FaUtensils, FaClock, FaUsers, FaBuilding, FaMapMarkerAlt, FaClipboardList, FaStickyNote,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUserCheck, FaBox, FaCalendarDay
} from "react-icons/fa";

interface OrderDetailItem {
    id: number;
    menu: string;
    qty: number;
    delivery_time: string;
    consumption_type: {
        id: number;
        name: string;
    };
}

interface OrderData {
    id: number;
    purpose: string;
    pax: number;
    order_date: string; 
    note: string | null;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Completed' | 'Canceled';
    location_text: string | null;
    approved_by: string | null;
    updated_at: string;
    cabang: { nama_cab: string; };
    user: { nama_user: string; };
    room: { name: string; } | null;
    booking: any | null; 
    details: OrderDetailItem[]; 
}

export default function MyOrderDetailPage() {
    const [data, setData] = useState<OrderData | null>(null);
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
            const response = await httpGet(endpointUrl(`orders/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            toast.error("Gagal mengambil detail pesanan.");
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
        };
        const currentStatus = statusMap[status as keyof typeof statusMap] || statusMap['Submit'];
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>
                {currentStatus.icon} {currentStatus.label}
            </div>
        );
    };

    if (isLoading) return <p className="text-center mt-10">Memuat pesanan Anda...</p>;
    if (!data) return <p className="text-center mt-10">Pesanan tidak ditemukan.</p>;

    const locationName = data.room ? data.room.name : (data.booking?.room?.name || data.location_text);

    const canBeModified = data.status === 'Submit';

    return (
        <>
            <ComponentCard title="Detail Pesanan Anda">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{data.purpose}</h1>
                        <p className="text-gray-500">ID Pesanan: <strong>#{data.id}</strong></p>
                    </div>
                    {getStatusBadge(data.status)}
                </div>

                {canBeModified && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 flex-grow mb-2 md:mb-0">
                            Pesanan Anda masih bisa diubah atau dibatalkan.
                        </p>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={() => router.push(`/orders/edit/${data.id}`)}
                                className="px-4 py-2 w-full md:w-auto rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
                            >
                                Ubah
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <DetailItem icon={<FaBuilding />} label="Cabang" value={data.cabang.nama_cab} />
                    <DetailItem icon={<FaMapMarkerAlt />} label="Lokasi/Ruangan" value={locationName} />
                    <DetailItem icon={<FaCalendarDay />} label="Tanggal Pesanan" value={moment(data.order_date).format('DD MMM YYYY')} />
                    <DetailItem icon={<FaUsers />} label="Jumlah Orang" value={`${data.pax}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><FaClipboardList /> Detail Item Dipesan</h4>
                        {data.details.map((item) => (
                            <div key={item.id} className="bg-white border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h5 className="font-bold text-blue-700 flex items-center gap-2"><FaUtensils />{item.consumption_type.name}</h5>
                                        <p className="text-gray-800 text-lg">{item.menu}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <div className="font-bold text-gray-800 text-xl flex items-center gap-2">
                                            {item.qty} pax
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t mt-3 pt-3 text-sm text-gray-600 flex items-center gap-2">
                                    <FaClock className="text-gray-400" />
                                    <span>Waktu Antar: {moment(item.delivery_time).format('DD MMM YYYY, HH:mm')}</span>
                                </div>
                            </div>
                        ))}
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
                            <p>Status terakhir diperbarui pada {moment(data.updated_at).format('DD MMM YYYY, HH:mm')} oleh <strong>{data.approved_by || 'Sistem'}</strong>.</p>
                        </div>
                    </div>
                )}
            </ComponentCard>

            <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                url={`orders/${data?.id}`}
                selectedData={data}
                itemName={data?.purpose || ""}
                onSuccess={() => router.push('/orders/my-orders')}
                message="Pesanan berhasil dibatalkan!"
            />
        </>
    );
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);