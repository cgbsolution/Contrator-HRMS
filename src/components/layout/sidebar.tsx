"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  badge?: string;
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
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
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

  const isActive = item.href ? pathname === item.href : false;
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
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            hasActiveChild
              ? "bg-sidebar-accent text-white"
              : "text-slate-300 hover:bg-sidebar-accent hover:text-white"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {item.badge}
            </span>
          )}
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        {open && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-700 pl-3">
            {item.children.map((child) => (
              <NavItemComponent key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-sidebar-accent hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {item.badge}
        </span>
      )}
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
    <aside className="flex flex-col h-full w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-blue-600 shadow-md">
          <HardHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">ContractorHRMS</p>
          <p className="text-xs text-slate-400">Plant Workforce</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
        {navItems.map((item) => (
          <NavItemComponent key={item.label} item={item} />
        ))}
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
