"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface TransaksiDetail {
  id: number;
  nama_pihak: string;
  jenis_hewan: string;
  jumlah: number;
  harga: number;
  harga_beli?: number;
  harga_jual?: number;
  jenis_transaksi: string;
  tanggal: string;
  profiles?: {
    role: string | null;
  } | null;
}

export default function DetailTransaksiPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<TransaksiDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);

      // 🔹 1. Ambil data transaksi
      const { data: transaksiData, error: transaksiError } = await supabase
        .from("transaksi")
        .select(
          `
        id,
        nama_pihak,
        jenis_hewan,
        jumlah,
        harga,
        jenis_transaksi,
        tanggal,
        profiles:profiles!inner ( role )
      `
        )
        .eq("id", id)
        .single();

      if (transaksiError) {
        console.error("❌ Error fetching transaksi:", transaksiError.message);
        setLoading(false);
        return;
      }

      // 🔹 2. Kalau jenis_transaksi = Pemasukan, ambil hewan
      let hargaBeli = null;
      let hargaJual = null;

      if (transaksiData.jenis_transaksi === "Pemasukan") {
        const { data: hewanData, error: hewanError } = await supabase
          .from("hewan")
          .select("harga_beli, harga_jual")
          .eq("transaksi_id", id);

        if (!hewanError && hewanData && hewanData.length > 0) {
          hargaBeli = hewanData[0].harga_beli;
          hargaJual = hewanData[0].harga_jual;
        }
      }

      // 🔹 3. Gabungkan data
      setData({
        ...transaksiData,
        profiles: Array.isArray(transaksiData.profiles)
          ? transaksiData.profiles[0] || null
          : transaksiData.profiles,
        harga_beli: hargaBeli,
        harga_jual: hargaJual,
      });

      setLoading(false);
    };

    if (id) fetchDetail();
  }, [id]);

  // 🔹 Format tanggal ke format: "Senin, 20/10/2025"
  const formatTanggalLengkap = (tanggal: string) => {
    const date = new Date(tanggal);
    const hariList = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const hari = hariList[date.getDay()];
    const tanggalFormatted = date.toLocaleDateString("id-ID");
    return `${hari}, ${tanggalFormatted}`;
  };

  if (loading) {
    return <p className="text-center py-5 text-gray-500">Loading detail...</p>;
  }

  if (!data) {
    return <p className="text-center py-5 text-gray-500">Data tidak ditemukan.</p>;
  }

  return (
    <div className="min-h-screen bg-[#F5F2E8] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl mx-auto">
        <h2 className="text-black text-2xl font-bold mb-6">Detail Transaksi</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-black font-medium">
              {data.jenis_transaksi === "Pemasukan"
                ? "Nama Pembeli"
                : "Nama Penjual"}
            </label>
            <input
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
              value={data.nama_pihak}
              readOnly
            />
          </div>
          <div>
            <label className="block text-black font-medium">Jumlah</label>
            <input
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
              value={String(data.jumlah).padStart(2, "0")}
              readOnly
            />
          </div>

          <div>
            <label className="block text-black font-medium">Jenis Hewan</label>
            <input
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
              value={data.jenis_hewan}
              readOnly
            />
          </div>
          <div>
            <label className="block text-black font-medium">
              Kategori Transaksi
            </label>
            <input
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
              value={data.jenis_transaksi}
              readOnly
            />
          </div>

          {data.jenis_transaksi === "Pemasukan" ? (
            <>
              <div>
                <label className="block text-black font-medium">
                  Harga Beli
                </label>
                <input
                  className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
                  value={Number(data.harga_beli ?? 0).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-black font-medium">
                  Harga Jual
                </label>
                <input
                  className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
                  value={Number(data.harga_jual ?? 0).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })}
                  readOnly
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-black font-medium">Harga</label>
              <input
                className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
                value={Number(data.harga).toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                })}
                readOnly
              />
            </div>
          )}

          <div>
            <label className="block text-black font-medium">User Input</label>
            <input
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
              value={data.profiles?.role || "Tidak diketahui"}
              readOnly
            />
          </div>

          <div
            className={
              data.jenis_transaksi === "Pengeluaran" ? "col-span-2" : ""
            }
          >
            <label className="block text-black font-medium">
              Tanggal Transaksi
            </label>
            <input
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 mt-1"
              value={formatTanggalLengkap(data.tanggal)}
              readOnly
            />
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="text-black mt-6 w-full py-2 border-2 border-black rounded-md font-semibold hover:bg-gray-100 transition cursor-pointer"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}