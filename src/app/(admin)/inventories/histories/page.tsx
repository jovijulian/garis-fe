import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./histories";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Riwayat Transaksi",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Riwayat Transaksi" />
            <IndexPage />
        </div>
    );
}
