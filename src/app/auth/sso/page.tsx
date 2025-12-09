import SSO from "./sso";
import { Metadata } from "next";
import { Suspense } from "react";
export const metadata: Metadata = {
    title: "SSO | GARIS PT. Cisangkan",
};

export default function SSOPage() {

    return <Suspense
        fallback={
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        }
    ><SSO />
    </Suspense>
}
