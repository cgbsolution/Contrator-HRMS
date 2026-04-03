import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

export function formatDate(date: string | Date, fmt = "dd MMM yyyy"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatMonth(month: number, year: number): string {
  return format(new Date(year, month - 1, 1), "MMM yyyy");
}

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export const workerStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  onboarding: { label: "Onboarding", color: "bg-blue-100 text-blue-800" },
  offboarding: { label: "Offboarding", color: "bg-orange-100 text-orange-800" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-600" },
  terminated: { label: "Terminated", color: "bg-red-100 text-red-800" },
};

export const attendanceCodeConfig: Record<string, { label: string; color: string; paid: boolean }> = {
  P: { label: "Present", color: "bg-green-600 text-white", paid: true },
  A: { label: "Absent", color: "bg-red-600 text-white", paid: false },
  H: { label: "Holiday", color: "bg-blue-700 text-white", paid: true },
  HP: { label: "Holiday Present", color: "bg-blue-600 text-white", paid: true },
  WO: { label: "Weekly Off", color: "bg-gray-600 text-white", paid: true },
  WOP: { label: "WO Present", color: "bg-purple-600 text-white", paid: true },
  OD: { label: "On Duty", color: "bg-teal-700 text-white", paid: true },
  OT: { label: "Overtime", color: "bg-amber-600 text-white", paid: true },
  L: { label: "Leave", color: "bg-yellow-600 text-white", paid: false },
  ML: { label: "Medical Leave", color: "bg-pink-600 text-white", paid: false },
  PL: { label: "Paid Leave", color: "bg-indigo-600 text-white", paid: true },
  CL: { label: "Casual Leave", color: "bg-cyan-700 text-white", paid: true },
};

// ─── Compliance Calculations ──────────────────────────────────────────────────

export function calculatePF(basic_da: number, pf_ceiling = 15000) {
  const eligible = Math.min(basic_da, pf_ceiling);
  return {
    employee: Math.round(eligible * 0.12),
    employer_epf: Math.round(eligible * 0.0367),
    employer_eps: Math.round(eligible * 0.0833),
    employer_edli: Math.round(eligible * 0.005),
    admin: Math.round(eligible * 0.005),
  };
}

export function calculateESI(gross: number, esi_ceiling = 21000) {
  if (gross > esi_ceiling) return { employee: 0, employer: 0, applicable: false };
  return {
    employee: Math.round(gross * 0.0075),
    employer: Math.round(gross * 0.0325),
    applicable: true,
  };
}

export function calculatePT(gross: number, state: string): number {
  // Professional Tax slabs (monthly) - key Indian states
  const slabs: Record<string, { min: number; max: number | null; pt: number }[]> = {
    Maharashtra: [
      { min: 0, max: 7500, pt: 0 },
      { min: 7501, max: 10000, pt: 175 },
      { min: 10001, max: null, pt: 200 },
    ],
    Karnataka: [
      { min: 0, max: 15000, pt: 0 },
      { min: 15001, max: null, pt: 200 },
    ],
    Gujarat: [
      { min: 0, max: 5999, pt: 0 },
      { min: 6000, max: 8999, pt: 80 },
      { min: 9000, max: 11999, pt: 150 },
      { min: 12000, max: null, pt: 200 },
    ],
    "Tamil Nadu": [
      { min: 0, max: 3500, pt: 0 },
      { min: 3501, max: 5000, pt: 22.5 },
      { min: 5001, max: 7500, pt: 52.5 },
      { min: 7501, max: 10000, pt: 115 },
      { min: 10001, max: 12500, pt: 171 },
      { min: 12501, max: null, pt: 208 },
    ],
    "West Bengal": [
      { min: 0, max: 10000, pt: 0 },
      { min: 10001, max: 15000, pt: 110 },
      { min: 15001, max: 25000, pt: 130 },
      { min: 25001, max: 40000, pt: 150 },
      { min: 40001, max: null, pt: 200 },
    ],
  };

  const stateSlab = slabs[state];
  if (!stateSlab) return 0;

  for (const slab of stateSlab) {
    if (gross >= slab.min && (slab.max === null || gross <= slab.max)) {
      return slab.pt;
    }
  }
  return 0;
}

// ─── String Helpers ───────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len = 30): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export function formatAadhaar(num: string): string {
  return num.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
}

// ─── File Helpers ─────────────────────────────────────────────────────────────

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
