import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./detail";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Detail Penugasan",
};


export default function BasicTables() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Detail Penugasan" />
            <IndexPage />
        </div>
    );
}
