import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./my-bookings";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Booking Saya",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Riwayat Pengajuan Booking" />
            <IndexPage />
        </div>
    );
}
