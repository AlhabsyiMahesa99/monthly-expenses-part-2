"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";

import LastTransactionField from "@/components/forms/LastTransactionField";
import RingkasanKeuanganField from "@/components/forms/RingkasanKeuanganField";
import StatistikPenjualanField from "@/components/forms/StatistikPenjualanField";
import SearchDashboardField from "@/components/forms/SearchDashboardField";

const DashboardAdmin = () => {

  // State untuk pencarian
  const [searchKeyword, setSearchKeyword] = useState("");

  // State untuk menyimpan hasil query dari Supabase
  const [dataBar, setDataBar] = useState<{ name: string; value: number }[]>([]);

  // Fungsi handleSearch
  const handleSearch = (keyword: string) => {
    console.log("🔍 Cari data dashboard dengan keyword:", keyword);
    setSearchKeyword(keyword.toLowerCase());
  };

  useEffect(() => {
    const fetchDataKategori = async () => {
      try {
        const { data, error } = await supabase
          .from("transaksi")
          .select("jenis_hewan, jenis_transaksi, nama_pihak, jumlah");

        if (error) throw error;

        // Filter hanya pemasukan (penjualan)
        let penjualan =
          data?.filter((t) => t.jenis_transaksi === "Pemasukan") || [];

        // Tambah filter berdasarkan pencarian (jika ada)
        if (searchKeyword) {
          penjualan = penjualan.filter((t) =>
            (t.nama_pihak || "").toLowerCase().includes(searchKeyword)
          );
        }

        // Kelompokkan jumlah berdasarkan jenis_hewan
        const grouped = penjualan.reduce(
          (acc: Record<string, number>, item) => {
            const key = item.jenis_hewan || "Tidak diketahui";
            acc[key] = (acc[key] || 0) + (item.jumlah ?? 0);
            return acc;
          },
          {}
        );

        const formatted = Object.entries(grouped).map(([name, value]) => ({
          name,
          value,
        }));

        setDataBar(formatted);
      } catch (err) {
        console.error("Gagal ambil data penjualan per kategori:", err);
        setDataBar([]);
      }
    };

    fetchDataKategori();
  }, []);

  // State untuk menyimpan data tren penjualan 6 bulan terakhir
  const [dataLine, setDataLine] = useState<{ name: string; value: number }[]>(
    []
  );

  useEffect(() => {
    const fetchTrenPenjualan = async () => {
      try {
        const { data, error } = await supabase
          .from("transaksi")
          .select("tanggal, jenis_transaksi, nama_pihak");

        if (error) throw error;

        let penjualan =
          data?.filter((t) => t.jenis_transaksi === "Pemasukan") || [];

        // ✅ Filter pencarian juga di sini
        if (searchKeyword) {
          penjualan = penjualan.filter((t) =>
            (t.nama_pihak || "").toLowerCase().includes(searchKeyword)
          );
        }

        // Buat list 6 bulan terakhir
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            name: d.toLocaleString("id-ID", { month: "short" }),
            total: 0,
          };
        });

        // Hitung total transaksi tiap bulan
        for (const t of penjualan) {
          if (!t.tanggal) continue;
          const date = new Date(t.tanggal);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const month = months.find((m) => m.key === key);
          if (month) month.total += 1;
        }

        const formatted = months.map((m) => ({
          name: m.name,
          value: m.total,
        }));

        setDataLine(formatted);
      } catch (err) {
        console.error("Gagal ambil data tren penjualan:", err);
        setDataLine([]);
      }
    };

    fetchTrenPenjualan();
  }, []);

  return (
    <div className="flex-1 text-black  px-10 py-8">
      {/* Header */}
      <SearchDashboardField onSearch={handleSearch} />

      {/* ===== GRID UTAMA (Statistik + Chart Sejajar) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
        {/* 1) Statistik (mobile: 1, desktop: left-top) */}
        <div className="flex flex-col gap-6">
          <StatistikPenjualanField />
        </div>

        {/* 2) Ringkasan Keuangan (mobile: 2, desktop: right-top) */}
        <div className="flex flex-col gap-6">
          <RingkasanKeuanganField />
        </div>

        {/* 3) Penjualan per Kategori (mobile: 3, desktop: left-bottom) */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-4">Penjualan per Kategori</h2>
          <ResponsiveContainer width="100%" height={250} debounce={300}>
            <BarChart data={dataBar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#D1D1D1"
                barSize={40}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4) Tren Penjualan (mobile: 4, desktop: right-bottom) */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2 className="font-semibold mb-4">Tren Penjualan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dataLine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value} transaksi`} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#111827"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== TABEL TRANSAKSI TERAKHIR ===== */}
      <LastTransactionField searchKeyword={searchKeyword} />
    </div>
  );
};

export default DashboardAdmin;