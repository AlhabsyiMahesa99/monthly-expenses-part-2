"use client";

import React, { useEffect, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import deleteTransaksiHandler from "@/app/(auth)/delete-transaksiHandler";
import Pagination from "../ui/Pagination";

  interface Props {
    filters: {
      search: string;
      jenis: string;
      range: string;
      user: string;
    };
  }

  interface Transaksi {
    id: number;
    jenis_transaksi: string;
    nama_pihak: string;
    jenis_hewan: string;
    jumlah: number;
    harga: number;
    user_input: string;
    profiles?: {
      role: string | null;
    } | null;
  }

const IncomeField: React.FC<Props> = ({ filters }) => {
  const router = useRouter();
  const [dataTable, setDataTable] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // State untuk role user yang login
  const [userRole, setUserRole] = useState<string>("admin");

  // Ambil role user dari Supabase auth
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          setUserRole(profile.role.toLowerCase());
        }
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      let query = supabase
        .from("transaksi")
        .select(
          `
          id,
          jenis_transaksi,
          nama_pihak,
          jenis_hewan,
          jumlah,
          harga,
          user_input,
          profiles:profiles!inner ( role )
        `
        )
        .eq("jenis_transaksi", "Pemasukan");

      // 🔍 Search (by nama_pihak or ID)
      if (filters.search) {
        query = query.or(
          `nama_pihak.ilike.%${filters.search}%,id.eq.${
            Number(filters.search) || 0
          }`
        );
      }

      // 🐄 Jenis Hewan
      if (filters.jenis) query = query.eq("jenis_hewan", filters.jenis);

      // 🧑 User Input (role)
      if (filters.user) query = query.eq("profiles.role", filters.user);

      // 📅 Rentang Tanggal
      if (filters.range) {
        const now = new Date();
        let startDate = new Date();
        if (filters.range === "1 Hari Terakhir")
          startDate.setDate(now.getDate() - 1);
        if (filters.range === "7 Hari Terakhir")
          startDate.setDate(now.getDate() - 7);
        if (filters.range === "30 Hari Terakhir")
          startDate.setDate(now.getDate() - 30);
        query = query.gte("tanggal", startDate.toISOString());
      }

      const { data, error } = await query.order("id", { ascending: false });

      if (error) {
        console.error("❌ Error fetching data:", error.message);
      } else {
        const mappedData = data.map((item: any) => ({
          ...item,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0] || null
            : item.profiles,
        }));
        setDataTable(mappedData);
      }

      setLoading(false);
    };

    fetchData();
  }, [filters]);

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
      <h2 className="font-bold text-lg mb-3">Pemasukan</h2>

      {loading ? (
        <p className="text-center py-5 text-gray-500">Loading data...</p>
      ) : dataTable.length === 0 ? (
        <p className="text-center py-5 text-gray-500">
          Tidak ada data transaksi.
        </p>
      ) : (
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-y-2 border-black">
              <th className="py-3 text-left font-semibold">Id Transaksi</th>
              <th className="py-3 text-left font-semibold">Nama Pembeli</th>
              <th className="py-3 text-left font-semibold">Jenis Hewan</th>
              <th className="py-3 text-left font-semibold">Jumlah</th>
              <th className="py-3 text-left font-semibold">Harga</th>
              <th className="py-3 text-left font-semibold">User Input</th>
              <th className="py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#D9D9D9] text-2lg font-medium transition-all duration-200 hover:bg-gray-100 hover:scale-[1.01] "
              >
                {/* Format id jadi 3 digit */}
                <td className="py-3">{String(row.id).padStart(3, "0")}</td>

                <td>{row.nama_pihak}</td>
                <td>{row.jenis_hewan}</td>

                {/* Format jumlah jadi 2 digit */}
                <td>{String(row.jumlah).padStart(2, "0")}</td>

                <td>
                  {Number(row.harga).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })}
                </td>

                <td className="text-left">
                  {row.profiles?.role || "Tidak diketahui"}
                </td>

                <td className="text-center">
                  <div className="flex justify-center items-center gap-2">
                    {/* Tombol Detail */}
                    <button
                      onClick={() =>
                        router.push(`/${userRole}/data-transaksi/${row.id}`)
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md transition cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Kontrol akses by role */}
                    {/* Jika user admin → semua tombol aktif */}
                    {/* Jika user staff → hanya bisa edit/hapus milik staff sendiri */}
                    {userRole === "admin" ||
                    (userRole === "staff" && row.profiles?.role === "staff") ? (
                      <>
                        <button
                          onClick={() =>
                            router.push(
                              `/${userRole}/data-transaksi/${row.id}/edit`
                            )
                          }
                          className="bg-yellow-400 hover:bg-yellow-500 text-white p-1.5 rounded-md transition cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              !confirm("Yakin ingin menghapus transaksi ini?")
                            )
                              return;

                            const result = await deleteTransaksiHandler(row.id);

                            if (result.success) {
                              alert(result.message);
                              window.location.reload();
                            } else {
                              alert(result.error);
                            }
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-md transition cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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

export default IncomeField;