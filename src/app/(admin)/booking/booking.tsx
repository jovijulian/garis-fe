"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Plus, Info } from 'lucide-react';
import { endpointUrl, httpGet, httpDelete } from '../../../../helpers';
import { toast } from 'react-toastify';

import BookingCard from '@/components/booking/BookingCard';
import BookingFormModal from '@/components/booking/BookingFormModal';
import DeactiveModal from "@/components/modal/deactive/Deactive";

interface RoomInfo {
    id: number;
    name: string;
}
interface Booking {
    id: number;
    purpose: string;
    booking_date: string;
    start_time: string;
    duration_minutes: number;
    status: 'Submit' | 'Approved' | 'Rejected';
    room: RoomInfo;
}

export default function CustomerPortalPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const fetchUserBookings = useCallback(async () => {
        try {
            setError(null);
            setIsLoading(true);
            const response = await httpGet(endpointUrl("/bookings/user"), true);
            setBookings(response.data.data.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load your booking list.");
            toast.error("Failed to load your booking list.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserBookings();
    }, [fetchUserBookings]);

    const handleOpenCreateModal = () => {
        setSelectedBooking(null);
        setFormModalOpen(true);
    };

    const handleOpenEditModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setFormModalOpen(true);
    };

    const handleOpenDeleteModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setDeleteModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="ml-4 text-gray-700">Loading your booking...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">There is an error</h2>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Bookings</h1>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create a New Booking</span>
                    </button>
                </div>

                {bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map(booking => (
                            <BookingCard 
                                key={booking.id} 
                                booking={booking}
                                onEdit={() => handleOpenEditModal(booking)}
                                onDelete={() => handleOpenDeleteModal(booking)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow">
                        <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-700">No Bookings Yet</h3>
                        <p className="text-gray-500 mt-2">You've never made a booking before. Please make your first booking!</p>
                    </div>
                )}
            </div>

            <BookingFormModal
                isOpen={isFormModalOpen}
                onClose={() => setFormModalOpen(false)}
                onSuccess={fetchUserBookings}
                bookingData={selectedBooking}
            />
             <DeactiveModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedBooking(null);
                }}
                url={`rooms/${selectedBooking?.id}`}
                itemName={selectedBooking?.room.name || ""}
                selectedData={selectedBooking}
                onSuccess={fetchUserBookings}
                message="Booking deleted successfully!"
            />

          
        </>
    );
}