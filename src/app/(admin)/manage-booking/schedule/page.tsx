import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./schedule";
import { Metadata } from "next";
import React, { Suspense } from "react";
export const metadata: Metadata = {
    title: "Jadwal",
};


export default function BasicTables() {
    return (
        <IndexPage />
    );
}
