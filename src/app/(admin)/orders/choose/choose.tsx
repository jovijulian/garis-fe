"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import ComponentCard from '@/components/common/ComponentCard';
import { FaUtensils, FaHotel } from 'react-icons/fa';
import { BusFront, ChevronRight } from 'lucide-react';

export default function ChooseOrderTypePage() {
  const router = useRouter();

  const choices = [
    {
      title: 'Order Konsumsi',
      description: 'Pesan konsumsi untuk rapat atau acara kantor.',
      icon: <FaUtensils className="text-orange-500" />,
      path: '/orders/create', // Path existing
      color: 'hover:border-orange-500 bg-orange-50/30'
    },
    {
      title: 'Akomodasi / Hotel',
      description: 'Pesan kamar hotel dan penginapan tamu.',
      icon: <FaHotel className="text-blue-500" />,
      path: '/orders/create-accommodation', // Path baru
      color: 'hover:border-blue-500 bg-blue-50/30'
    },
    {
      title: 'Transportasi',
      description: 'Pesan layanan transportasi untuk perjalanan dinas.',
      icon: <BusFront className="text-green-500" />,
      path: '/orders/create-transport',
      color: 'hover:border-green-500 bg-green-50/30'
    }

  ];

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Pilih Tipe Pesanan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {choices.map((item, index) => (
          <button
            key={index}
            onClick={() => router.push(item.path)}
            className={`p-8 border-2 border-gray-200 rounded-2xl text-left transition-all group flex items-start gap-6 shadow-sm ${item.color}`}
          >
            <div className="text-4xl mt-1">{item.icon}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.description}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-gray-500 group-hover:text-gray-900">
                Mulai Buat Pesanan <ChevronRight size={16} className="ml-1" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.back()}
        className="mt-8 block mx-auto text-gray-500 hover:text-gray-800 text-sm font-medium"
      >
        Kembali ke Halaman Sebelumnya
      </button>
    </div>
  );
}