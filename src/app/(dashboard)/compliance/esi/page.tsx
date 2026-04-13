"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Search, Users, IndianRupee, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { formatCurrency, formatNumber, currentMonthYear } from "@/lib/utils";
import { complianceApi } from "@/lib/api";
import { toast } from "sonner";
import { StatsPageSkeleton } from "@/components/ui/page-skeleton";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface EsiMember {
  worker_id: string;
  employee_code: string;
  worker_name: string;
  esi_number: string;
  gross_wages: number;
  employee_contribution: number;
  employer_contribution: number;
  total_contribution: number;
}

interface EsiReport {
  month: number;
  year: number;
  total_eligible: number;
  total_employee: number;
  total_employer: number;
  total_contribution: number;
  members: EsiMember[];
}

export default function ESIManagementPage() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [month, setMonth] = useState(String(curMonth));
  const [year, setYear] = useState(String(curYear));
  const [search, setSearch] = useState("");
  const [report, setReport] = useState<EsiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complianceApi.esiReport(Number(month), Number(year));
      setReport(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load ESI report";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function handleDownloadReturn() {
    setDownloading(true);
    try {
      const res = await complianceApi.downloadEsiReturn(Number(month), Number(year));
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `ESI_Return_${month}_${year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("ESI return file downloaded successfully");
    } catch {
      toast.error("Failed to download ESI return file");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <StatsPageSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load ESI report</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchReport} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const members = report?.members ?? [];
  const filtered = members.filter(
    (r) =>
      !search ||
      r.worker_name.toLowerCase().includes(search.toLowerCase()) ||
      r.esi_number.includes(search) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
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
        <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadReturn} disabled={downloading}>
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download ESI Return
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-muted-foreground">Eligible Members</p>
            </div>
            <p className="text-2xl font-bold">{formatNumber(report?.total_eligible ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">EE Total (0.75%)</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(report?.total_employee ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">ER Total (3.25%)</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(report?.total_employer ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-purple-700" />
              <p className="text-xs text-purple-700 font-medium">Total</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(report?.total_contribution ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Member-wise ESI Details</CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, ESI number, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">ESI No</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Gross Wages</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">EE (0.75%)</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">ER (3.25%)</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((rec) => (
                <tr key={rec.worker_id} className="hover:bg-secondary/20">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{rec.worker_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{rec.employee_code}</p>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell font-mono text-xs">{rec.esi_number}</td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(rec.gross_wages)}</td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(rec.employee_contribution)}</td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">{formatCurrency(rec.employer_contribution)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(rec.total_contribution)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No ESI records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
