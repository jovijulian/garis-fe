import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CreatePage from "./create"
import React from "react";

export const metadata: Metadata = {
    title: "Tambah Kendaraan",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Tambah Kendaraan" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
