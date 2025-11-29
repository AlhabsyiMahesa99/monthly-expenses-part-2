"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Pagination from "../ui/Pagination";

  interface Transaksi {
    id: number;
    nama_pihak: string;
    jenis_hewan: string;
    jenis_transaksi: string;
    tanggal: string;
    user_input: string;
    profiles?: {
      role: string | null;
    } | null;
  }

  interface Props {
    searchKeyword?: string;
  }

const LastTransactionField: React.FC<Props> = ({ searchKeyword }) => {
  const [dataTable, setDataTable] = useState<Transaksi[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("transaksi")
        .select(
          `
        id,
        nama_pihak,
        jenis_hewan,
        jenis_transaksi,
        tanggal,
        user_input,
        profiles:profiles!inner(role)
      `
        )
        .order("id", { ascending: false }); // urut terbaru

      // 🧠 Tambahkan filter kalau ada keyword pencarian
      if (searchKeyword) {
        query = query.ilike("nama_pihak", `%${searchKeyword}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Gagal ambil data transaksi:", error.message);
        return;
      }

      const mapped = data.map((item: any) => ({
        ...item,
        profiles: Array.isArray(item.profiles)
          ? item.profiles[0] || null
          : item.profiles,
      }));

      setDataTable(mapped);
    };

    fetchData();
  }, [searchKeyword]); // 🆕 re-fetch saat keyword berubah

  // Hitung total halaman
  const totalPages = Math.ceil(dataTable.length / itemsPerPage);

  // Tentukan data yang mau ditampilkan di halaman ini
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataTable.slice(indexOfFirstItem, indexOfLastItem);

  // Fungsi pindah halaman
  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm w-full">
      <h2 className="font-bold text-lg mb-3">Transaksi Terakhir</h2>

      {/* 💡 Tambah wrapper scroll horizontal */}
      <div className="">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-y-2 border-black">
              <th className="py-3 text-left font-semibold">Id Transaksi</th>
              <th className="py-3 text-left font-semibold">
                Nama Penjual / Pembeli
              </th>
              <th className="py-3 text-left font-semibold">Jenis Hewan</th>
              <th className="py-3 text-left font-semibold">
                Kategori Transaksi
              </th>
              <th className="py-3 text-left font-semibold">Tanggal</th>
              <th className="py-3 text-left font-semibold">User Input</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#D9D9D9] text-2lg font-medium transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01]"
              >
                <td className="py-3">{String(row.id).padStart(3, "0")}</td>
                <td>{row.nama_pihak}</td>
                <td>{row.jenis_hewan}</td>
                <td>{row.jenis_transaksi}</td>
                <td>
                  {new Date(row.tanggal).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </td>
                <td>
                  {row.profiles?.role || row.user_input || "Tidak diketahui"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default LastTransactionField;