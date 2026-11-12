import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage(){const admin=await requireAdmin();if(!admin)redirect("/admin/login");return <AdminDashboard admin={admin}/>}
