"use server";

import { createSupabaseServer } from "@/lib/supabaseServer";

export default async function updateTransaksiHandler(formData: {
  id: number;
  jenis_transaksi: "Pemasukan" | "Pengeluaran";
  nama_pihak: string;
  jenis_hewan: string;
  jumlah: number;
  harga_beli?: number | null;
  harga_jual: number;
}) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User belum login");

    const { data: oldData, error: oldError } = await supabase
      .from("transaksi")
      .select("*")
      .eq("id", formData.id)
      .single();
    if (oldError || !oldData) throw new Error("Transaksi tidak ditemukan");

    // ==========================================================
    // 1️⃣ Update transaksi
    // ==========================================================
    const { error: updateError } = await supabase
      .from("transaksi")
      .update({
        jenis_transaksi: formData.jenis_transaksi,
        nama_pihak: formData.nama_pihak,
        jenis_hewan: formData.jenis_hewan,
        jumlah: formData.jumlah,
        harga: formData.harga_jual,
        tanggal: new Date().toISOString(),
      })
      .eq("id", formData.id);
    if (updateError) throw updateError;

    // ==========================================================
    // 2️⃣ Sinkronisasi tabel hewan
    // ==========================================================
    if (formData.jenis_transaksi === "Pemasukan") {
      const { data: relatedHewan, error: relErr } = await supabase
        .from("hewan")
        .select("id")
        .eq("transaksi_id", formData.id);
      if (relErr) throw new Error("Gagal ambil data hewan terkait transaksi");

      const oldCount = relatedHewan?.length ?? 0;
      const newCount = formData.jumlah;

      // A1️⃣ Jumlah berkurang → lepas sebagian hewan
      if (newCount < oldCount) {
        const diff = oldCount - newCount;
        const toRelease = relatedHewan.slice(0, diff).map((h) => h.id);
        if (toRelease.length > 0) {
          await supabase
            .from("hewan")
            .update({
              status: "Tersedia",
              transaksi_id: null,
              harga_jual: null,
              tanggal_keluar: null,
            })
            .in("id", toRelease);
        }
      }

      // A2️⃣ Jumlah meningkat → ambil hewan baru
      if (newCount > oldCount) {
        const diff = newCount - oldCount;
        const hargaBeliToUse = formData.harga_beli ?? oldData.harga ?? null;
        if (!hargaBeliToUse)
          throw new Error("Harga beli tidak ditemukan dari frontend atau transaksi lama");

        const { data: newHewan, error: newHewanErr } = await supabase
          .from("hewan")
          .select("id")
          .eq("jenis", formData.jenis_hewan)
          .eq("status", "Tersedia")
          .eq("harga_beli", hargaBeliToUse)
          .limit(diff);

        if (newHewanErr) throw new Error("Gagal ambil data hewan baru");
        if (!newHewan || newHewan.length < diff)
          throw new Error("Jumlah hewan tersedia tidak mencukupi");

        await supabase
          .from("hewan")
          .update({
            status: "Terjual",
            harga_jual: formData.harga_jual,
            tanggal_keluar: new Date().toISOString(),
            transaksi_id: formData.id,
          })
          .in(
            "id",
            newHewan.map((h) => h.id)
          );
      }

      // ✅ Pastikan SEMUA hewan dalam transaksi ikut harga terbaru
      await supabase
        .from("hewan")
        .update({
          harga_jual: formData.harga_jual,
          tanggal_keluar: new Date().toISOString(),
        })
        .eq("transaksi_id", formData.id)
        .eq("status", "Terjual");
    }

    // ==========================================================
    // 3️⃣ Pengeluaran
    // ==========================================================
    if (formData.jenis_transaksi === "Pengeluaran") {
  // Ambil hewan yang terkait dengan pengeluaran ini
  const { data: existingHewan, error: existingErr } = await supabase
    .from("hewan")
    .select("id")
    .eq("pengeluaran_id", formData.id); // ✅ pakai pengeluaran_id

  if (existingErr) throw new Error("Gagal ambil data hewan lama");

  const oldCount = existingHewan?.length ?? 0;
  const newCount = formData.jumlah;

  // 🔻 Kalau jumlah berkurang → hapus sebagian hewan
  if (newCount < oldCount) {
    const diff = oldCount - newCount;
    const toDelete = existingHewan.slice(-diff).map((h) => h.id);

    if (toDelete.length > 0) {
      const { error: deleteErr } = await supabase
        .from("hewan")
        .delete()
        .in("id", toDelete);
      if (deleteErr) throw new Error("Gagal hapus sebagian hewan lama");
    }
  }

  // 🔺 Kalau jumlah bertambah → tambahkan hewan baru
  if (newCount > oldCount) {
    const diff = newCount - oldCount;
    const hewanBaru = Array.from({ length: diff }).map(() => ({
      jenis: formData.jenis_hewan,
      harga_beli: formData.harga_beli ?? formData.harga_jual,
      harga_jual: null,
      tanggal_masuk: new Date().toISOString(),
      status: "Tersedia",
      user_input: user.id,
      pengeluaran_id: formData.id, // ✅ bukan transaksi_id
      transaksi_id: null, // biar gak nabrak logic pemasukan
    }));

    const { error: insertErr } = await supabase
      .from("hewan")
      .insert(hewanBaru);
    if (insertErr) throw new Error("Gagal tambah hewan baru");
  }

  // 🔁 Update info hewan lama (biar sinkron jenis & harga_beli kalau berubah)
if (oldCount > 0) {
  // Ambil harga dari transaksi (karena kolom di tabel transaksi = harga)
  const hargaBeliBaru = Number(formData.harga_jual ?? 0);

  if (!hargaBeliBaru) {
    console.warn("⚠️ Tidak ada nilai harga beli valid dikirim dari formData");
  }

  const { error: updateErr } = await supabase
    .from("hewan")
    .update({
      jenis: formData.jenis_hewan,
      harga_beli: hargaBeliBaru,
      tanggal_masuk: new Date().toISOString(), // update timestamp biar keliatan
    })
    .eq("pengeluaran_id", formData.id); // jangan pake filter status, biar semua kena

  if (updateErr) throw new Error("Gagal update data hewan lama");
}
}

    return { success: true, message: "Transaksi & data hewan berhasil diperbarui!" };
  } catch (err: any) {
    console.error("❌ Gagal update transaksi:", err?.message ?? err);
    return { success: false, error: err?.message ?? String(err) };
  }
}
