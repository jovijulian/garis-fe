import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CreatePage from "./stock-in"
import React from "react";

export const metadata: Metadata = {
    title: "Penerimaan / Barang Masuk",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Penerimaan / Barang Masuk" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
