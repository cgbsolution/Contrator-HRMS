"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/useSession";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; is_super_admin?: boolean } | null>(null);

  // Session expiry handling
  useSession();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.push("/login");
        return;
      }
      const parsed = JSON.parse(stored);
      if (!parsed.is_super_admin) {
        toast.error("Super admin access required");
        router.push("/dashboard");
        return;
      }
      setUser(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    router.push("/login");
  }

  if (!user) return null;

  const navItems = [
    { href: "/super-admin/tenants", label: "Tenants", icon: Building2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Super Admin</p>
              <p className="text-[10px] text-slate-400">Multi-Tenant Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center px-6 bg-white border-b border-border sticky top-0 z-30">
          <button className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground mr-2">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Super Admin Console</h1>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              {user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "SA"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
