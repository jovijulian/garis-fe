"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPut } from "@/../helpers";
import ComponentCard from "@/components/common/ComponentCard";
import {
    FaUser, FaBuilding, FaMapMarkerAlt, FaUsers, FaClock, FaClipboardList, FaStickyNote, FaPrint,
    FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBox, FaUtensils, FaCalendarDay
} from "react-icons/fa";
import ChangeStatusOrderModal from "@/components/modal/ChangeStatusOrderModal";
import { CircleX, Printer } from "lucide-react";
import CancelOrderModal from "@/components/modal/CancelOrderModal";


// --- Interface Disesuaikan dengan Respons API Baru ---
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
    created_at: string;
    approved_by: string | null;
    cabang: { nama_cab: string; };
    user: { nama_user: string; };
    room: { name: string; } | null;
    booking: any | null;
    details: OrderDetailItem[]; // Array untuk detail item
}


export default function OrderDetailPage() {
    const [data, setData] = useState<OrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
    moment.locale('id');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

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


    // --- Logika lain (getStatusBadge, handlePrint, modal) tetap sama ---
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

    const handlePrint = async () => {
        try {
            const response = await httpGet(endpointUrl(`/orders/${id}/receipt`), true);
            const htmlContent = response.data;

            if (!htmlContent) {
                toast.error('Gagal mendapatkan data nota untuk dicetak.');
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
            console.error('Gagal mencetak nota:', error);
            toast.error('Terjadi kesalahan saat menyiapkan nota.');
        }
    };

    const handleOpenModal = (order: OrderData, action: 'Approved' | 'Rejected') => {
        setData(order);
        setActionType(action);
        setIsStatusModalOpen(true);
    };
    const handleUpdateStatus = async () => {
        if (!actionType || !data) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`orders/status/${data.id}`), { status: actionType }, true);
            toast.success(`Order berhasil diubah menjadi "${actionType}"`);
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsStatusModalOpen(false);
        }
    };
    const handleOpenCancelModal = (order: any) => {
        setData(order);
        setIsCancelModalOpen(true);
    };
    const handleConfirmCancel = async () => {
        if (!data) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`orders/cancel/${data.id}`), {}, true);
            toast.success("Order berhasil dibatalkan.");
            getDetail();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal membatalkan order.");
        } finally {
            setIsSubmitting(false);
            setIsCancelModalOpen(false);
        }
    };

    if (isLoading) return <p className="text-center mt-10">Memuat data pesanan...</p>;
    if (!data) return <p className="text-center mt-10">Pesanan tidak ditemukan.</p>;

    const locationName = data.room ? data.room.name : (data.booking?.room?.name || data.location_text);

    return (
        <ComponentCard title="Detail Pesanan">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    {/* Judul utama sekarang adalah 'purpose' */}
                    <h1 className="text-3xl font-bold text-gray-800">{data.purpose}</h1>
                    <p className="text-gray-500">Diajukan oleh: <strong>{data.user.nama_user}</strong></p>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(data.status)}
                    {data.status === 'Approved' && (
                        <>
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800">
                                <Printer /> Cetak Nota
                            </button>
                            <button onClick={() => handleOpenCancelModal(data)} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200">
                                <CircleX className="text-red-500" /> Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Panel Info Umum Disesuaikan */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <DetailItem icon={<FaBuilding />} label="Cabang" value={data.cabang.nama_cab} />
                <DetailItem icon={<FaMapMarkerAlt />} label="Lokasi/Ruangan" value={locationName} />
                <DetailItem icon={<FaCalendarDay />} label="Tanggal Pesanan" value={moment(data.order_date).format('DD MMM YYYY')} />
                <DetailItem icon={<FaUsers />} label="Jumlah Orang" value={`${data.pax}`} />
            </div>

            {/* Bagian Konten Utama Disesuaikan */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><FaClipboardList /> Detail Item Dipesan</h4>
                    {/* Melakukan map pada array 'details' */}
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


            {data.status === 'Submit' && (
                <div className="flex justify-end gap-3 mt-6">
                    <button className="px-5 py-2 rounded-lg bg-red-600 text-white" onClick={() => handleOpenModal(data, "Rejected")}>Tolak</button>
                    <button className="px-5 py-2 rounded-lg bg-green-600 text-white" onClick={() => handleOpenModal(data, "Approved")}>Setujui</button>
                </div>
            )}

            {/* Modal tidak perlu diubah karena logikanya sama */}
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

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4">
        <div className="text-gray-400 mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || '-'}</span>
        </div>
    </div>
);