import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./my-requests";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Pengajuan Proyek",
};

export default function MyProjectRequestsPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Riwayat Pengajuan Proyek Anda" />
            <IndexPage />
        </div>
    );
}
