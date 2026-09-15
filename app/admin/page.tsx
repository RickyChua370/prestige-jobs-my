import { isAuthenticated } from "@/lib/auth";
import { listPrograms } from "@/lib/db";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) return <AdminLogin />;
  return <AdminDashboard initialPrograms={listPrograms()} />;
}
