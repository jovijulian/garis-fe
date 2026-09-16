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
    FaChair, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaStickyNote, FaUserCheck, FaExclamationTriangle, FaCalendarDay, FaMapMarkerAlt
} from "react-icons/fa";
import ChangeStatusModal from "@/components/modal/ChangeStatusModal";
import RescheduleModal from '@/components/modal/RescheduleModal';
import { Info, Loader2 } from "lucide-react";
import ImagePreviewModal from "@/components/modal/ImagePreviewModal";
import Badge from "@/components/ui/badge/Badge";

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
    created_at: string;
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
            return <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs md:text-sm font-medium bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500">Approved</div>;
        }
        if (status === 'Rejected') {
            return <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs md:text-sm font-medium bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"><FaTimesCircle /> Rejected</div>;
        }
        if (status === 'Canceled') {
            return <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs md:text-sm font-medium bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80"><Info /> Canceled</div>;
        }
        // Status 'Submit'
        const color = isConflicting === 1 ? "bg-yellow-100 text-yellow-800" : "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400";
        const text = isConflicting === 1 ? "Bentrok, Perlu Tinjauan" : "Submit";
        return <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs md:text-sm font-medium ${color}`}>{text}</div>;
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

    if (isLoading) {
        return (
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-4 text-gray-700">Memuat detail booking...</p>
          </div>
        );
      }
    if (!data) return <p className="text-center mt-10 text-red-500">Data booking tidak ditemukan.</p>;

    const duration = moment.duration(moment(data.end_time).diff(moment(data.start_time))).humanize();
    return (
        <ComponentCard title="Detail Booking">
            {/* --- Bagian Informasi Utama --- */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {data.purpose}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-1">
                        <span>Diajukan oleh</span>
                        <strong className="text-gray-700">
                            {data.user.nama_user}
                        </strong>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(data.status, data.is_conflicting)}
                    {/* <Badge {...getBadgeStatus(data.status, data.is_conflicting)} /> */}
                    {data.status === 'Submit' && data.is_conflicting === 0 && (
                        <div className="flex justify-end gap-2">
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
                </div>

            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <DetailItem
                    icon={<FaBuilding />}
                    label="Ruangan"
                    value={data.room.name}
                />
                <DetailItem
                    icon={<FaCalendarDay />}
                    label="Tanggal"
                    value={moment(data.start_time).format('dddd, DD MMMM YYYY')}
                />
                <DetailItem
                    icon={<FaClock />}
                    label="Waktu"
                    value={`${moment(data.start_time).format('HH:mm')} - ${moment(data.end_time).format('HH:mm')} (${duration})`}
                />
                <DetailItem
                    icon={<FaMapMarkerAlt />}
                    label="Topik"
                    value={`${data.topic.name} ${data.detail_topic ? `(${data.detail_topic})` : ''}`}
                />

            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column (lg:col-span-3) */}
                <div className="lg:col-span-3 space-y-6">
                    <Section title="Fasilitas" icon={null}>
                        {data.room.amenities && data.room.amenities.length > 0 ? (
                            <>
                                {
                                    data.room.amenities.map(item => (
                                        <InfoRow label={item.name} value="" />
                                    ))
                                }
                            </>
                        ) : (
                            <p className="text-gray-500 italic">Tidak ada fasilitas pada ruangan yang dipesan.</p>
                        )}
                    </Section>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    {/* Sticky Keperluan Box */}
                    <div className="bg-white border rounded-lg p-5 sticky top-24 space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                                Informasi Tambahan
                            </h4>
                            <div className="bg-white rounded-lg p-2 space-y-2">
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

const DetailItem = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number | null | undefined;
}) => (
    <div className="bg-white p-4 rounded-lg border flex items-start gap-4 h-full">
        <div className="text-blue-500 text-xl mt-1">{icon}</div>
        <div>
            <span className="text-gray-500 text-sm block">{label}</span>
            <span className="font-semibold text-base text-gray-800">{value || "-"}</span>
        </div>
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
            {value}
        </span>
    </div>
);