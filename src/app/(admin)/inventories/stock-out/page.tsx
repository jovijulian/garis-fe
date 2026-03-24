import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CreatePage from "./stock-out"
import React from "react";

export const metadata: Metadata = {
    title: "Pengeluaran / Barang Keluar",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Pengeluaran / Barang Keluar" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
