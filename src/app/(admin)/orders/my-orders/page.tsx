import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./my-orders";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Pemesanan",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Riwayat Pemesanan Anda" />
            <IndexPage />
        </div>
    );
}
