import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./my-assignments";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Penugasan",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Riwayat Penugasan Anda" />
            <IndexPage />
        </div>
    );
}
