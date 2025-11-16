// src/components/form/TimePicker.tsx

import React from 'react';

// Definisikan props yang akan diterima komponen ini
interface TimePickerProps {
  value: string; // Formatnya "HH:mm", contoh: "14:30"
  onChange: (newTime: string) => void; // Fungsi yang dipanggil saat nilai berubah
  className?: string; // Untuk styling tambahan dari luar
  required?: boolean; // Untuk validasi form
  maxTime?: string;
  minTime?: string;
}

export default function TimePicker({ value, onChange, className = '', required = false, maxTime, minTime }: TimePickerProps) {
  // Memecah nilai 'value' menjadi jam dan menit
  // Memberi nilai default jika 'value' kosong agar tidak error
  const [hour = '', minute = ''] = value ? value.split(':') : [];

  // Membuat array untuk pilihan jam (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const [maxHour, maxMinute] = maxTime ? maxTime.split(':') : [null, null];
  const [minHour, minMinute] = minTime ? minTime.split(':') : [null, null];
  // Membuat array untuk pilihan menit (increment 15 menit)
  const minutes = ['00', '15', '30', '45'];

  // Handler saat dropdown jam diubah
  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    let currentMinute = minute || '00';

    // Logika reset/penyesuaian menit berdasarkan batasan
    
    // Jika ada maxTime, dan jam baru adalah jam maks...
    if (maxHour && maxMinute && newHour === maxHour) {
      // ...cek apakah menit saat ini melebihi menit maks
      if (currentMinute > maxMinute) {
        currentMinute = maxMinute; // Set ke menit maks
      }
    }
    
    // Jika ada minTime, dan jam baru adalah jam min...
    if (minHour && minMinute && newHour === minHour) {
      // ...cek apakah menit saat ini kurang dari menit min
      if (currentMinute < minMinute) {
        currentMinute = minMinute; // Set ke menit min
      }
    }
    
    onChange(`${newHour}:${currentMinute}`);
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
        {hours
          .filter(h => 
            (!maxHour || h <= maxHour) && // Filter atas
            (!minHour || h >= minHour)    // Filter bawah
          )
          .map(h => <option key={h} value={h}>{h}</option>)
        }
      </select>
      <span className="font-bold">:</span>
      <select
        value={minute}
        onChange={handleMinuteChange}
        required={required}
        className="w-full border p-2 rounded-md bg-white"
      >
        <option value="" disabled>Menit</option>
        {minutes
          .filter(m => {
            let valid = true;

            // Cek batasan atas (maxTime)
            if (maxHour && maxMinute && hour === maxHour) {
              if (m > maxMinute) valid = false;
            }
            
            // Cek batasan bawah (minTime)
            if (minHour && minMinute && hour === minHour) {
              if (m < minMinute) valid = false;
            }

            return valid;
          })
          .map(m => <option key={m} value={m}>{m}</option>)
        }
      </select>
    </div>
  );
}