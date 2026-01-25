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
        startDate: moment(fetchInfo.start).format('YYYY-MM-DD HH:mm:ss'),
        endDate: moment(fetchInfo.end).format('YYYY-MM-DD HH:mm:ss')
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
          room: booking.room.name,
          purpose: booking.purpose,
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
            right: "",
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

      {/* Custom CSS untuk membuat kalender lebih compact - ENHANCED EVENT SIZE */}
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
        
        /* ENHANCED DAY CELLS - Bigger for better event display */
        .custom-calendar .fc-daygrid-day {
          min-height: 55px !important; /* Increased from 45px */
          max-height: 55px !important;
          height: 55px !important;
        }
        
        .custom-calendar .fc-daygrid-day-frame {
          padding: 2px !important; /* Increased padding */
          min-height: 53px !important;
          height: 53px !important;
        }
        
        .custom-calendar .fc-daygrid-day-events {
          min-height: 32px !important; /* More space for events */
          max-height: 38px !important;
        }
        
        /* ENHANCED EVENT STYLING - Bigger and more readable */
        .custom-calendar .fc-daygrid-event {
          overflow: auto !important;
        }
        
        /* EVENT HOVER EFFECTS */
        .custom-calendar .fc-daygrid-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          transition: all 0.2s ease !important;
        }
        
        /* EVENT TEXT STYLING */
        .custom-calendar .fc-event-title {
          font-weight: 500 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        
        .custom-calendar .fc-event-time {
          font-weight: 600 !important;
          font-size: 0.7rem !important;
        }
        
        /* HEADER STYLING */
        .custom-calendar .fc-col-header-cell {
          padding: 4px !important; /* Slightly more padding */
          height: 28px !important;
          min-height: 28px !important;
          font-weight: 600 !important;
        }
        
        .custom-calendar .fc-toolbar {
          margin-bottom: 0.5rem !important;
          padding: 0 !important;
        }
        
        .custom-calendar .fc-toolbar-chunk {
          display: flex;
          align-items: center;
        }
        
        .custom-calendar .fc-button {
          padding: 3px 8px !important;
          font-size: 0.85rem !important;
        }
        
        .custom-calendar .fc-toolbar-title {
          font-size: 1.15rem !important;
          margin: 0 !important;
          font-weight: 600 !important;
        }
        
        /* DAY NUMBER STYLING */
        .custom-calendar .fc-daygrid-day-number {
          padding: 3px 5px !important;
          font-size: 0.85rem !important;
          font-weight: 500 !important;
        }
        
        /* MORE LINK STYLING */
        .custom-calendar .fc-daygrid-more-link {
          font-size: 0.7rem !important;
          padding: 1px 3px !important;
          background: rgba(59, 130, 246, 0.1) !important;
          color: rgb(59, 130, 246) !important;
          border-radius: 3px !important;
          margin: 1px !important;
        }
        
        /* POPOVER STYLING for more events */
        .fc-popover {
          z-index: 9999 !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
          border-radius: 8px !important;
          border: none !important;
        }
        
        .fc-popover-body {
          padding: 8px !important;
        }
        
        .fc-popover .fc-event {
          margin: 2px 0 !important;
          padding: 4px 6px !important;
          font-size: 0.8rem !important;
          border-radius: 4px !important;
        }
        
        .compact-event {
          border-radius: 4px !important;
          padding: 2px 4px !important;
          line-height: 1.2 !important;
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
        
        .dark .fc-popover {
          background: rgb(31, 41, 55) !important;
          color: white !important;
        }
        
        /* Remove any flex-grow or expanding behavior */
        .custom-calendar .fc-daygrid-body-unbalanced .fc-daygrid-day-events {
          position: absolute;
          left: 0;
          right: 0;
        }
        
        /* Status color variations for better visibility */
        .custom-calendar .fc-bg-success {
          background-color: #10b981 !important;
          color: white !important;
        }
        
        .custom-calendar .fc-bg-warning {
          background-color: #f59e0b !important;
          color: white !important;
        }
        
        .custom-calendar .fc-bg-danger {
          background-color: #ef4444 !important;
          color: white !important;
        }
        
        .custom-calendar .fc-bg-secondary {
          background-color: #6b7280 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

// Enhanced render function with better layout
const renderEventContent = (eventInfo: EventContentArg) => {
  const startTime = moment(eventInfo.event.start).format('HH:mm');
  const endTime = eventInfo.event.end ? moment(eventInfo.event.end).format('HH:mm') : '';
  const timeText = endTime ? `${startTime}-${endTime}` : startTime;

  return (
    <div className="flex flex-col h-full justify-center px-1" style={{ minHeight: '16px' }}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs truncate flex-1">
          {timeText}
        </span>
      </div>
      <div className="text-xs truncate leading-tight">
        {eventInfo.event.extendedProps.purpose}
      </div>
      {eventInfo.event.extendedProps.room && (
        <div className="text-xs truncate opacity-90 leading-tight">
          {eventInfo.event.extendedProps.room}
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;