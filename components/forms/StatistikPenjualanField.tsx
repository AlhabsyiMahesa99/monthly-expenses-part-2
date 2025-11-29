"use client";

import React, { useEffect, useState } from "react";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const StatistikPenjualanField: React.FC = () => {
  const [stats, setStats] = useState({
    pemasukanHariIni: 0,
    pengeluaranHariIni: 0,
    totalPendapatan: 0,
    totalTernak: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ==== Batas tanggal hari ini ====
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isoToday = today.toISOString();

        // ==== 1️⃣ Total Pemasukan Hari Ini ====
        const { count: pemasukanCount } = await supabase
          .from("transaksi")
          .select("*", { count: "exact", head: true })
          .eq("jenis_transaksi", "Pemasukan")
          .gte("tanggal", isoToday);

        // ==== 2️⃣ Total Pengeluaran Hari Ini ====
        const { count: pengeluaranCount } = await supabase
          .from("transaksi")
          .select("*", { count: "exact", head: true })
          .eq("jenis_transaksi", "Pengeluaran")
          .gte("tanggal", isoToday);

        // ==== 3️⃣ Total Pendapatan Keseluruhan ====
        // Total pemasukan - total pengeluaran
        const { data: pemasukanData } = await supabase
          .from("transaksi")
          .select("harga, jumlah")
          .eq("jenis_transaksi", "Pemasukan");

        const { data: pengeluaranData } = await supabase
          .from("transaksi")
          .select("harga, jumlah")
          .eq("jenis_transaksi", "Pengeluaran");

        const totalPemasukan = (pemasukanData ?? []).reduce(
          (sum, t) => sum + t.harga * t.jumlah,
          0
        );
        const totalPengeluaran = (pengeluaranData ?? []).reduce(
          (sum, t) => sum + t.harga * t.jumlah,
          0
        );

        const totalPendapatan = totalPemasukan - totalPengeluaran;

        // ==== 4️⃣ Total Ternak Saat Ini ====
        const { count: totalTernakCount } = await supabase
          .from("hewan")
          .select("*", { count: "exact", head: true })
          .eq("status", "Tersedia");

        // ==== Update State ====
        setStats({
          pemasukanHariIni: pemasukanCount ?? 0,
          pengeluaranHariIni: pengeluaranCount ?? 0,
          totalPendapatan,
          totalTernak: totalTernakCount ?? 0,
        });
      } catch (error) {
        console.error("Gagal ambil data statistik:", error);
      }
    };

    fetchStats();
  }, []);

  const items = [
    { title: "Total Pemasukan Hari Ini", value: stats.pemasukanHariIni },
    { title: "Total Pengeluaran Hari Ini", value: stats.pengeluaranHariIni },
    {
      title: "Total Pendapatan Keseluruhan",
      value: stats.totalPendapatan.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
      }),
    },
    { title: "Total Ternak Saat Ini", value: stats.totalTernak },
  ];

  return (
    <div className="px-2 sm:px-0">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 w-full max-w-full sm:grid-cols-2 sm:gap-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm p-3 flex flex-col justify-between h-[120px] hover:-translate-y-0.5 transition-all duration-200"
          >
            <p className="font-semibold text-gray-600">{item.title}</p>
            <div className="mt-auto flex items-center justify-between">
              <p className="text-xl font-bold">{item.value}</p>
              {item.title !== "Total Pendapatan Keseluruhan" && (
                <ChartNoAxesColumnIncreasing className="w-5 h-5 text-gray-700" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatistikPenjualanField;