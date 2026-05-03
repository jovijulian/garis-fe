import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./my-loans";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Peminjaman",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Peminjaman Anda" />
            <IndexPage />
        </div>
    );
}
