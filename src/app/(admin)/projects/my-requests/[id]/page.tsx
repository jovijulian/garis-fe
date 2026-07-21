import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import IndexPage from "./detail";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Detail Request Proyek",
};

export default function DetailProjectRequestPage() {
    return (
        <div>
            <PageBreadcrumb pageTitle="Detail Request Proyek" />
            <IndexPage />
        </div>
    );
}
