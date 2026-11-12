import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "main" | "deputy" | "admin";
export type AdminContext = { id: string; email: string; username: string; role: AdminRole };

export async function getAdminContext(): Promise<AdminContext | null> {
  const auth = await createClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user?.email) return null;
  const admin = createAdminClient();
  const { data, error: membershipError } = await admin.from("admin_members").select("user_id,email,username,role,disabled_at").eq("user_id", user.id).maybeSingle();
  if (membershipError || !data || data.disabled_at) return null;
  return { id: data.user_id, email: data.email, username: data.username, role: data.role as AdminRole };
}

export async function requireAdmin(roles?: AdminRole[]) {
  const context = await getAdminContext();
  if (!context || (roles && !roles.includes(context.role))) return null;
  return context;
}
