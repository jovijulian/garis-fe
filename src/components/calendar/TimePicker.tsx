// src/components/form/TimePicker.tsx

import React from 'react';

// Definisikan props yang akan diterima komponen ini
interface TimePickerProps {
  value: string; // Formatnya "HH:mm", contoh: "14:30"
  onChange: (newTime: string) => void; // Fungsi yang dipanggil saat nilai berubah
  className?: string; // Untuk styling tambahan dari luar
  required?: boolean; // Untuk validasi form
}

export default function TimePicker({ value, onChange, className = '', required = false }: TimePickerProps) {
  // Memecah nilai 'value' menjadi jam dan menit
  // Memberi nilai default jika 'value' kosong agar tidak error
  const [hour = '', minute = ''] = value ? value.split(':') : [];

  // Membuat array untuk pilihan jam (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  
  // Membuat array untuk pilihan menit (increment 15 menit)
  const minutes = ['00', '15', '30', '45'];

  // Handler saat dropdown jam diubah
  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    // Gabungkan dengan menit yang sudah ada, atau '00' jika belum dipilih
    onChange(`${newHour}:${minute || '00'}`);
  };
  
  // Handler saat dropdown menit diubah
  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    // Gabungkan dengan jam yang sudah ada, atau '00' jika belum dipilih
    onChange(`${hour || '00'}:${newMinute}`);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={hour}
        onChange={handleHourChange}
        required={required}
        className="w-full border p-2 rounded-md bg-white"
      >
        <option value="" disabled>Jam</option>
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="font-bold">:</span>
      <select
        value={minute}
        onChange={handleMinuteChange}
        required={required}
        className="w-full border p-2 rounded-md bg-white"
      >
        <option value="" disabled>Menit</option>
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}