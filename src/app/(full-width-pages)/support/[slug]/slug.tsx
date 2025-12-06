"use client";

import React from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import AppHeader from "@/layout/AppHeader";
import { tutorials } from "@/data/tutorials";
import Image from "next/image";
export default function TutorialDetailPage() {
    const params = useParams();
    const slug = params.slug;
    const tutorial = tutorials.find((t) => t.slug === slug);

    if (!tutorial) {
        return <div className="p-8 text-center">Tutorial tidak ditemukan.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppHeader />

            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <Link
                    href="/support"
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Pusat Bantuan
                </Link>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-${tutorial.color}-100 dark:bg-opacity-20 hidden md:block`}>
                            <tutorial.icon className={`w-8 h-8 text-${tutorial.color}-600`} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {tutorial.title}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                {tutorial.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {tutorial.steps.map((step, index) => (
                        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-hover:bg-blue-500 transition text-slate-500 group-hover:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <span className="font-bold text-sm">{index + 1}</span>
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                    {step.desc}
                                </p>
                                {step.image && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                        <div className="bg-gray-200 aspect-video flex items-center justify-center text-gray-500 text-sm">
                                            <Image src={step.image} alt={step.title} width={600} height={338} className="object-contain w-full h-full" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="relative flex items-center justify-center md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:-translate-x-1/2 z-10">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] pl-4 md:pl-0 md:pr-10 md:text-right">
                            <span className="text-sm font-semibold text-gray-400">Tutorial Selesai</span>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}