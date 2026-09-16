import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./detail";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Detail Pengajuan Reimbursement",
};

export default function DetailReimbursementPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Detail Pengajuan Reimbursement" />
            <IndexPage />
        </div>
    );
}
