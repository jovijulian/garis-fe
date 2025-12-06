"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, ChevronRight, ArrowLeft } from "lucide-react";
import AppHeader from "@/layout/AppHeader";
import { tutorials } from "@/data/tutorials";

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const filteredTutorials = tutorials.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppHeader />

            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
                <div className="space-y-4">
                    <Link href="/menus" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Menu
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Pusat Bantuan & Tutorial
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Temukan panduan langkah demi langkah untuk menggunakan aplikasi ini.
                    </p>

                    <div className="relative max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari tutorial (misal: booking ruangan)..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTutorials.length > 0 ? (
                        filteredTutorials.map((item) => (
                            <Link key={item.slug} href={`/support/${item.slug}`} className="group">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${item.color}-100 dark:bg-opacity-20`}>
                                        <item.icon className={`w-6 h-6 text-${item.color}-600 dark:text-${item.color}-400`} />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm flex-1">
                                        {item.description}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                                        Baca Panduan <ChevronRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Tidak ada tutorial yang cocok dengan pencarian Anda.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}