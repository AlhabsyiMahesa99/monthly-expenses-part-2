"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import tambahTransaksiHandler from "@/app/(auth)/tambah-transaksiHandler";
 
const Page = () => {
  const router = useRouter();
  const [kategori, setKategori] = useState("Pengeluaran");
  const [jenisHewan, setJenisHewan] = useState("Kambing");

  // Untuk Pemasukan
  const [hargaBeliOptions, setHargaBeliOptions] = useState<number[]>([]);
  const [selectedHargaBeli, setSelectedHargaBeli] = useState<number | null>(
    null
  );
  const [availableCountForPrice, setAvailableCountForPrice] = useState(0);
  const [selectedJumlah, setSelectedJumlah] = useState<number>(1);

  // existing pengeluaran state
  const [jumlah, setJumlah] = useState(1);
  const [namaPihak, setNamaPihak] = useState("Users");
  const [hargaPengeluaran, setHargaPengeluaran] = useState(0);
  const [hargaJual, setHargaJual] = useState(0);

  const [loadingPrices, setLoadingPrices] = useState(false);

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

  // whenever jenisHewan changes, fetch distinct harga_beli for that jenis (status Tersedia)
  useEffect(() => {
    if (kategori !== "Pemasukan") return;

    const fetchPrices = async () => {
      setLoadingPrices(true);
      // Ambil semua harga_beli unik (status = 'Tersedia') untuk jenis ini
      const { data, error } = await supabase
        .from("hewan")
        .select("harga_beli")
        .eq("jenis", jenisHewan)
        .eq("status", "Tersedia");

      if (error) {
        console.error("Gagal fetch harga hewan:", error.message);
        setHargaBeliOptions([]);
        setSelectedHargaBeli(null);
        setAvailableCountForPrice(0);
        setLoadingPrices(false);
        return;
      }

      // Extract unique numeric prices and sort (asc)
      const prices = Array.from(
        new Set((data || []).map((r: any) => Number(r.harga_beli)))
      ).sort((a, b) => a - b);

      setHargaBeliOptions(prices);
      // reset selection
      setSelectedHargaBeli(prices.length > 0 ? prices[0] : null);
      setSelectedJumlah(1);
      setLoadingPrices(false);
    };

    fetchPrices();
  }, [jenisHewan, kategori]);

  // whenever selectedHargaBeli changes, fetch count available for that price
  useEffect(() => {
    if (kategori !== "Pemasukan" || selectedHargaBeli == null) {
      setAvailableCountForPrice(0);
      return;
    }

    let mounted = true;
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("hewan")
        .select("id", { count: "exact", head: false })
        .eq("jenis", jenisHewan)
        .eq("status", "Tersedia")
        .eq("harga_beli", selectedHargaBeli);

      if (error) {
        console.error("Gagal fetch count hewan:", error.message);
        if (mounted) setAvailableCountForPrice(0);
        return;
      }

      if (mounted) {
        setAvailableCountForPrice(count ?? 0);
        setSelectedJumlah(1); // reset jumlah saat price berubah
      }
    };

    fetchCount();
    return () => {
      mounted = false;
    };
  }, [selectedHargaBeli, jenisHewan, kategori]);

  const handleSubmit = async () => {
    try {
      if (kategori === "Pemasukan") {
        if (!selectedHargaBeli || selectedJumlah < 1) {
          alert("Pilih harga dan jumlah yang valid.");
          return;
        }
        // form untuk pemasukan: kita kirim harga_beli untuk memastikan backend memilih hewan yg sesuai harga
        const formData = {
          jenis_transaksi: "Pemasukan" as const,
          nama_pihak: namaPihak,
          jenis_hewan: jenisHewan,
          jumlah: selectedJumlah,
          harga: hargaJual, // harga jual
          harga_beli: selectedHargaBeli, // tambahan
        };

        const res = await tambahTransaksiHandler(formData);
        if (res.success) {
          alert(res.message);
          router.push(`/${userRole}/data-transaksi`);
        } else {
          alert("Gagal: " + res.error);
        }
        return;
      }

      // Pengeluaran (tetap seperti sebelumnya)
      const formData = {
        jenis_transaksi: "Pengeluaran" as const,
        nama_pihak: namaPihak,
        jenis_hewan: jenisHewan,
        jumlah,
        harga: hargaPengeluaran,
      };

      const res = await tambahTransaksiHandler(formData);
      if (res.success) {
        alert(res.message);
        router.push(`/${userRole}/data-transaksi`);
      } else {
        alert("Gagal: " + res.error);
      }
    } catch (err: any) {
      console.error(err);
      alert("Terjadi error: " + (err?.message ?? err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
    <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-2xl text-black">
      <h1 className="text-2xl font-bold mb-6">Tambah Transaksi Baru</h1>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Nama Penjual / Pembeli */}
        <div>
          <label className="block font-semibold mb-1">
            {kategori === "Pemasukan" ? "Nama Pembeli" : "Nama Penjual"}
          </label>
          <input
            type="text"
            value={namaPihak}
            onChange={(e) => setNamaPihak(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Jenis Hewan & Jumlah */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Jenis Hewan</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 cursor-pointer"
              value={jenisHewan}
              onChange={(e) => setJenisHewan(e.target.value)}
            >
              <option value="Kambing">Kambing</option>
              <option value="Sapi">Sapi</option>
              <option value="Domba">Domba</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Jumlah</label>

            {kategori === "Pengeluaran" ? (
              // 🔹 Jika kategori Pengeluaran → gunakan input number native (ada icon spinner bawaan browser)
              <input
                type="number"
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                min={1}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            ) : (
              // Pemasukan: jumlah dipilih dari dropdown sesuai availableCountForPrice
              <select
                className="w-full border border-gray-300 rounded-md p-2 cursor-pointer"
                value={selectedJumlah}
                onChange={(e) => setSelectedJumlah(Number(e.target.value))}
              >
                {Array.from(
                  { length: Math.max(1, availableCountForPrice) },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {String(n).padStart(2, "0")}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Harga untuk masing-masing kategori */}
        {kategori === "Pengeluaran" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Harga</label>
              <input
                type="number"
                value={hargaPengeluaran}
                onChange={(e) => setHargaPengeluaran(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Kategori</label>
              <select
                className="w-full border border-gray-300 rounded-md p-2 cursor-pointer"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                <option>Pengeluaran</option>
                <option>Pemasukan</option>
              </select>
            </div>
          </div>
        )}

        {/* Pemasukan: Harga Beli (dropdown from DB) & Harga Jual (manual) */}
        {kategori === "Pemasukan" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Harga Beli</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 cursor-pointer"
                  value={selectedHargaBeli ?? ""}
                  onChange={(e) => setSelectedHargaBeli(Number(e.target.value))}
                >
                  {loadingPrices ? (
                    <option>Loading...</option>
                  ) : hargaBeliOptions.length === 0 ? (
                    <option value="">Tidak ada stok</option>
                  ) : (
                    hargaBeliOptions.map((p) => (
                      <option key={p} value={p}>
                        {Number(p).toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedHargaBeli
                    ? `${availableCountForPrice} tersedia dengan harga ini`
                    : "Pilih harga beli"}
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Harga Jual</label>
                <input
                  type="number"
                  value={hargaJual}
                  onChange={(e) => setHargaJual(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Kategori</label>
              <select
                className="w-full border border-gray-300 rounded-md p-2 cursor-pointer"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                <option>Pemasukan</option>
                <option>Pengeluaran</option>
              </select>
            </div>
          </>
        )}

        {/* Tombol */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-black text-black font-semibold px-6 py-2 rounded-md hover:bg-gray-100 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-600 transition cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default Page;