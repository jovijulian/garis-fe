import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./my-requests";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Pengajuan",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Riwayat Pengajuan Anda" />
            <IndexPage />
        </div>
    );
}
