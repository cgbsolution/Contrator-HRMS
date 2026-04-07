"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Fingerprint,
  Calendar,
  Receipt,
  ClipboardList,
  PiggyBank,
  User,
  LogOut,
  HardHat,
} from "lucide-react";
import { toast } from "sonner";

const essNavItems = [
  { label: "Dashboard", href: "/ess/dashboard", icon: LayoutDashboard },
  { label: "Punch", href: "/ess/punch", icon: Fingerprint },
  { label: "My Attendance", href: "/ess/attendance", icon: Calendar },
  { label: "My Payslips", href: "/ess/payslips", icon: Receipt },
  { label: "Leave", href: "/ess/leaves", icon: ClipboardList },
  { label: "Investments", href: "/ess/investments", icon: PiggyBank },
  { label: "My Profile", href: "/ess/profile", icon: User },
];

export function EssSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/login");
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-green-600 shadow-md">
          <HardHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Employee Portal</p>
          <p className="text-xs text-slate-400">Self Service</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {essNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-sidebar-accent hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
