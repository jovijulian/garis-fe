import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import DetailPage from "./detail"
import React from "react";

export const metadata: Metadata = {
    title: "Detail Booking",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Detail booking" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <DetailPage />
                </div>
            </div>
        </div>
    );
}
