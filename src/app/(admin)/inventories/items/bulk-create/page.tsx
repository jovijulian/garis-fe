import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CreatePage from "./bulk-create"
import React from "react";

export const metadata: Metadata = {
    title: "Tambah Data Barang",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Tambah Data Barang" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
