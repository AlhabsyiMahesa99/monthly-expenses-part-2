"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import IncomeField from "@/components/forms/IncomeField";
import ExpenditureField from "@/components/forms/ExpenditureFIeld";
import FilterSearchField, { TransaksiFilters } from "@/components/forms/FilterSearchField"; // <--- ambil tipe TransaksiFilters

const Page = () => {
  const router = useRouter();

  // Tambah state filters — menampung hasil pilihan user dari FilterSearchField
  const [filters, setFilters] = useState<TransaksiFilters>({
    search: "",
    jenis: "",
    range: "",
    user: "",
  });

  return (
    <div className="p-6 text-black">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Data Transaksi</h1>
        <button
          onClick={() => router.push("/admin/data-transaksi/tambah")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition cursor-pointer"
        >
          + Tambah Transaksi
        </button>
      </div>

      {/* Filter & Search Section */}
      {/* onApply akan dipanggil ketika user klik tombol "Filter" */}
      <FilterSearchField onApply={(f) => setFilters(f)} />

      {/* Income Field */}
      {/* Kirim filters sebagai props */}
      <div className="mt-6">
        <IncomeField filters={filters} />
      </div>

      {/* Expenditure Field */}
      <div className="mt-6">
        <ExpenditureField filters={filters} />
      </div>
    </div>
  );
};

export default Page;