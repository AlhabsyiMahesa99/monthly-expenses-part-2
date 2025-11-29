"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import updateTransaksiHandler from "@/app/(auth)/update-transaksiHandler";

const EditTransaksiPage: React.FC = () => {
  const { id } = useParams(); // id from route
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [jenisTransaksi, setJenisTransaksi] = useState<
    "Pemasukan" | "Pengeluaran"
  >("Pengeluaran");
  const [namaPihak, setNamaPihak] = useState("");
  const [jenisHewan, setJenisHewan] = useState("Kambing");
  const [jumlah, setJumlah] = useState(1);
  const [harga, setHarga] = useState<number>(0); // harga jual
  const [tanggal, setTanggal] = useState<string | null>(null);

  // Untuk dropdown harga beli & jumlah
  const [hargaBeliOptions, setHargaBeliOptions] = useState<number[]>([]);
  const [selectedHargaBeli, setSelectedHargaBeli] = useState<number | null>(null);
  const [availableCountForPrice, setAvailableCountForPrice] = useState(0);
  const [hargaJual, setHargaJual] = useState<number>(0);

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

  // Fetch detail transaksi
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);

      // Ambil detail transaksi dulu
      const { data, error } = await supabase
        .from("transaksi")
        .select(
          `
      id,
      jenis_transaksi,
      nama_pihak,
      jenis_hewan,
      jumlah,
      harga,
      tanggal
    `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetch detail:", error);
        setLoading(false);
        return;
      }

      setJenisTransaksi(data.jenis_transaksi);
      setNamaPihak(data.nama_pihak);
      setJenisHewan(data.jenis_hewan);
      setJumlah(data.jumlah);
      setHarga(Number(data.harga));
      setHargaJual(Number(data.harga));
      setTanggal(data.tanggal ? data.tanggal.split("T")[0] : null);

      // Jika transaksi pemasukan, ambil harga_beli dari tabel hewan
      if (data.jenis_transaksi === "Pemasukan") {
        const { data: hewanData, error: hewanError } = await supabase
          .from("hewan")
          .select("harga_beli")
          .eq("transaksi_id", data.id) // ✅ ambil langsung dari transaksi ini!
          .limit(1);

        if (hewanError) {
          console.error("Gagal ambil harga_beli:", hewanError.message);
        } else if (hewanData?.length) {
          setSelectedHargaBeli(Number(hewanData[0].harga_beli));
        }

        // lalu ambil semua harga_beli unik untuk dropdown
        const { data: hargaList, error: listErr } = await supabase
          .from("hewan")
          .select("harga_beli")
          .eq("jenis", data.jenis_hewan);

        if (!listErr) {
          const prices = Array.from(
            new Set((hargaList || []).map((r: any) => Number(r.harga_beli)))
          ).sort((a, b) => a - b);
          setHargaBeliOptions(prices);
        }
      }

      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  // Fetch harga beli list kalau jenis hewan berubah
  useEffect(() => {
    if (jenisTransaksi !== "Pemasukan") return;

    const fetchPrices = async () => {
      const { data, error } = await supabase
        .from("hewan")
        .select("harga_beli")
        .eq("jenis", jenisHewan);

      if (error) {
        console.error("Gagal fetch harga beli:", error.message);
        setHargaBeliOptions([]);
        return;
      }

      const prices = Array.from(
        new Set((data || []).map((r: any) => Number(r.harga_beli)))
      ).sort((a, b) => a - b);

      setHargaBeliOptions(prices);
      if (!selectedHargaBeli) setSelectedHargaBeli(prices[0] || null);
    };

    fetchPrices();
  }, [jenisHewan, jenisTransaksi]);

  // Hitung stok berdasarkan harga beli yang dipilih
  useEffect(() => {
    if (jenisTransaksi !== "Pemasukan" || !selectedHargaBeli) return;

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("hewan")
        .select("id", { count: "exact", head: true })
        .eq("jenis", jenisHewan)
        .eq("harga_beli", selectedHargaBeli)
        .in("status", ["Tersedia", "Terjual"]);

      if (error) {
        console.error("Gagal fetch count:", error.message);
        return;
      }

      setAvailableCountForPrice(count ?? 0);
    };

    fetchCount();
  }, [selectedHargaBeli, jenisHewan, jenisTransaksi]);

  // Simpan transaksi
  const handleSave = async () => {
    if (!namaPihak || jumlah <= 0 || hargaJual <= 0) {
      alert("Nama pihak, jumlah, dan harga jual wajib diisi dan > 0");
      return;
    }

    setSaving(true);
    const safeId = Number(id);
    if (!safeId || isNaN(safeId)) {
      alert("ID transaksi tidak valid!");
      return;
    }

    const result = await updateTransaksiHandler({
      id: safeId,
      jenis_transaksi: jenisTransaksi,
      nama_pihak: namaPihak,
      jenis_hewan: jenisHewan,
      jumlah,
      harga_beli: selectedHargaBeli ?? null, // harga beli yang dipilih user
      harga_jual: jenisTransaksi === "Pengeluaran" ? harga : hargaJual, // harga jual yang diinput user
    });

    setSaving(false);

    if (result.success) {
      alert(result.message);
      router.push(`/${userRole}/data-transaksi`);
    } else {
      alert("Gagal update: " + result.error);
    }
  };

  if (loading) return <p className="text-center py-5">Loading...</p>;

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-black text-2xl font-bold mb-6">Edit Transaksi</h2>

      {jenisTransaksi === "Pengeluaran" ? (
        /* ---------- FORM PENGELUARAN ---------- */
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-black font-medium mb-1">
              Nama Penjual
            </label>
            <input
              value={namaPihak}
              onChange={(e) => setNamaPihak(e.target.value)}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-black font-medium mb-1">Jumlah</label>
            <input
              type="number"
              min={1}
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-black font-medium mb-1">
              Jenis Hewan
            </label>
            <select
              value={jenisHewan}
              onChange={(e) => setJenisHewan(e.target.value)}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 cursor-pointer"
            >
              <option>Kambing</option>
              <option>Sapi</option>
              <option>Domba</option>
            </select>
          </div>

          <div>
            <label className="block text-black font-medium mb-1">
              Kategori
            </label>
            <input
              value={jenisTransaksi}
              disabled
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-black font-medium mb-1">Harga</label>
            <input
              type="number"
              value={harga}
              onChange={(e) => setHarga(Number(e.target.value))}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-black font-medium mb-1">Tanggal</label>
            <input
              type="date"
              value={tanggal ?? ""}
              onChange={(e) => setTanggal(e.target.value)}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2"
            />
          </div>
        </div>
      ) : (
        /* ---------- FORM PEMASUKAN ---------- */
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-black font-medium mb-1">
              Nama Pembeli
            </label>
            <input
              value={namaPihak}
              onChange={(e) => setNamaPihak(e.target.value)}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2"
            />
          </div>

          {/* Jumlah Dropdown */}
          <div>
            <label className="block text-black font-medium mb-1">Jumlah</label>
            <select
              value={jumlah}
              onChange={(e) => setJumlah(Number(e.target.value))}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 cursor-pointer"
            >
              {Array.from(
                { length: Math.max(jumlah, availableCountForPrice) }, // pastikan jumlah sebelumnya tetap muncul
                (_, i) => i + 1
              ).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-black font-medium mb-1">
              Jenis Hewan
            </label>
            <select
              value={jenisHewan}
              onChange={(e) => setJenisHewan(e.target.value)}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 cursor-pointer"
            >
              <option>Kambing</option>
              <option>Sapi</option>
              <option>Domba</option>
            </select>
          </div>

          <div>
            <label className="block text-black font-medium mb-1">
              Kategori
            </label>
            <input
              value={jenisTransaksi}
              disabled
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 cursor-not-allowed"
            />
          </div>

          {/* Harga Beli Dropdown */}
          <div>
            <label className="block text-black font-medium mb-1">
              Harga Beli
            </label>
            <select
              value={selectedHargaBeli ?? ""}
              onChange={(e) => setSelectedHargaBeli(Number(e.target.value))}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2 cursor-pointer"
            >
              {loading ? (
                <option>Loading...</option>
              ) : hargaBeliOptions.length === 0 ? (
                <option value="">Tidak ada data</option>
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
            <p className="text-xs text-gray-500 mt-1">
              {selectedHargaBeli
                ? `${availableCountForPrice} tersedia dengan harga ini`
                : "Pilih harga beli"}
            </p>
          </div>

          <div>
            <label className="block text-black font-medium mb-1">
              Harga Jual
            </label>
            <input
              type="number"
              value={hargaJual}
              onChange={(e) => setHargaJual(Number(e.target.value))}
              className="text-black border-2 border-gray-300 w-full rounded-md p-2"
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => router.back()}
          className="flex-1 border border-black text-black py-3 rounded-md font-semibold hover:bg-gray-100 cursor-pointer"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-md font-semibold cursor-pointer"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
};

export default EditTransaksiPage;