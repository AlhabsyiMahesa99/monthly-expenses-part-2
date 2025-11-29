"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Pagination from "../ui/Pagination";
import { Filters } from "./FilterSearchAnimalField";

interface Hewan {
  id: number;
  jenis: string;
  harga_beli: number;
  harga_jual: number | null;
  tanggal_masuk: string;
  tanggal_keluar: string | null;
  status: string;
  user_input: string;
  profiles?: {
    role: string | null;
  } | null;
}

interface Props {
  filters?: Filters;
}

const AnimalDataField: React.FC<Props> = ({ filters }) => {
  const [dataTable, setDataTable] = useState<Hewan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hewan")
        .select(`
          id,
          jenis,
          harga_beli,
          harga_jual,
          tanggal_masuk,
          tanggal_keluar,
          status,
          user_input,
          profiles:profiles!inner(role)
        `)
        .order("id", { ascending: false });

      if (error) {
        console.error("❌ Gagal ambil data hewan:", error.message);
      } else if (data) {
        const mapped = data.map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0] || null
            : item.profiles,
        }));
        setDataTable(mapped);
      }
      setLoading(false);
    };

    fetchAnimals();
  }, []);

  // apply filters (memoized)
  const filtered = useMemo(() => {
    if (!filters) return dataTable;
    const s = (filters.search || "").toLowerCase().trim();

    return dataTable.filter((r) => {
      const matchesSearch =
        !s ||
        String(r.id).toLowerCase().includes(s) ||
        (r.jenis || "").toLowerCase().includes(s);

      const matchesJenis = !filters.jenis || r.jenis === filters.jenis;
      const matchesStatus = !filters.status || r.status === filters.status;
      const matchesUser =
        !filters.user ||
        (r.profiles?.role || "").toLowerCase() === filters.user.toLowerCase();

      return matchesSearch && matchesJenis && matchesStatus && matchesUser;
    });
  }, [dataTable, filters]);

  // reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Pagination pakai data hasil filter
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm w-full">
      {loading ? (
        <p className="text-center py-5 text-gray-500">Loading data...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-5 text-gray-500">Tidak ada data hewan.</p>
      ) : (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y-2 border-black">
                <th className="py-4 px-4 text-left font-semibold">Id</th>
                <th className="py-4 px-4 text-left font-semibold">
                  Jenis Hewan
                </th>
                <th className="py-4 px-4 text-left font-semibold">
                  Harga Beli
                </th>
                <th className="py-4 px-4 text-left font-semibold">
                  Harga Jual
                </th>
                <th className="py-4 px-4 text-left font-semibold">
                  Tanggal Masuk
                </th>
                <th className="py-4 px-4 text-left font-semibold">
                  Tanggal Keluar
                </th>
                <th className="py-4 px-4 text-center font-semibold">Status</th>
                <th className="py-4 px-4 text-left font-semibold">
                  User Input
                </th>
              </tr>
            </thead>

            <tbody>
              {currentItems.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#D9D9D9] text-2lg font-medium transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01]"
                >
                  <td className="py-3 px-4">
                    {String(row.id).padStart(3, "0")}
                  </td>
                  <td className="px-4">{row.jenis}</td>
                  <td className="px-4">
                    {Number(row.harga_beli).toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    })}
                  </td>
                  <td className="px-4">
                    {row.harga_jual
                      ? Number(row.harga_jual).toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "-"}
                  </td>
                  <td className="px-4">
                    {new Date(row.tanggal_masuk).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-4">
                    {row.tanggal_keluar
                      ? new Date(row.tanggal_keluar).toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </td>
                  
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block w-[100px] text-center px-3 py-1 rounded-full text-white text-sm font-semibold ${
                        row.status === "Tersedia"
                          ? "bg-[#27AE60]"
                          : "bg-[#EB5757]"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4">
                    {row.profiles?.role || "Tidak diketahui"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AnimalDataField;