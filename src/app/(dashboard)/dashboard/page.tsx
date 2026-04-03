"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  XCircle,
  Loader2,
  RefreshCw,
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

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#6366f1"];

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  bgColor,
  trend,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  trend?: { value: number; label: string };
  href?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        {href && (
          <Link href={href} className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
            View details <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
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

  // Format attendance trend dates for display
  const formattedTrend = attendanceTrend.map((item) => {
    const d = new Date(item.date);
    const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });
    return { ...item, day: dayLabel };
  });

  // Compute max department count for bar widths
  const maxDeptCount = departments.length > 0 ? Math.max(...departments.map((d) => d.count)) : 1;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{greeting}!</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{dateStr}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/contractors/new">
            <Button size="sm" className="gap-2">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workers"
          value={formatNumber(stats.total_workers)}
          subtitle={`${stats.agencies} agencies`}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          href="/contractors"
        />
        <StatCard
          title="Active Today"
          value={formatNumber(stats.today_present)}
          subtitle={`${stats.today_attendance_percentage}% attendance`}
          icon={UserCheck}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          href="/attendance"
        />
        <StatCard
          title="Onboarding"
          value={stats.onboarding_workers}
          subtitle="Pending completion"
          icon={UserPlus}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          href="/contractors/new"
        />
        <StatCard
          title="Offboarding"
          value={stats.offboarding_workers}
          subtitle="In exit process"
          icon={UserMinus}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Monthly Payroll"
          value={formatCurrency(stats.current_month_payroll_total)}
          subtitle="Current month estimate"
          icon={IndianRupee}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          href="/payroll"
        />
        <StatCard
          title="Absent Today"
          value={stats.today_absent}
          subtitle={`${formatNumber(stats.active_workers)} total active`}
          icon={XCircle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Pending Docs"
          value={stats.pending_documents}
          subtitle="Incomplete records"
          icon={FileText}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          href="/documents"
        />
        <StatCard
          title="Compliance Alerts"
          value={compliance.filter((c) => c.status === "overdue" || c.days_remaining <= 7).length}
          subtitle="Overdue/due soon"
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
          href="/compliance/pf"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Weekly Attendance Trend</CardTitle>
                <CardDescription>Present vs Absent - last 7 days</CardDescription>
              </div>
              <Badge variant="success">Live</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {formattedTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={formattedTrend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number, name: string) => [value, name === "present" ? "Present" : "Absent"]}
                  />
                  <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} name="present" />
                  <Bar dataKey="absent" fill="#fca5a5" radius={[4, 4, 0, 0]} name="absent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Workers by Department</CardTitle>
            <CardDescription>Distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={departments.map((d) => ({ name: d.department, value: d.count }))}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {departments.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, "Workers"]} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No department data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Headcount Bars */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Department Headcount</CardTitle>
            <CardDescription>Active workers by department</CardDescription>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <div className="space-y-3">
                {departments.map((dept) => {
                  const pct = Math.round((dept.count / maxDeptCount) * 100);
                  return (
                    <div key={dept.department}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{dept.department}</span>
                        <span className="text-muted-foreground">{dept.count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Compliance Alerts</CardTitle>
              <Link href="/compliance/pf" className="text-xs text-blue-600 hover:underline">Manage</Link>
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
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isOverdue
                          ? "bg-red-50 border-red-200"
                          : isDueSoon
                          ? "bg-amber-50 border-amber-200"
                          : "bg-secondary/30 border-border"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.period} &middot; Due: {new Date(c.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.days_remaining > 0 ? `${c.days_remaining} days remaining` : `${Math.abs(c.days_remaining)} days overdue`}
                        </p>
                      </div>
                      <Badge
                        variant={isOverdue ? "destructive" : isDueSoon ? "warning" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "Upcoming"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No upcoming compliance dues</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
