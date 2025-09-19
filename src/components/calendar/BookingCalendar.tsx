"use client";
import React, { useState, useCallback } from "react";
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
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    router.push(`/manage-booking/${clickInfo.event.id}`);
  }, [router]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 relative">
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex justify-center items-center z-10 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      <div className="custom-calendar h-[400px] overflow-hidden">
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

      {/* Custom CSS untuk membuat kalender lebih compact - FORCE HEIGHT */}
      <style jsx global>{`
        /* FORCE HEIGHT - Pendekatan yang lebih agresif */
        .custom-calendar {
          height: 400px !important;
          max-height: 400px !important;
          overflow: hidden !important;
        }
        
        .custom-calendar .fc {
          height: 400px !important;
          max-height: 400px !important;
          font-size: 0.875rem;
        }
        
        .custom-calendar .fc-view-harness {
          height: 350px !important;
          max-height: 350px !important;
        }
        
        .custom-calendar .fc-daygrid-body {
          height: 300px !important;
          max-height: 300px !important;
        }
        
        .custom-calendar .fc-scrollgrid {
          height: 350px !important;
          max-height: 350px !important;
        }
        
        .custom-calendar .fc-daygrid-day {
          min-height: 45px !important; /* Kurangi tinggi sel hari */
          max-height: 45px !important;
          height: 45px !important;
        }
        
        .custom-calendar .fc-daygrid-day-frame {
          padding: 1px !important;
          min-height: 43px !important;
          height: 43px !important;
        }
        
        .custom-calendar .fc-daygrid-day-events {
          min-height: 20px !important;
          max-height: 25px !important;
        }
        
        .custom-calendar .fc-daygrid-event {
          margin: 0px 1px 1px 1px !important;
          font-size: 0.7rem !important;
          padding: 1px 2px !important;
          min-height: 14px !important;
          max-height: 16px !important;
        }
        
        .custom-calendar .fc-col-header-cell {
          padding: 3px !important;
          height: 25px !important;
          min-height: 25px !important;
        }
        
        .custom-calendar .fc-toolbar {
          margin-bottom: 0.25rem !important;
          padding: 0 !important;
        }
        
        .custom-calendar .fc-toolbar-chunk {
          display: flex;
          align-items: center;
        }
        
        .custom-calendar .fc-button {
          padding: 2px 6px !important;
          font-size: 0.8rem !important;
        }
        
        .custom-calendar .fc-toolbar-title {
          font-size: 1.1rem !important;
          margin: 0 !important;
        }
        
        .compact-event {
          border-radius: 2px !important;
          padding: 0px 2px !important;
          line-height: 1.1 !important;
        }
        
        .compact-day-cell {
          border: 1px solid #e5e7eb !important;
        }
        
        /* Dark mode adjustments */
        .dark .custom-calendar .fc-theme-standard td,
        .dark .custom-calendar .fc-theme-standard th {
          border-color: #374151 !important;
        }
        
        .dark .custom-calendar .fc-daygrid-day-number {
          color: #d1d5db !important;
        }
        
        /* Remove any flex-grow or expanding behavior */
        .custom-calendar .fc-daygrid-body-unbalanced .fc-daygrid-day-events {
          position: absolute;
          left: 0;
          right: 0;
        }
        
        /* Hide overflow content */
        .custom-calendar .fc-daygrid-day-top {
          flex-direction: row;
          justify-content: flex-end;
        }
        
        .custom-calendar .fc-daygrid-day-number {
          padding: 2px 4px !important;
          font-size: 0.8rem !important;
        }
      `}</style>
    </div>
  );
};

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