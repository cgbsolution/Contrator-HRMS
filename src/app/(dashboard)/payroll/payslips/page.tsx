"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { payrollApi } from "@/lib/api";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PayrollRecord {
  id: string;
  worker_id: string;
  employee_code: string;
  worker_name: string;
  department: string;
  paid_days: number;
  basic: number;
  da: number;
  hra: number;
  gross_salary: number;
  pf_employee: number;
  esi_employee: number;
  pt_amount: number;
  total_deductions: number;
  net_salary: number;
  status: string;
  conveyance_allowance?: number;
  special_allowance?: number;
  medical_allowance?: number;
  lwf_employee?: number;
}

const statusClass: Record<string, string> = {
  processed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-600",
};

export default function PayslipsPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(
    null
  );
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await payrollApi.list({
        month: Number(month),
        year: Number(year),
      });
      setRecords(res.data?.records ?? res.data ?? []);
    } catch (err) {
      console.error("Failed to load payroll records:", err);
      toast.error("Failed to load payslips.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filtered = records.filter(
    (r) =>
      !search ||
      r.worker_name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDownload(id: string, name: string) {
    try {
      const res = await payrollApi.payslip(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${name.replace(/\s+/g, "_")}-${MONTHS[Number(month) - 1]}-${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download payslip:", err);
      toast.error("Failed to download payslip.");
    }
  }

  async function handleDownloadAll() {
    setIsDownloadingAll(true);
    try {
      for (const rec of records) {
        await handleDownload(rec.id, rec.worker_name);
      }
      toast.success(`Downloaded ${records.length} payslips.`);
    } catch (err) {
      console.error("Failed to download all payslips:", err);
      toast.error("Failed to download all payslips.");
    } finally {
      setIsDownloadingAll(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
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
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleDownloadAll}
          disabled={isDownloadingAll || records.length === 0}
        >
          {isDownloadingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download All
        </Button>
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

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">
            Loading payslips...
          </span>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Payslips - {MONTHS[Number(month) - 1]} {year}
              </CardTitle>
              <Badge variant="secondary">{filtered.length} records</Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                    Code
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                    Department
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                    Gross
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">
                    Deductions
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                    Net
                  </th>
                  <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {rec.worker_name}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">
                        {rec.employee_code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">
                      {rec.department}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden md:table-cell">
                      {formatCurrency(rec.gross_salary)}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden lg:table-cell text-red-600">
                      {formatCurrency(rec.total_deductions)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-700">
                      {formatCurrency(rec.net_salary)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          statusClass[rec.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSelectedRecord(rec)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() =>
                            handleDownload(rec.id, rec.worker_name)
                          }
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No payslips found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Payslip Detail Dialog ── */}
      <Dialog
        open={!!selectedRecord}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      >
        {selectedRecord && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payslip - {selectedRecord.worker_name}
              </DialogTitle>
              <DialogDescription>
                {selectedRecord.employee_code} | {selectedRecord.department} |{" "}
                {MONTHS[Number(month) - 1]} {year}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-green-700">
                  Earnings
                </h4>
                <div className="bg-green-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>Basic</span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.basic)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>DA</span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.da)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>HRA</span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.hra)}
                    </span>
                  </div>
                  {(selectedRecord.conveyance_allowance ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Conveyance</span>
                      <span className="font-medium">
                        {formatCurrency(selectedRecord.conveyance_allowance!)}
                      </span>
                    </div>
                  )}
                  {(selectedRecord.special_allowance ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Special Allowance</span>
                      <span className="font-medium">
                        {formatCurrency(selectedRecord.special_allowance!)}
                      </span>
                    </div>
                  )}
                  {(selectedRecord.medical_allowance ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Medical Allowance</span>
                      <span className="font-medium">
                        {formatCurrency(selectedRecord.medical_allowance!)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-green-200 pt-1.5">
                    <span>Gross Salary</span>
                    <span>{formatCurrency(selectedRecord.gross_salary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-700">
                  Deductions
                </h4>
                <div className="bg-red-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>PF (Employee)</span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.pf_employee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ESI (Employee)</span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.esi_employee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Professional Tax</span>
                    <span className="font-medium">
                      {formatCurrency(selectedRecord.pt_amount)}
                    </span>
                  </div>
                  {(selectedRecord.lwf_employee ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>LWF</span>
                      <span className="font-medium">
                        {formatCurrency(selectedRecord.lwf_employee!)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-red-200 pt-1.5">
                    <span>Total Deductions</span>
                    <span>
                      {formatCurrency(selectedRecord.total_deductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">
                    Net Salary
                  </span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatCurrency(selectedRecord.net_salary)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Paid Days: {selectedRecord.paid_days}
                </p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() =>
                  handleDownload(selectedRecord.id, selectedRecord.worker_name)
                }
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
