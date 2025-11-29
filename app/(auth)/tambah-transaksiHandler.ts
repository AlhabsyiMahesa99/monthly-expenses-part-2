"use server";

import { createSupabaseServer } from "@/lib/supabaseServer";

export default async function tambahTransaksiHandler(formData: {
  jenis_transaksi: "Pemasukan" | "Pengeluaran";
  nama_pihak: string;
  jenis_hewan: string;
  jumlah: number;
  harga: number;
  harga_beli?: number;
}) {
  try {
    const supabase = await createSupabaseServer();

    // --- Ambil user login ---
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User belum login");

    // --- Insert transaksi ---
    const { data: insertedTransaksi, error: transaksiError } = await supabase
      .from("transaksi")
      .insert([
        {
          jenis_transaksi: formData.jenis_transaksi,
          nama_pihak: formData.nama_pihak,
          jenis_hewan: formData.jenis_hewan,
          jumlah: formData.jumlah,
          harga: formData.harga,
          tanggal: new Date().toISOString(),
          user_input: user.id,
        },
      ])
      .select()
      .single();

    if (transaksiError) throw transaksiError;
    const transaksiId = insertedTransaksi.id;

    // ==========================================================
    // PEMASUKAN → jual hewan (status: Terjual)
    // ==========================================================
    if (formData.jenis_transaksi === "Pemasukan") {
      let query = supabase
        .from("hewan")
        .select("id")
        .eq("jenis", formData.jenis_hewan)
        .eq("status", "Tersedia");

      if (typeof formData.harga_beli !== "undefined") {
        query = query.eq("harga_beli", formData.harga_beli);
      }

      const { data: available, error: selectError } = await query.limit(
        formData.jumlah
      );

      if (selectError) throw selectError;
      if (!available || available.length < formData.jumlah) {
        await supabase.from("transaksi").delete().eq("id", transaksiId);
        throw new Error("Jumlah hewan tersedia tidak mencukupi");
      }

      const idsToUpdate = available.map((r: any) => r.id);
      const today = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("hewan")
        .update({
          status: "Terjual",
          harga_jual: formData.harga,
          tanggal_keluar: today,
          transaksi_id: transaksiId,
        })
        .in("id", idsToUpdate);

      if (updateError) {
        await supabase.from("transaksi").delete().eq("id", transaksiId);
        throw updateError;
      }
    }

    // ==========================================================
    // PENGELUARAN → beli hewan baru (status: Tersedia)
    // ==========================================================
    if (formData.jenis_transaksi === "Pengeluaran") {
      const hewanBaru = Array.from({ length: formData.jumlah }).map(() => ({
        jenis: formData.jenis_hewan,
        status: "Tersedia",
        harga_beli: formData.harga,
        tanggal_masuk: new Date().toISOString(),
        user_input: user.id,
        transaksi_id: null,              // belum dijual
        pengeluaran_id: transaksiId,     // simpan transaksi asal
      }));

      const { error: insertError } = await supabase
        .from("hewan")
        .insert(hewanBaru);

      if (insertError) {
        await supabase.from("transaksi").delete().eq("id", transaksiId);
        throw insertError;
      }
    }

    return { success: true, message: "Transaksi berhasil disimpan!" };
  } catch (err: any) {
    console.error("❌ Gagal tambah transaksi:", err?.message ?? err);
    return { success: false, error: err?.message ?? String(err) };
  }
}