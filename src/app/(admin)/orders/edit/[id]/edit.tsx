"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import moment from 'moment';
import _ from "lodash";

import { endpointUrl, httpGet, httpPut } from '@/../helpers';
import ComponentCard from '@/components/common/ComponentCard';
import Select from '@/components/form/Select-custom';
import Input from '@/components/form/input/InputField';
import { Check, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import SingleDatePicker from "@/components/calendar/SingleDatePicker";
import TimePicker from '@/components/calendar/TimePicker';
// --- Interfaces and Types (Aligned with create.tsx) ---
type LocationType = 'booking' | 'custom';
interface SelectOption { value: string; label: string; }

interface OrderDetailItem {
  id?: number; // Optional ID for existing items
  consumption_type_id: number | null;
  menu: string;
  qty: string;
  delivery_time: string;
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // --- State Management (Mirrors create.tsx) ---
  const [headerData, setHeaderData] = useState({
    booking_id: null as number | null,
    cab_id: null as number | null,
    location_text: '',
    purpose: '',
    order_date: '',
    pax: 0,
    note: '',
  });

  const [details, setDetails] = useState<OrderDetailItem[]>([{
    consumption_type_id: null,
    menu: '',
    qty: '',
    delivery_time: ''
  }]);

  const [locationType, setLocationType] = useState<LocationType>('custom');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Options State ---
  const [bookingOptions, setBookingOptions] = useState<SelectOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
  const [consumptionTypeOptions, setConsumptionTypeOptions] = useState<SelectOption[]>([]);
  const [viewingMonthDate, setViewingMonthDate] = useState(new Date());

  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      try {
        const [orderRes, bookingsRes, sitesRes, consumptionTypesRes] = await Promise.all([
          httpGet(endpointUrl(`/orders/${id}`), true),
          httpGet(endpointUrl("/bookings/options"), true),
          httpGet(endpointUrl("/rooms/site-options"), true),
          httpGet(endpointUrl("/consumption-types/options"), true),
        ]);

        // Set options
        setBookingOptions(bookingsRes.data.data.map((b: any) => ({ value: b.id.toString(), label: `${b.purpose} (${moment(b.start_time).format('DD MMM, HH:mm')})` })));
        setSiteOptions(sitesRes.data.data.map((s: any) => ({ value: s.id_cab.toString(), label: s.nama_cab })));
        setConsumptionTypeOptions(consumptionTypesRes.data.data.map((ct: any) => ({ value: ct.id.toString(), label: ct.name })));

        const orderData = orderRes.data.data;

        // Populate Header Data
        setHeaderData({
          booking_id: orderData.booking_id,
          cab_id: orderData.cab_id,
          location_text: orderData.location_text || '',
          purpose: orderData.purpose || '',
          order_date: moment(orderData.order_date).format('YYYY-MM-DD'),
          pax: orderData.pax || 0,
          note: orderData.note || '',
        });

        // Populate Details Data
        if (orderData.details && orderData.details.length > 0) {
          setDetails(orderData.details.map((d: any) => ({
            id: d.id, // Keep track of existing item IDs for the backend
            consumption_type_id: d.consumption_type_id,
            menu: d.menu || '',
            qty: d.qty.toString(),
            delivery_time: d.delivery_time ? moment(d.delivery_time).format('HH:mm') : ''
          })));
        }

        // Set Location Type based on fetched data
        if (orderData.booking_id) {
          setLocationType('booking');
        } else {
          setLocationType('custom');
        }

      } catch (error) {
        toast.error("Gagal memuat data pesanan.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, router]);

  // --- Handlers (Identical to create.tsx) ---
  const handleHeaderChange = (field: keyof typeof headerData, value: any) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (index: number, field: keyof OrderDetailItem, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const addDetailItem = () => {
    setDetails([...details, { consumption_type_id: null, menu: '', qty: '', delivery_time: '' }]);
  };

  const removeDetailItem = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...headerData,
      details: details.map(d => {
        const orderDate = moment(headerData.order_date).format('YYYY-MM-DD');
        const fullDateTime = moment(`${orderDate} ${d.delivery_time}`, 'YYYY-MM-DD HH:mm');
  
        return {
          ...d,
          qty: d.qty ? parseInt(d.qty, 10) : 0,
          delivery_time: fullDateTime.isValid() ? fullDateTime.format('YYYY-MM-DD HH:mm:ss') : null,
        };
    }).filter(d => d.consumption_type_id && d.qty > 0)
    };
    
    // Conditional logic based on locationType
    if (payload.booking_id) {
        delete (payload as any).cab_id;
        delete (payload as any).location_text;
    } else {
        delete (payload as any).booking_id;
    }
    payload.order_date = moment(payload.order_date).format('YYYY-MM-DD');
    payload.pax = Number(payload.pax)


    try {
      await httpPut(endpointUrl(`/orders/${id}`), payload, true);
      toast.success("Pesanan berhasil diperbarui!");
      router.push('/orders/my-orders');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memperbarui pesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <ComponentCard title="Ubah Pesanan Konsumsi">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* --- Location Section (Display Only) --- */}
        {locationType === 'booking' && headerData.booking_id && (
          <div>
            <label className="block font-medium mb-1">Untuk Booking</label>
            <Select
              options={bookingOptions}
              value={_.find(bookingOptions, { value: headerData.booking_id?.toString() })}
              placeholder="Pesanan terkait dengan booking..."
            />
          </div>
        )}

        {locationType === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">Cabang/Site</label>
              <Select
                options={siteOptions}
                value={_.find(siteOptions, { value: headerData.cab_id?.toString() })}
                onValueChange={(opt) => handleHeaderChange('cab_id', opt ? parseInt(opt.value) : null)}
                placeholder="Pilih cabang..."
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Tulis Lokasi Spesifik</label>
              <Input
                defaultValue={headerData.location_text}
                onChange={(e) => handleHeaderChange('location_text', e.target.value)}
                placeholder="Contoh: Area Departemen IT"
              />
            </div>
          </div>
        )}
        <hr />

        {/* --- General Information (from headerData) --- */}
        <h3 className="text-lg font-semibold border-b pb-2">Informasi Umum</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium mb-1">Keperluan Pesanan</label>
            <Input defaultValue={headerData.purpose} onChange={(e) => handleHeaderChange('purpose', e.target.value)} placeholder="Contoh: Rapat Anggaran 2025" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Tanggal Pesanan</label>
            <SingleDatePicker 
              placeholderText="Pilih tanggal pesanan" 
              selectedDate={headerData.order_date ? new Date(headerData.order_date) : null} 
              onChange={(date: any) => handleHeaderChange('order_date', moment(date).format('YYYY-MM-DD'))} 
              onClearFilter={() => handleHeaderChange('order_date', '')} 
              viewingMonthDate={viewingMonthDate} 
              onMonthChange={setViewingMonthDate} 
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Jumlah Orang</label>
            <Input type="number" defaultValue={headerData.pax} onChange={(e) => handleHeaderChange('pax', e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* --- Detail Items (from details array) --- */}
        <div className="w-full">
          <h3 className="text-lg font-semibold border-b pb-2 pt-4">Detail Item Menu</h3>
          <div className="space-y-4 w-full mt-5">
            {details.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="md:col-span-4">
                <label className="text-xs text-gray-500">Jenis Konsumsi</label>
                  <Select 
                    options={consumptionTypeOptions} 
                    onValueChange={(opt) => handleDetailChange(index, 'consumption_type_id', opt ? parseInt(opt.value) : null)} 
                    placeholder="Pilih..."
                    value={_.find(consumptionTypeOptions, { value: item.consumption_type_id?.toString() })}
                  />
                </div>
                <div className="md:col-span-3">
                <label className="text-xs text-gray-500">Nama menu</label>
                  <Input defaultValue={item.menu} onChange={(e) => handleDetailChange(index, 'menu', e.target.value)} placeholder="Deskripsi Menu..." />
                </div>
                <div className="md:col-span-1">
                <label className="text-xs text-gray-500">Qty</label>
                  <Input type="number" defaultValue={item.qty} onChange={(e) => handleDetailChange(index, 'qty', e.target.value)} placeholder="Qty" />
                </div>
                <div className="md:col-span-3">
                <label className="text-xs text-gray-500">Waktu Antar</label>
                  <TimePicker
                    value={item.delivery_time}
                    onChange={(newTime) => handleDetailChange(index, 'delivery_time', newTime)}
                    required={true}
                  />
                </div>
                <div className="md:col-span-1 flex items-center justify-end">
                  {details.length > 1 && <button type="button" onClick={() => removeDetailItem(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
            <button type="button" onClick={addDetailItem} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"><PlusCircle size={16} />Tambah Item</button>
          </div>
        </div>

        {/* --- Notes --- */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2 pt-4">Catatan</h3>
          <textarea value={headerData.note} onChange={(e) => handleHeaderChange('note', e.target.value)} rows={5} placeholder={"Contoh: Tidak pakai MSG"} className="w-full border p-2 rounded-md mt-5" />
        </div>

        {/* --- Action Buttons --- */}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="px-6 py-2 bg-gray-600 text-white rounded-lg">Batal</button>
          <button type="submit" disabled={isSubmitting || loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check />}
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}