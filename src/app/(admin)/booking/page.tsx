import type { Metadata } from "next";
import React from "react";
import Booking from "./booking";

export const metadata: Metadata = {
    title:
        "Booking Apps",
};

export default function BookingPage() {
    return (
        <>
            <Booking />
        </>
    );
}
