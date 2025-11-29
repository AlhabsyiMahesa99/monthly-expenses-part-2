"use server";

import { createSupabaseServer } from "@/lib/supabaseServer";

export default async function deleteTransaksiHandler(id: number) {
  try {
    const supabase = await createSupabaseServer();

    // Ambil transaksi dulu
    const { data: transaksi, error: trxError } = await supabase
      .from("transaksi")
      .select("*")
      .eq("id", id)
      .single();

    if (trxError || !transaksi) throw new Error("Transaksi tidak ditemukan");

    // Jika jenisnya Pengeluaran -> hapus hewan yang ditambahkan
    if (transaksi.jenis_transaksi === "Pengeluaran") {
      const { data: hewanList, error: hewanError } = await supabase
        .from("hewan")
        .select("id, status")
        .eq("pengeluaran_id", transaksi.id); // ambil hewan dari pengeluaran ini

      if (hewanError) throw hewanError;

      const adaTerjual = hewanList?.some((h) => h.status === "Terjual");
      if (adaTerjual) {
        throw new Error(
          "Transaksi tidak dapat dihapus karena ada hewan yang sudah terjual."
        );
      }

      const hewanIds = hewanList.map((h) => h.id);
      if (hewanIds.length > 0) {
        await supabase.from("hewan").delete().in("id", hewanIds);
      }
    }

    // Jika jenisnya Pemasukan -> ubah hewan kembali jadi Tersedia
    if (transaksi.jenis_transaksi === "Pemasukan") {
      // Update hewan agar statusnya kembali tersedia
      const { error: updateErr } = await supabase
        .from("hewan")
        .update({
          status: "Tersedia",
          transaksi_id: null,
          harga_jual: null,
          tanggal_keluar: null,
        })
        .eq("transaksi_id", transaksi.id); // <=== ini baris untuk update hewan
      if (updateErr) throw updateErr;
    }

    // Hapus transaksi
    const { error: deleteError } = await supabase
      .from("transaksi")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;

    return { success: true, message: "Transaksi berhasil dihapus." };
  } catch (err: any) {
    console.error("❌ Gagal hapus transaksi:", err?.message ?? err);
    return { success: false, error: err?.message ?? String(err) };
  }
}
