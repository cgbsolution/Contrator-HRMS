"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  IndianRupee,
  ShieldCheck,
  FileText,
  BarChart3,
  Settings,
  HardHat,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserPlus,
  UserMinus,
  Clock,
  Calendar,
  Banknote,
  Receipt,
  FileCheck,
  AlertCircle,
  Briefcase,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Contractors",
    icon: Users,
    children: [
      { label: "All Workers", href: "/contractors", icon: Users },
      { label: "Onboard Worker", href: "/contractors/new", icon: UserPlus },
      { label: "Offboarding", href: "/contractors/offboarding", icon: UserMinus },
      { label: "Agencies", href: "/contractors/agencies", icon: Briefcase },
    ],
  },
  {
    label: "Attendance",
    icon: ClipboardCheck,
    children: [
      { label: "Mark Attendance", href: "/attendance", icon: ClipboardCheck },
      { label: "Monthly View", href: "/attendance/monthly", icon: Calendar },
      { label: "Shift Management", href: "/attendance/shifts", icon: Clock },
    ],
  },
  {
    label: "Payroll",
    icon: IndianRupee,
    children: [
      { label: "Process Payroll", href: "/payroll", icon: IndianRupee },
      { label: "Payslips", href: "/payroll/payslips", icon: Receipt },
      { label: "Salary Structures", href: "/payroll/structures", icon: Banknote },
    ],
  },
  {
    label: "Compliance",
    icon: ShieldCheck,
    children: [
      { label: "PF Management", href: "/compliance/pf", icon: ShieldCheck },
      { label: "ESI Management", href: "/compliance/esi", icon: ShieldCheck },
      { label: "PT & LWF", href: "/compliance/pt-lwf", icon: FileCheck },
      { label: "Min. Wages", href: "/compliance/min-wages", icon: AlertCircle },
    ],
  },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Plant Setup", href: "/settings/plant", icon: Building2 },
      { label: "Users & Roles", href: "/settings/users", icon: Users },
      { label: "Compliance Config", href: "/settings/compliance", icon: ShieldCheck },
      { label: "My Profile", href: "/settings/profile", icon: User },
    ],
  },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((child) => child.href && pathname.startsWith(child.href));
    }
    return false;
  });

  const isActive = item.href
    ? pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
    : false;
  const Icon = item.icon;

  if (item.children) {
    const hasActiveChild = item.children.some(
      (child) => child.href && (pathname === child.href || pathname.startsWith(child.href + "/"))
    );

    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
            hasActiveChild
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
        </button>
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="ml-[18px] mt-0.5 space-y-0.5 border-l border-white/10 pl-4 py-1">
            {item.children.map((child) => (
              <NavItemComponent key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
        depth > 0 ? "py-1.5" : "",
        isActive
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      <Icon className={cn("shrink-0", depth > 0 ? "h-[15px] w-[15px]" : "h-[18px] w-[18px]")} />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/login");
  }

  return (
    <aside className="flex flex-col h-full w-[260px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <HardHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-[15px] text-white leading-tight tracking-tight">ContractorHRMS</p>
          <p className="text-[11px] text-slate-500 font-medium">Plant Workforce</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {navItems.map((item) => (
          <NavItemComponent key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
