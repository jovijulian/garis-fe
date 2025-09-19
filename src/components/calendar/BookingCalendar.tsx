"use client";
import React, { useState, useCallback } from "react"; // 1. Import useCallback
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventSourceFunc,
} from "@fullcalendar/core";
import { useRouter } from "next/navigation";
import { endpointUrl, httpGet } from "@/../helpers";
import moment from "moment";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

const statusColors: { [key: string]: string } = {
  Approved: "success",
  Submit: "warning",
  Rejected: "danger",
  Canceled: "secondary",
};

const BookingCalendar: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 2. Bungkus semua fungsi dengan useCallback
  const fetchEvents: EventSourceFunc = useCallback(async (fetchInfo, successCallback, failureCallback) => {
    try {
      const params = {
        startDate: moment(fetchInfo.start).toISOString(),
        endDate: moment(fetchInfo.end).toISOString(),
      };
      
      const response = await httpGet(endpointUrl("/bookings"), true, params);
      const bookings = response.data.data.data;

      const formattedEvents: EventInput[] = bookings.map((booking: any) => ({
        id: booking.id.toString(),
        title: `${booking.purpose} (${booking.room.name})`,
        start: booking.start_time,
        end: booking.end_time,
        extendedProps: {
          status: booking.status,
          user: booking.user.nama_user,
        },
        className: `fc-bg-${statusColors[booking.status] || 'secondary'}`,
      }));

      successCallback(formattedEvents);

    } catch (error) {
      toast.error("Gagal memuat data booking.");
      failureCallback(error as Error);
    }
  }, []); // Dependency array kosong karena tidak bergantung pada state/props apa pun

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    router.push(`/manage-booking/${clickInfo.event.id}`);
  }, [router]); // Bergantung pada 'router'

//   const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
//     router.push(`/manage-booking/create-booking?start=${selectInfo.startStr}`);
//   }, [router]); // Bergantung pada 'router'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 relative">
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex justify-center items-center z-10 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      <div className="custom-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={fetchEvents}
          selectable={true}
        //   select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          dayMaxEvents={true}
          loading={(isLoading) => setIsLoading(isLoading)}
        />
      </div>
    </div>
  );
};

// Fungsi render ini berada di luar komponen utama, jadi tidak perlu useCallback
const renderEventContent = (eventInfo: EventContentArg) => {
  const startTime = moment(eventInfo.event.start).format('HH:mm');
  const endTime = eventInfo.event.end ? moment(eventInfo.event.end).format('HH:mm') : '';
  const timeText = endTime ? `${startTime} - ${endTime}` : startTime;

  return (
    <div className="p-1 text-xs overflow-hidden h-full">
      <b className="font-semibold">{timeText}</b>
      <p className="truncate">{eventInfo.event.title}</p>
      {eventInfo.event.extendedProps.user && (
        <p className="truncate italic text-gray-200">oleh: {eventInfo.event.extendedProps.user}</p>
      )}
    </div>
  );
};

export default BookingCalendar;