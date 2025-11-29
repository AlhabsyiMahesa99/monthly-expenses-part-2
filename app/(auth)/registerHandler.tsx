"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function registerHandler(
  username: string,
  email: string,
  password: string
) {
  try {
    if (!email || !password) {
      return { success: false, error: "Email dan password wajib diisi!" };
    }

    const cookieStore = await cookies();

    // 🔹 Buat Supabase client khusus server
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 🔹 Buat akun baru
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Gagal membuat user." };
    }

    // 🔹 Tambahkan ke tabel profiles
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        full_name: username,
        role: "staff",
      },
    ]);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, message: "Registrasi berhasil!" };
  } catch (err: any) {
    console.error("❌ Error register:", err.message);
    return { success: false, error: err.message };
  }
}