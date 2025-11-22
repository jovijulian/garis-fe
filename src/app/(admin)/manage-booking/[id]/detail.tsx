"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import moment from "moment";
import 'moment/locale/id';
import { endpointUrl, httpGet, httpPost, httpPut } from "@/../helpers";

import ComponentCard from "@/components/common/ComponentCard";
import {
    FaCalendarAlt, FaClock, FaUser, FaBuilding, FaClipboardList, FaInfoCircle,
    FaChair, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaStickyNote, FaUserCheck, FaExclamationTriangle
} from "react-icons/fa";
import ChangeStatusModal from "@/components/modal/ChangeStatusModal";
import RescheduleModal from '@/components/modal/RescheduleModal';
import { Info } from "lucide-react";
import ImagePreviewModal from "@/components/modal/ImagePreviewModal";

interface User {
    id_user: string;
    nama_user: string;
}

interface Room {
    id: number;
    name: string;
    location: string;
    amenities: { id: number; name: string }[];
}

interface Topic {
    id: number;
    name: string;
}

interface BookingAmenity {
    id: number;
    name: string;
}

interface BookingData {
    id: number;
    purpose: string;
    start_time: string;
    detail_topic: string;
    end_time: string;
    status: 'Submit' | 'Approved' | 'Rejected' | 'Canceled';
    notes: string | null;
    is_conflicting: number;
    approved_by: string | null;
    updated_at: string;
    user: User;
    room: Room;
    topic: Topic;
    amenities: BookingAmenity[];
    proof_of_booking_path: string | null;
    admin_note: string | null;
}

export default function BookingDetailPage() {
    const [data, setData] = useState<BookingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [adminNote, setAdminNote] = useState<string>(""); // <-- State baru
    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const imageUrl = process.env.IMAGE_URL
    moment.locale('id');

    useEffect(() => {
        if (id) {
            getDetail();
        }
    }, [id]);
    const getDetail = async () => {
        setIsLoading(true);
        try {
            const response = await httpGet(endpointUrl(`bookings/${id}`), true);
            setData(response.data.data);
        } catch (error) {
            toast.error("Gagal mengambil detail booking.");
            console.error("Error fetching booking details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (action: 'Approved' | 'Rejected') => {
        setActionType(action);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!actionType) return;

        setIsSubmitting(true);
        try {
            await httpPut(endpointUrl(`bookings/status/${id}`), { status: actionType }, true);
            toast.success(`Booking berhasil diubah menjadi "${actionType}"`);
            setData(prevData => prevData ? { ...prevData, status: actionType } : null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Gagal mengubah status.`);
        } finally {
            setIsSubmitting(false);
            setIsModalOpen(false);
        }
    };


    const handleOpenRescheduleModal = (booking: any) => {
        setData(booking);
        setIsRescheduleModalOpen(true);
    };

    const getStatusBadge = (status: string, isConflicting: number) => {
        if (status === 'Approved') {
            return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"><FaCheckCircle /> Disetujui</div>;
        }
        if (status === 'Rejected') {
            return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"><FaTimesCircle /> Ditolak</div>;
        }
        if (status === 'Canceled') {
            return <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800"><Info /> Dibatalkan</div>;
        }
        // Status 'Submit'
        const color = isConflicting === 1 ? "bg-orange-100 text-orange-800" : "bg-yellow-100 text-yellow-800";
        const text = isConflicting === 1 ? "Bentrok, Perlu Tinjauan" : "Menunggu Persetujuan";
        return <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${color}`}><FaHourglassHalf /> {text}</div>;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !data) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('proofFile', selectedFile);
            formData.append('admin_note', adminNote);

            await httpPost(endpointUrl(`bookings/upload-proof/${data.id}`), formData, true);


            toast.success("Bukti booking berhasil diupload!");
            if (data.id) getDetail();
            setSelectedFile(null);
            setAdminNote("");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenPreview = (url: string) => {
        setPreviewImageUrl(url);
        setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewImageUrl(null);
        setIsPreviewOpen(false);
    };

    if (isLoading) return <p className="text-center mt-10 text-gray-400">Memuat detail booking...</p>;
    if (!data) return <p className="text-center mt-10 text-red-500">Data booking tidak ditemukan.</p>;

    const duration = moment.duration(moment(data.end_time).diff(moment(data.start_time))).humanize();

    return (
        <ComponentCard title="Detail Booking">
            {/* --- Bagian Informasi Utama --- */}
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{data.purpose}</h3>
                        <p className="text-gray-500">Topik: <strong>{data.topic.name} {data.detail_topic ? `(${data.detail_topic})` : ''}</strong></p>
                        <p className="text-gray-500">Diajukan oleh: <strong>{data.user.nama_user}</strong></p>
                    </div>
                    {getStatusBadge(data.status, data.is_conflicting)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
                    <div className="bg-white p-4 rounded-lg border flex items-center gap-4">
                        <FaBuilding className="w-6 h-6 text-blue-500" />
                        <div>
                            <span className="text-gray-500 block">Ruangan</span>
                            <span className="font-semibold text-base">{data.room.name}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border flex items-center gap-4">
                        <FaCalendarAlt className="w-6 h-6 text-blue-500" />
                        <div>
                            <span className="text-gray-500 block">Tanggal</span>
                            <span className="font-semibold text-base">{moment(data.start_time).format('dddd, DD MMMM YYYY')}</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border flex items-center gap-4">
                        <FaClock className="w-6 h-6 text-blue-500" />
                        <div>
                            <span className="text-gray-500 block">Waktu</span>
                            <span className="font-semibold text-base">
                                {moment(data.start_time).format('HH:mm')} - {moment(data.end_time).format('HH:mm')} ({duration})
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Tombol Aksi untuk Admin --- */}
            {data.status === 'Submit' && data.is_conflicting === 0 && (
                <div className="flex justify-end gap-3 mb-6">
                    <button onClick={() => handleOpenModal('Rejected')} className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">
                        Tolak
                    </button>
                    <button onClick={() => handleOpenModal('Approved')} className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all">
                        Setujui
                    </button>
                </div>
            )}

            {data.is_conflicting == 1 && data.status === 'Submit' && (
                <div className="flex justify-end gap-3 mb-6">
                    <button
                        onClick={() => handleOpenRescheduleModal(data)}
                        title="Selesaikan Konflik Jadwal"
                        className="p-2 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-all flex items-center gap-2 text-sm"
                    >
                        <FaExclamationTriangle className="w-4 h-4" />
                        <span>Atur Ulang</span>
                    </button>
                </div>
            )
            }

            {/* --- Detail Fasilitas dan Catatan --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaClipboardList />Fasilitas pada ruangan</h4>
                    <div className="bg-white border rounded-lg p-5">
                    {data.room.amenities && data.room.amenities.length > 0 ? (
                            <ul className="space-y-3">
                                {data.room.amenities.map(item => (
                                    <li key={item.id} className="flex items-center gap-3 text-gray-800">
                                        <FaChair className="text-gray-400" />
                                        <span>{item.name}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">Tidak ada fasilitas pada ruangan yang dipesan.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaInfoCircle /> Informasi Tambahan</h4>
                    <div className="bg-white border rounded-lg p-5 space-y-4">
                        {data.notes && (
                            <div>
                                <h5 className="font-semibold flex items-center gap-2 mb-1"><FaStickyNote /> Catatan dari Pemesan</h5>
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{data.notes}</p>
                            </div>
                        )}
                        {data.status !== 'Submit' && (
                            <div>
                                <h5 className="font-semibold flex items-center gap-2 mb-1"><FaUserCheck /> Status Diperbarui Oleh</h5>
                                <p className="text-gray-600">{data.approved_by || 'N/A'} pada {moment(data.updated_at).format('DD MMM YYYY, HH:mm')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {data.status == 'Approved' && (
                <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">
                        Bukti Booking & Catatan Admin
                    </h4>
                    <div className="bg-white border rounded-lg p-5 space-y-4">
                        {data.proof_of_booking_path && (
                            <div className="mb-4 pb-4 border-b">
                                <p className="font-semibold mb-2">Bukti Saat Ini:</p>
                                <button
                                    type="button"
                                    onClick={() => handleOpenPreview(`${imageUrl}${data.proof_of_booking_path}`)}
                                    className="text-blue-600 hover:underline font-semibold"
                                >
                                    Lihat Bukti
                                </button>

                                {data.admin_note && (
                                    <div className="mt-3">
                                        <p className="font-semibold mb-1">Catatan Admin:</p>
                                        <p className="text-gray-600 bg-gray-50 p-2 rounded-md">{data.admin_note}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <label htmlFor="file-upload" className="block font-medium">
                                {data.proof_of_booking_path ? 'Ganti' : 'Upload'} Bukti Baru
                            </label>
                            <input
                                id="file-upload" type="file" onChange={handleFileChange}
                                accept="image/png, image/jpeg, application/pdf"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {selectedFile && (
                                <div className="space-y-3 pt-2">
                                    <div>
                                        <label htmlFor="admin-note" className="block font-medium mb-1">Catatan (Opsional)</label>
                                        <textarea
                                            id="admin-note"
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            rows={3}
                                            placeholder="Tambahkan catatan terkait bukti ini..."
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <button
                                            onClick={handleUpload}
                                            disabled={isUploading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isUploading ? 'Mengupload...' : 'Upload'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal Konfirmasi --- */}
            <ChangeStatusModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleUpdateStatus}
                booking={data}
                actionType={actionType}
                isSubmitting={isSubmitting}
            />
            <RescheduleModal
                isOpen={isRescheduleModalOpen}
                booking={data}
                onClose={() => setIsRescheduleModalOpen(false)}
                onSuccess={getDetail}
            // onSuccess={getData}
            />
            <ImagePreviewModal
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                imageUrl={previewImageUrl}
                imageTitle="Preview Bukti Booking"
            />
        </ComponentCard>
    );
}