import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./choose";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Pemesanan",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="" />
            <IndexPage />
        </div>
    );
}
