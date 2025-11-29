import { supabase } from "@/lib/supabaseClient";

export default async function loginHandler(identifier: string, password: string) {
  try {
    let email = identifier;

    // Cek apakah input bukan email (berarti username)
    if (!identifier.includes("@")) {
      const { data: userByUsername, error: userError } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("full_name", identifier) 
        .single();

      if (userError || !userByUsername) {
        return { error: "Username tidak ditemukan" };
      }

      email = userByUsername.email;
    }

    // Login dengan email
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: error?.message || "Login gagal" };
    }

    // Ambil role user
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    return { role: profile?.role || "staff" };
  } catch (err: any) {
    return { error: err.message };
  }
}
