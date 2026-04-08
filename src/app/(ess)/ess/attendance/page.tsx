"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar } from "lucide-react";
import { essApi } from "@/lib/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  P: { label: "Present", color: "bg-green-100 text-green-700" },
  A: { label: "Absent", color: "bg-red-100 text-red-700" },
  H: { label: "Holiday", color: "bg-blue-100 text-blue-700" },
  HP: { label: "Holiday Present", color: "bg-blue-100 text-blue-700" },
  WO: { label: "Weekly Off", color: "bg-gray-100 text-gray-700" },
  WOP: { label: "Weekly Off Present", color: "bg-gray-100 text-gray-700" },
  OD: { label: "On Duty", color: "bg-purple-100 text-purple-700" },
  L: { label: "Leave", color: "bg-yellow-100 text-yellow-700" },
  ML: { label: "Maternity Leave", color: "bg-yellow-100 text-yellow-700" },
  PL: { label: "Paid Leave", color: "bg-orange-100 text-orange-700" },
  CL: { label: "Casual Leave", color: "bg-orange-100 text-orange-700" },
};

export default function EssAttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    essApi.attendance(month, year)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [month, year]);

  const records = (data?.records as Record<string, unknown>[]) || [];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Attendance</h2>
        <p className="text-muted-foreground text-sm">View your monthly attendance records</p>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-3 flex-wrap">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{data?.present_days as number ?? 0}</p>
            <p className="text-sm text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-600">{data?.absent_days as number ?? 0}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{data?.total_records as number ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Daily Records - {months[month - 1]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attendance records for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3 hidden sm:table-cell">In Time</th>
                    <th className="text-left py-2 px-3 hidden sm:table-cell">Out Time</th>
                    <th className="text-left py-2 px-3">OT Hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const st = STATUS_LABELS[r.status as string] || { label: r.status as string, color: "bg-gray-100 text-gray-700" };
                    return (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">
                          {new Date(r.date as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" })}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 hidden sm:table-cell">{(r.in_time as string) || "-"}</td>
                        <td className="py-2 px-3 hidden sm:table-cell">{(r.out_time as string) || "-"}</td>
                        <td className="py-2 px-3">{(r.overtime_hours as number) || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
