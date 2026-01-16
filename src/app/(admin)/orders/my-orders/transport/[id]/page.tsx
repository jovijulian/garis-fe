import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./detail";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Detail Pemesanan",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Detail Pemesanan" />
            <IndexPage />
        </div>
    );
}
