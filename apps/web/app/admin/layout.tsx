import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Strict Server-Side Security Guard
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/"); // Kick non-admins back to the homepage
  }

  return (
    <div className="min-h-screen bg-[#09090b] pt-24 px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-extrabold text-white">Admin Command Center</h1>
          <span className="px-3 py-1 bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/20 rounded-full text-xs font-bold tracking-widest uppercase">
            Superuser Access
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}