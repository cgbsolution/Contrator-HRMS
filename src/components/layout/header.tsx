"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Search, Menu, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getInitials } from "@/lib/utils";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contractors": "Workers",
  "/contractors/new": "Onboard Worker",
  "/contractors/offboarding": "Offboarding",
  "/contractors/agencies": "Contractor Agencies",
  "/attendance": "Mark Attendance",
  "/attendance/monthly": "Monthly Attendance",
  "/attendance/shifts": "Shift Management",
  "/payroll": "Process Payroll",
  "/payroll/payslips": "Payslips",
  "/payroll/structures": "Salary Structures",
  "/compliance/pf": "PF Management",
  "/compliance/esi": "ESI Management",
  "/compliance/pt-lwf": "PT & LWF",
  "/compliance/min-wages": "Minimum Wages",
  "/documents": "Document Management",
  "/reports": "Reports",
  "/settings/plant": "Plant Setup",
  "/settings/users": "Users & Roles",
  "/settings/compliance": "Compliance Config",
  "/settings/profile": "My Profile",
  "/ess/dashboard": "Employee Dashboard",
  "/ess/punch": "Punch Attendance",
  "/ess/attendance": "My Attendance",
  "/ess/payslips": "My Payslips",
  "/ess/leaves": "Leave Management",
  "/ess/investments": "Investment Declarations",
  "/ess/profile": "My Profile",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string; tenant_name?: string } | null>(null);
  const [notifications] = useState(3);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const title = pageTitles[pathname] ?? "ContractorHRMS";

  return (
    <header className="h-14 flex items-center gap-3 px-4 lg:px-6 bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-30">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-600">
          <HardHat className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Page title */}
      <h1 className="hidden lg:block text-lg font-semibold text-foreground tracking-tight">{title}</h1>

      {/* Tenant badge */}
      {user?.tenant_name && (
        <div className="hidden md:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-blue-700">{user.tenant_name}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search workers, IDs..."
          className="pl-9 w-56 h-8 text-xs bg-muted/50 border-0 focus-visible:ring-1 rounded-lg"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg">
        <Bell className="h-4 w-4 text-muted-foreground" />
        {notifications > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white">
            {notifications}
          </span>
        )}
      </Button>

      {/* User avatar */}
      {user && (
        <Link
          href={pathname.startsWith("/ess") ? "/ess/profile" : "/settings/profile"}
          className="flex items-center gap-2.5 ml-1 hover:opacity-80 transition-opacity"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {getInitials(user.name)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold leading-tight text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize font-medium">{user.role?.replace("_", " ")}</p>
          </div>
        </Link>
      )}
    </header>
  );
}
