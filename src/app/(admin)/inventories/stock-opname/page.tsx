import PageBreadcrumb from "@/components/common/PageBreadCrumb";

import { Metadata } from "next";
import CreatePage from "./stock-opname"
import React from "react";

export const metadata: Metadata = {
    title: "Stok Opname",
};

export default function FormElements() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Stock Opname" />
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-6">
                    <CreatePage />
                </div>
            </div>
        </div>
    );
}
