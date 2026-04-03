"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  BarChart3,
  Clock,
  Loader2,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { attendanceApi } from "@/lib/api";
import { toast } from "sonner";

interface MonthlyRecord {
  worker_id: string;
  employee_code: string;
  worker_name: string;
  month: number;
  year: number;
  present_days: number;
  absent_days: number;
  holiday_present: number;
  weekly_off_present: number;
  overtime_hours: number;
  paid_days: number;
  leave_days: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthlyAttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.getMonthly(Number(month), Number(year));
      const data: MonthlyRecord[] = res.data?.records ?? res.data ?? [];
      setRecords(data);
    } catch (err) {
      console.error("Failed to load monthly attendance:", err);
      setError("Failed to load monthly attendance data.");
      toast.error("Failed to load monthly attendance.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = records.filter(
    (r) =>
      !search ||
      r.worker_name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  const totalWorkers = records.length;
  const avgAttendance =
    totalWorkers > 0
      ? (
          (records.reduce((sum, r) => sum + r.present_days, 0) /
            records.reduce(
              (sum, r) => sum + r.present_days + r.absent_days,
              0
            )) *
            100 || 0
        ).toFixed(1)
      : "0.0";
  const totalOT = records.reduce((sum, r) => sum + r.overtime_hours, 0);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2024", "2025", "2026"].map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{formatNumber(totalWorkers)}</p>
              <p className="text-xs text-muted-foreground font-medium">
                Total Workers
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{avgAttendance}%</p>
              <p className="text-xs text-muted-foreground font-medium">
                Avg Attendance
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{formatNumber(totalOT)}</p>
              <p className="text-xs text-muted-foreground font-medium">
                Total OT Hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search worker by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading / Error */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Monthly Attendance - {MONTHS[Number(month) - 1]} {year}
              </CardTitle>
              <Badge variant="secondary">{filtered.length} records</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                    Worker Name
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                    Code
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                    Present
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                    Absent
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                    HP
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                    WOP
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">
                    OT Hours
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                    Paid Days
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">
                    Leave
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((rec) => (
                  <tr
                    key={rec.worker_id}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {rec.worker_name}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground font-mono">
                        {rec.employee_code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-green-700 font-semibold">
                        {rec.present_days}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-red-600 font-semibold">
                        {rec.absent_days}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right hidden md:table-cell">
                      {rec.holiday_present}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden md:table-cell">
                      {rec.weekly_off_present}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden lg:table-cell">
                      {rec.overtime_hours > 0 ? (
                        <span className="text-amber-600 font-medium">
                          {rec.overtime_hours}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {rec.paid_days}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden lg:table-cell">
                      {rec.leave_days}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No records found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
