import { CalendarClock, Car, ShoppingCart, Package } from "lucide-react";

export const tutorials = [
  {
    slug: "cara-booking-ruangan",
    title: "Cara Booking Ruangan Meeting",
    description: "Panduan lengkap memesan ruangan dan mengatur jadwal meeting.",
    icon: CalendarClock,
    color: "blue",
    steps: [
      {
        title: "Buka Menu Peminjaman",
        desc: "Klik menu 'Peminjaman Ruangan' pada tampilan menu.",
        image: "/images/tutorials/booking-1.png",
      },
      {
        title: "Pilih Ajukan Booking Baru",
        desc: "Pilih tombol 'Ajukan Booking Baru' untuk memulai proses pemesanan.",
        // image: "/images/tutorials/booking-2.png",
        image: null,
      },
      {
        title: "Pilih Cabang dan Ruangan",
        desc: "Pilih cabang kantor dan ruangan meeting yang diinginkan dari daftar.",
        // image: "/images/tutorials/booking-3.png",
        image: null,
      },
      {
        title: "Isi Detail Meeting",
        desc: "Pilih topik, isi keperluan / judul meeting, waktu mulai dan waktu selesai meeting",
        image: "/images/tutorials/booking-4.png",
      },
      {
        title: "Periksa Fasilitas",
        desc: "Anda dapat melihat informasi fasilitas sesuai dengan yang ada pada ruangan yang dipilih",
        // image: "/images/tutorials/booking-4.png",
        image: null,
      },
      {
        title: "Catatan (opsional)",
        desc: "Anda dapat memberikan catatan tambahan pada admin jika diperlukan",
        // image: "/images/tutorials/booking-4.png",
        image: null,
      },
      {
        title: "Perlu memesan konsumsi?",
        desc: "Jika perlu, Anda dapat mencentang opsi 'Pesan Konsumsi' dan memilih jenis konsumsi yang diinginkan",
        image: null, // Bisa null jika tidak ada gambar
      },
      {
        title: "Submit Pengajuan",
        desc: "Klik tombol 'Ajukan'. Status akan menjadi 'Pending' menunggu persetujuan Admin.",
      },
    ],
  },
  {
    slug: "cara-pengajuan-kendaraan",
    title: "Cara Mengajukan Kendaraan",
    description: "Prosedur peminjaman mobil kantor beserta supir.",
    icon: Car,
    color: "green",
    steps: [
      {
        title: "Buka Menu Kendaraan",
        desc: "Klik menu 'Peminjaman Kendaraan' pada tampilan menu.",
        image: "/images/tutorials/kendaraan-1.png",
      },
      {
        title: "Pilih Ajukan Peminjaman",
        desc: "Pilih tombol 'Ajukan Peminjaman' untuk memulai proses peminjaman.",
        // image: "/images/tutorials/booking-2.png",
        image: null,
      },
      {
        title: "Lihat Jadwal Keberangkatan",
        desc: "Anda bisa melihat jadwal keberangkatan terkini dari kendaraan yang tersedia.",
        // image: "/images/tutorials/booking-2.png",
        image: null,
      },
      {
        title: "Isi Informasi Dasar Perjalanan",
        desc: "Lengkapi kolom **Keperluan** (contoh: Kunjungan Klien) dan **Tujuan** perjalanan. Pilih **Cabang Penjemputan** dari dropdown. Jika titik jemput bukan di lobby utama, isi kolom 'Lokasi Jemput Spesifik'.",
        image: null, 
      },
      {
        title: "Tentukan Jadwal Pemakaian",
        desc: "Masukkan **Tanggal Mulai** & **Jam Mulai**, serta **Tanggal Selesai** & **Jam Selesai**. Pastikan durasi yang dipilih mencakup waktu perjalanan pulang pergi.",
        image: null,
      },
      {
        title: "Pilih Armada & Kapasitas",
        desc: "Pada bagian Detail Kebutuhan, pilih **Jenis Kendaraan** yang diinginkan, masukkan **Jumlah Unit**, dan total **Jumlah Penumpang** yang akan ikut.",
        image: null,
      },
      {
        title: "Data Penumpang & Catatan",
        desc: "Tuliskan nama-nama penumpang di kolom **Nama Penumpang**. Jika ada request khusus (misal: mobil harus bersih, bawa e-toll khusus), tulis di **Catatan Tambahan**.",
        image: "/images/tutorials/kendaraan-2.png", 
      },
      {
        title: "Konfirmasi Kebutuhan Supir & Kirim",
        desc: "Centang kotak **'Memerlukan Sopir?'** jika Anda tidak menyetir sendiri. Periksa kembali semua data, lalu klik tombol biru **'Kirim Pengajuan'**.",
        image: null,
      },
      
    ],
    
  },
  {
    slug: "cara-order-konsumsi",
    title: "Cara Order Makanan & Konsumsi",
    description: "Panduan memesan snack, makan siang, atau konsumsi untuk meeting.",
    icon: ShoppingCart,
    color: "indigo", 
    steps: [
      {
        title: "Buka Menu Order",
        desc: "Klik menu 'Order' pada tampilan menu.",
        image: "/images/tutorials/order-1.png",
      },
      {
        title: "Pilih Ajukan Pemesanan Baru",
        desc: "Pilih tombol 'Ajukan Pemesanan Baru' untuk memulai proses pemesanan.",
        // image: "/images/tutorials/booking-2.png",
        image: null,
      },
      {
        title: "Tentukan Lokasi Pengantaran",
        desc: "Pilih **'Booking Meeting'** jika pesanan ini untuk jadwal meeting yang sudah dibooking sebelumnya, atau pilih **'Lokasi Lainnya'** untuk pengantaran ke meja/ruangan spesifik (Isi Cabang dan Lokasi Spesifik).",
        image: null, 
      },
      {
        title: "Isi Informasi Umum",
        desc: "Lengkapi **Keperluan Pesanan** (misal: Rapat Anggaran), pilih **Tanggal Pesanan**, dan masukkan estimasi **Jumlah Orang** yang akan makan.",
        image: null,
      },
      {
        title: "Detail Menu & Waktu Antar",
        desc: "Pilih **Jenis Konsumsi** (Snack/Makan Berat), ketik **Nama Menu**, dan **Qty**. Sangat penting untuk mengatur **Waktu Antar** agar makanan datang tepat waktu. Klik **'+ Tambah Item'** jika ingin memesan lebih dari satu menu.",
        image: "/images/tutorials/order-2.png",
      },
      {
        title: "Catatan & Kirim",
        desc: "Gunakan kolom **Catatan** untuk request khusus (contoh: 'Jangan pedas', 'Alergi kacang', atau preferensi Restoran tertentu). Jika sudah sesuai, klik tombol simpan/kirim.",
        image: null,
      },
    ],
  },
];