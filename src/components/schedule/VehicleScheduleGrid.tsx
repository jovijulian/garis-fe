"use client";

import React from 'react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { Tooltip } from 'react-tooltip';

interface VehicleColumn {
    id: number;
    name: string;
    licensePlate: string;
    vehicleTypeId: number;
}
interface BookingItem {
    id: number;
    requestId: number;
    vehicleId: number;
    startTime: string;
    endTime: string;
    purpose: string;
    requester: string;
    status: string;
    destination: string;
    driver: string;
}
export interface ScheduleData {
    columns: VehicleColumn[];
    bookings: BookingItem[];
    timeSlots: string[];
}
interface ScheduleGridProps {
    data: ScheduleData;
    selectedDate: string;
    role: string;
}

const VehicleScheduleGrid: React.FC<ScheduleGridProps> = ({ data, selectedDate, role }) => {
    const { columns, bookings, timeSlots } = data;
    const router = useRouter();

    const getGridPosition = (startTimeStr: string, endTimeStr: string) => {
        const start = moment(startTimeStr);
        const end = moment(endTimeStr);
        const startRow = start.hour() + 2;
        let endRow = end.hour() + 2;

        if (end.isAfter(start, 'day') || (end.isSame(start, 'day') && end.hour() === 0)) {
            endRow = timeSlots.length + 2;
        }
        if (startRow === endRow) {
            endRow += 1;
        }
        return { gridRow: `${startRow} / ${endRow}` };
    };

    const handleSlotClick = (vehicleTypeId: number, time: string) => {
        const dateTime = moment(selectedDate).hour(parseInt(time)).format('YYYY-MM-DDTHH:mm');
        const targetUrl = ["1", "2"].includes(role)
            ? `/vehicles/create-admin?requested_vehicle_type_id=${vehicleTypeId}&start_time=${dateTime}`
            : `/vehicles/create?requested_vehicle_type_id=${vehicleTypeId}&start_time=${dateTime}`;
        router.push(targetUrl);
    };

    const handleBookingClick = (bookingRequestId: number) => {
        if (["1", "2"].includes(role)) {
            router.push(`/vehicles/manage-requests/${bookingRequestId}`);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto relative">
            <div
                className="grid"
                style={{
                    gridTemplateColumns: `minmax(40px, auto) repeat(${columns.length}, 1fr)`,

                    gridTemplateRows: `auto repeat(${timeSlots.length}, 35px)`,
                }}
            >
                <div className="sticky top-0 left-0 bg-gray-700 border-b border-r border-gray-600"></div>

                {columns.map((col, index) => (
                    <div
                        key={col.id}
                        className="sticky top-0 bg-gray-700 text-white font-semibold p-1 text-center border-b border-r border-gray-600 text-[10px]"
                        style={{ gridColumn: index + 2 }}
                    >
                        {col.name}
                        <span className="block text-[8px] font-light text-gray-300">{col.licensePlate}</span>
                    </div>
                ))}

                {timeSlots.map((time, index) => (
                    <div
                        key={time}
                        className="sticky left-0 bg-gray-700 text-gray-300 text-xs p-1 text-right border-b border-r border-gray-600"
                        style={{ gridRow: index + 2 }}
                    >
                        {time}
                    </div>
                ))}

                {columns.map((col, colIndex) => (
                    <React.Fragment key={`col-${col.id}`}>
                        {timeSlots.map((time, rowIndex) => (
                            <div
                                key={`cell-${col.id}-${time}`}
                                className="border-b border-r border-gray-600 hover:bg-gray-700 cursor-pointer"
                                style={{
                                    gridColumn: colIndex + 2,
                                    gridRow: rowIndex + 2,
                                }}
                                onClick={() => handleSlotClick(col.vehicleTypeId, time)}
                                title={`Buat booking untuk ${col.name} @ ${time}`}
                            >
                            </div>
                        ))}
                    </React.Fragment>
                ))}

                {bookings.map((booking) => {
                    const colIndex = columns.findIndex(c => c.id === booking.vehicleId);
                    if (colIndex === -1) return null;
                    const position = getGridPosition(booking.startTime, booking.endTime);

                    return (
                        <div
                            key={booking.id}
                            className="bg-indigo-600 bg-opacity-90 border border-indigo-700 rounded p-0.5 text-white overflow-hidden shadow-md m-0.5 cursor-pointer hover:bg-indigo-500"
                            style={{
                                gridColumn: colIndex + 2,
                                gridRow: position.gridRow,
                            }}
                            data-tooltip-id="booking-tooltip"
                            data-tooltip-html={`
                          <strong>${booking.requester}</strong><br/>
                          ${moment(booking.startTime).format('HH:mm')} - ${moment(booking.endTime).format('HH:mm')}<br/>
                          Keperluan: ${booking.purpose}<br/>
                          Status: ${booking.status}<br/>
                          Tujuan: ${booking.destination}<br/>
                          Supir: ${booking.driver}<br/>
                        `}
                            onClick={() => handleBookingClick(booking.requestId)}
                        >
                            <div className="h-full flex items-center justify-center">
                                <div className="font-medium text-[9px] text-center truncate">
                                    Booked by {booking.requester}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Tooltip id="booking-tooltip" />
        </div>
    );
};

export default VehicleScheduleGrid;