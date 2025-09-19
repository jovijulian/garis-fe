import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CalendarPage from "./calendar-booking"
import React from "react";

export const metadata: Metadata = {
    title: "Kalendar Booking",
};

export default function FormElements() {
    return (
        <div>
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CalendarPage />
                </div>
            </div>
        </div>
    );
}
