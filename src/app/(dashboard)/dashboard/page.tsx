"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  ClipboardCheck,
  IndianRupee,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  XCircle,
  RefreshCw,
  Calendar,
  Clock,
  Building2,
  Activity,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { dashboardApi } from "@/lib/api";
import type { DashboardStats } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AttendanceTrendItem {
  date: string;
  present: number;
  absent: number;
}

interface DepartmentItem {
  department: string;
  count: number;
}

interface ComplianceItem {
  name: string;
  period: string;
  due_date: string;
  days_remaining: number;
  status: string;
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#3b82f6"];

// ─── Skeleton Loader for Dashboard ─────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="hidden md:flex gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-[200px] w-full rounded-full mx-auto max-w-[200px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  trend?: { value: number; up: boolean };
  href?: string;
}) {
  const content = (
    <Card className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative">
      <CardContent className="p-5 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[13px] text-muted-foreground font-medium">{title}</p>
            <p className="text-[28px] font-bold tracking-tight leading-none">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
                {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend.up ? "+" : ""}{trend.value}%</span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${gradient} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {href && (
          <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium group-hover:gap-2 transition-all">
            View details <ArrowUpRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [compliance, setCompliance] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendRes, deptRes, compRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.attendanceTrend(7),
        dashboardApi.workersByDepartment(),
        dashboardApi.upcomingCompliance(),
      ]);
      setStats(statsRes.data);
      setAttendanceTrend(trendRes.data);
      setDepartments(deptRes.data);
      setCompliance(compRes.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── Skeleton loading state ────────────────────────────────────────────
  if (loading) {
    return <DashboardSkeleton />;
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Something went wrong</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTrend = attendanceTrend.map((item) => {
    const d = new Date(item.date);
    return {
      ...item,
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      total: item.present + item.absent,
    };
  });

  const maxDeptCount = departments.length > 0 ? Math.max(...departments.map((d) => d.count)) : 1;

  return (
    <div className="space-y-6">
      {/* ── Greeting Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{greeting}!</h2>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">{dateStr}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/contractors/new">
            <Button size="sm" className="gap-2 shadow-sm">
              <UserPlus className="h-4 w-4" />
              Onboard Worker
            </Button>
          </Link>
          <Link href="/attendance">
            <Button size="sm" variant="outline" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Mark Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards Row 1 ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Workers"
          value={formatNumber(stats.total_workers)}
          subtitle={`${stats.agencies} agencies`}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          href="/contractors"
        />
        <StatCard
          title="Present Today"
          value={formatNumber(stats.today_present)}
          subtitle={`${stats.today_attendance_percentage}% attendance`}
          icon={UserCheck}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          trend={stats.today_attendance_percentage > 80 ? { value: stats.today_attendance_percentage, up: true } : undefined}
          href="/attendance"
        />
        <StatCard
          title="Onboarding"
          value={stats.onboarding_workers}
          subtitle="Pending completion"
          icon={UserPlus}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          href="/contractors"
        />
        <StatCard
          title="Offboarding"
          value={stats.offboarding_workers}
          subtitle="In exit process"
          icon={UserMinus}
          gradient="bg-gradient-to-br from-orange-400 to-orange-500"
          href="/contractors/offboarding"
        />
      </div>

      {/* ── KPI Cards Row 2 ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Payroll"
          value={formatCurrency(stats.current_month_payroll_total)}
          subtitle="Current month estimate"
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          href="/payroll"
        />
        <StatCard
          title="Absent Today"
          value={stats.today_absent}
          subtitle={`${formatNumber(stats.active_workers)} active workers`}
          icon={XCircle}
          gradient="bg-gradient-to-br from-red-400 to-rose-500"
        />
        <StatCard
          title="Pending Docs"
          value={stats.pending_documents}
          subtitle="Awaiting verification"
          icon={FileText}
          gradient="bg-gradient-to-br from-amber-400 to-amber-500"
          href="/documents"
        />
        <StatCard
          title="Compliance"
          value={compliance.filter((c) => c.status === "overdue" || c.days_remaining <= 7).length}
          subtitle="Overdue / due soon"
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-rose-500 to-red-600"
          href="/compliance/pf"
        />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Attendance Trend</CardTitle>
                <CardDescription className="text-xs">Present vs Absent — last 7 days</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="text-muted-foreground">Absent</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {formattedTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={formattedTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number, name: string) => [value, name === "present" ? "Present" : "Absent"]}
                  />
                  <Area type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2.5} fill="url(#presentGrad)" name="present" />
                  <Bar dataKey="absent" fill="#fda4af" radius={[4, 4, 0, 0]} barSize={20} name="absent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                <Activity className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No attendance data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Donut Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">By Department</CardTitle>
            <CardDescription className="text-xs">Active worker distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={departments.map((d) => ({ name: d.department || "Unassigned", value: d.count }))}
                    cx="50%"
                    cy="42%"
                    innerRadius={60}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {departments.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", fontSize: "12px", border: "1px solid #e2e8f0" }}
                    formatter={(v: number) => [v, "Workers"]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", lineHeight: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                <Building2 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No departments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Headcount */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Department Headcount</CardTitle>
                <CardDescription className="text-xs">Active workers by department</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">{departments.length} depts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <div className="space-y-4">
                {departments.map((dept, idx) => {
                  const pct = Math.round((dept.count / maxDeptCount) * 100);
                  const color = PIE_COLORS[idx % PIE_COLORS.length];
                  return (
                    <div key={dept.department} className="group">
                      <div className="flex justify-between items-center text-sm mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-medium text-foreground">{dept.department || "Unassigned"}</span>
                        </div>
                        <span className="font-semibold text-foreground">{dept.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No department data</p>
            )}
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Compliance Deadlines</CardTitle>
                <CardDescription className="text-xs">Upcoming statutory due dates</CardDescription>
              </div>
              <Link href="/compliance/pf">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 gap-1 h-7 px-2">
                  View all <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {compliance.length > 0 ? (
              <div className="space-y-3">
                {compliance.map((c, i) => {
                  const isOverdue = c.status === "overdue";
                  const isDueSoon = c.days_remaining <= 7 && !isOverdue;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        isOverdue
                          ? "bg-red-50/80 border-red-200"
                          : isDueSoon
                          ? "bg-amber-50/80 border-amber-200"
                          : "bg-muted/30 border-border"
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isOverdue ? "bg-red-100" : isDueSoon ? "bg-amber-100" : "bg-muted"
                      }`}>
                        <Clock className={`h-4 w-4 ${
                          isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.period} &middot; Due {new Date(c.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {isOverdue ? (
                          <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                        ) : isDueSoon ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">{c.days_remaining}d left</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{c.days_remaining}d</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No upcoming compliance dues</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
