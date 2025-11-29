"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import StatistikPenjualanField from "@/components/forms/StatistikPenjualanField";
import RingkasanKeuanganField from "@/components/forms/RingkasanKeuanganField";
import FilterSearchField, { TransaksiFilters } from "@/components/forms/FilterSearchField";
import IncomeField from "@/components/forms/IncomeField";
import ExpenditureField from "@/components/forms/ExpenditureFIeld";

const Page = () => {
  const [filters, setFilters] = useState<TransaksiFilters>({
    search: "",
    jenis: "",
    range: "",
    user: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

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
    return `${hari}, ${date.toLocaleDateString("id-ID")}`;
  };

  const handleExport = async (range: "hari" | "minggu" | "bulan") => {
  setLoadingExport(true);
  setShowModal(false);

  try {
    const now = new Date();
    let startDate: string;
    let endDate: string = now.toISOString().split("T")[0];

    if (range === "hari") {
      startDate = now.toISOString().split("T")[0];
    } else if (range === "minggu") {
      const day = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - day);
      startDate = startOfWeek.toISOString().split("T")[0];
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = startOfMonth.toISOString().split("T")[0];
    }

    const { data, error } = await supabase
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
        profiles:profiles!inner(role)
      `
      )
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: true });

    if (error) throw error;

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
      return `${hari}, ${date.toLocaleDateString("id-ID")}`;
    };

    const formatted = data.map((t: any) => ({
      tanggal: formatTanggalLengkap(t.tanggal),
      pihak: t.nama_pihak,
      hewan: t.jenis_hewan,
      jumlah: t.jumlah,
      harga: Number(t.harga),
      user: (t.profiles?.role || "").toUpperCase(),
      jenis: t.jenis_transaksi,
    }));

    const pemasukan = formatted.filter((t) => t.jenis === "Pemasukan");
    const pengeluaran = formatted.filter((t) => t.jenis === "Pengeluaran");

    const totalPemasukan = pemasukan.reduce((acc, t) => acc + t.harga, 0);
    const totalPengeluaran = pengeluaran.reduce((acc, t) => acc + t.harga, 0);

    // === Gunakan ExcelJS ===
    const workbook = new ExcelJS.Workbook();

    const buatSheet = (judul: string, data: any[], total: number) => {
      const sheet = workbook.addWorksheet(judul);

      // Ganti label kolom B sesuai jenis sheet
      const namaKolom = judul === "Pemasukan" ? "Nama Pembeli" : "Nama Penjual";

      sheet.columns = [
        { header: "Tanggal Transaksi", key: "tanggal", width: 25 },
        { header: namaKolom, key: "pihak", width: 20 },
        { header: "Jenis Hewan", key: "hewan", width: 20 },
        { header: "Jumlah", key: "jumlah", width: 12 },
        { header: "Harga", key: "harga", width: 18 },
        { header: "User Input", key: "user", width: 15 },
        { header: "Jenis Transaksi", key: "jenis", width: 18 },
      ];

      // Tambahkan data transaksi
      data.forEach((item) => sheet.addRow(item));

      // Tambahkan baris total (nanti kita merge A-D)
      const totalRowIndex = data.length + 2;
      const totalRow = sheet.addRow({
        tanggal: "Total",
        pihak: "",
        hewan: "",
        jumlah: "",
        harga: total,
        user: "",
        jenis: "",
      });

      // ===== Styling =====
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: "left", vertical: "middle" }; // header kiri
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E5E5" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFB0B0B0" } },
          left: { style: "thin", color: { argb: "FFB0B0B0" } },
          bottom: { style: "thin", color: { argb: "FFB0B0B0" } },
          right: { style: "thin", color: { argb: "FFB0B0B0" } },
        };
      });

      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD9D9D9" } },
            left: { style: "thin", color: { argb: "FFD9D9D9" } },
            bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
            right: { style: "thin", color: { argb: "FFD9D9D9" } },
          };
          cell.alignment = { horizontal: "left", vertical: "middle" };
        });
      });

      // ===== Styling khusus baris Total =====
      sheet.mergeCells(`A${totalRowIndex}:D${totalRowIndex}`);
      const totalCellMerged = sheet.getCell(`A${totalRowIndex}`);
      totalCellMerged.value = "Total";
      totalCellMerged.alignment = { horizontal: "right", vertical: "middle" };
      totalCellMerged.font = { bold: true };

      totalRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF99" }, // kuning lembut
        };
        cell.font = { bold: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFB0B0B0" } },
          left: { style: "thin", color: { argb: "FFB0B0B0" } },
          bottom: { style: "thin", color: { argb: "FFB0B0B0" } },
          right: { style: "thin", color: { argb: "FFB0B0B0" } },
        };
      });

      // Format kolom harga jadi Rupiah
      sheet.getColumn("harga").numFmt = "[$Rp-421] #,##0";

      return sheet;
    };

    buatSheet("Pemasukan", pemasukan, totalPemasukan);
    buatSheet("Pengeluaran", pengeluaran, totalPengeluaran);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Laporan_${range}.xlsx`
    );

    alert(`✅ Berhasil export data ${range} ini!`);
  } catch (err) {
    console.error("❌ Gagal export:", err);
    alert("Gagal export data!");
  } finally {
    setLoadingExport(false);
  }
};

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-12 py-2 rounded-md transition cursor-pointer"
        >
          Export
        </button>
      </div>

      {/* ===== GRID UTAMA ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
        <div className="flex flex-col gap-6">
          <StatistikPenjualanField />
        </div>
        <div className="flex flex-col gap-6">
          <RingkasanKeuanganField />
        </div>
      </div>

      <FilterSearchField onApply={(f) => setFilters(f)} />

      <div className="mt-8">
        <IncomeField filters={filters} />
      </div>

      <div className="mt-8">
        <ExpenditureField filters={filters} />
      </div>

      {/* === MODAL EXPORT === */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[360px] text-center">
            <h2 className="text-lg font-semibold mb-4">Pilih rentang export</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleExport("hari")}
                className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold cursor-pointer"
                disabled={loadingExport}
              >
                Export Data Hari Ini
              </button>
              <button
                onClick={() => handleExport("minggu")}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold cursor-pointer"
                disabled={loadingExport}
              >
                Export Data Minggu Ini
              </button>
              <button
                onClick={() => handleExport("bulan")}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-semibold cursor-pointer"
                disabled={loadingExport}
              >
                Export Data Bulan Ini
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="border border-gray-400 py-2 rounded-md font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;