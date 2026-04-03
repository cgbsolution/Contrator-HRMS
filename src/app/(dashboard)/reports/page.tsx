"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, ClipboardCheck, IndianRupee, ShieldCheck, Users,
  Loader2, AlertTriangle, Calendar,
} from "lucide-react";
import { formatCurrency, formatNumber, currentMonthYear } from "@/lib/utils";
import { complianceApi, reportsApi } from "@/lib/api";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface AttendanceSummary {
  month: number;
  year: number;
  total_workers: number;
  total_present_days: number;
  total_absent_days: number;
  total_ot_hours: number;
  [key: string]: unknown;
}

interface HeadcountData {
  by_status: Record<string, number>;
  by_department: Record<string, number>;
  by_category: Record<string, number>;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [month, setMonth] = useState(String(curMonth));
  const [year, setYear] = useState(String(curYear));

  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [headcount, setHeadcount] = useState<HeadcountData | null>(null);
  const [headcountLoading, setHeadcountLoading] = useState(false);

  const [downloadingWage, setDownloadingWage] = useState(false);
  const [downloadingSalary, setDownloadingSalary] = useState(false);
  const [downloadingEcr, setDownloadingEcr] = useState(false);
  const [downloadingEsi, setDownloadingEsi] = useState(false);

  async function handleAttendanceReport() {
    setAttendanceLoading(true);
    try {
      const res = await reportsApi.attendance({ month: Number(month), year: Number(year) });
      setAttendanceSummary(res.data);
      toast.success("Attendance report loaded");
    } catch {
      toast.error("Failed to load attendance report");
    } finally {
      setAttendanceLoading(false);
    }
  }

  async function handleWageRegister() {
    setDownloadingWage(true);
    try {
      const res = await reportsApi.wageRegister(Number(month), Number(year));
      triggerBlobDownload(new Blob([res.data]), `Wage_Register_${month}_${year}.xlsx`);
      toast.success("Wage register downloaded");
    } catch {
      toast.error("Failed to download wage register");
    } finally {
      setDownloadingWage(false);
    }
  }

  async function handleSalaryRegister() {
    setDownloadingSalary(true);
    try {
      const res = await reportsApi.salaryRegister(Number(month), Number(year));
      triggerBlobDownload(new Blob([res.data]), `Salary_Register_${month}_${year}.xlsx`);
      toast.success("Salary register downloaded");
    } catch {
      toast.error("Failed to download salary register");
    } finally {
      setDownloadingSalary(false);
    }
  }

  async function handlePfEcr() {
    setDownloadingEcr(true);
    try {
      const res = await complianceApi.downloadPfEcr(Number(month), Number(year));
      triggerBlobDownload(new Blob([res.data]), `PF_ECR_${month}_${year}.txt`);
      toast.success("PF ECR downloaded");
    } catch {
      toast.error("Failed to download PF ECR");
    } finally {
      setDownloadingEcr(false);
    }
  }

  async function handleEsiReturn() {
    setDownloadingEsi(true);
    try {
      const res = await complianceApi.downloadEsiReturn(Number(month), Number(year));
      triggerBlobDownload(new Blob([res.data]), `ESI_Return_${month}_${year}.xlsx`);
      toast.success("ESI return downloaded");
    } catch {
      toast.error("Failed to download ESI return");
    } finally {
      setDownloadingEsi(false);
    }
  }

  async function handleHeadcount() {
    setHeadcountLoading(true);
    try {
      const res = await reportsApi.headcount();
      setHeadcount(res.data);
      toast.success("Headcount report loaded");
    } catch {
      toast.error("Failed to load headcount report");
    } finally {
      setHeadcountLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Report Period:
            </div>
            <div className="flex items-center gap-3">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026"].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Reports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-green-100 text-green-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Attendance Reports</CardTitle>
              <CardDescription>View attendance summary for the period</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleAttendanceReport} disabled={attendanceLoading} className="gap-2">
            {attendanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Attendance Report
          </Button>
          {attendanceSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Workers</p>
                <p className="text-lg font-bold">{formatNumber(attendanceSummary.total_workers)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-700">Present Days</p>
                <p className="text-lg font-bold text-green-800">{formatNumber(attendanceSummary.total_present_days)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-700">Absent Days</p>
                <p className="text-lg font-bold text-red-800">{formatNumber(attendanceSummary.total_absent_days)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700">OT Hours</p>
                <p className="text-lg font-bold text-blue-800">{formatNumber(attendanceSummary.total_ot_hours)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Reports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-700">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Payroll Reports</CardTitle>
              <CardDescription>Download wage and salary registers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleWageRegister} disabled={downloadingWage} className="gap-2">
              {downloadingWage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Wage Register
            </Button>
            <Button variant="outline" onClick={handleSalaryRegister} disabled={downloadingSalary} className="gap-2">
              {downloadingSalary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Salary Register
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Reports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-purple-100 text-purple-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Compliance Reports</CardTitle>
              <CardDescription>Download statutory compliance files</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handlePfEcr} disabled={downloadingEcr} className="gap-2">
              {downloadingEcr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PF ECR
            </Button>
            <Button variant="outline" onClick={handleEsiReturn} disabled={downloadingEsi} className="gap-2">
              {downloadingEsi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download ESI Return
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Headcount Reports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Headcount</CardTitle>
              <CardDescription>View workforce distribution</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleHeadcount} disabled={headcountLoading} className="gap-2">
            {headcountLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            View Headcount
          </Button>
          {headcount && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* By Status */}
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">By Status</h4>
                <div className="space-y-2">
                  {Object.entries(headcount.by_status).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="capitalize">{status.replace(/_/g, " ")}</span>
                      <span className="font-semibold">{formatNumber(count as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* By Department */}
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">By Department</h4>
                <div className="space-y-2">
                  {Object.entries(headcount.by_department).map(([dept, count]) => (
                    <div key={dept} className="flex justify-between text-sm">
                      <span>{dept}</span>
                      <span className="font-semibold">{formatNumber(count as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* By Category */}
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">By Category</h4>
                <div className="space-y-2">
                  {Object.entries(headcount.by_category).map(([cat, count]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <span className="font-semibold">{formatNumber(count as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
