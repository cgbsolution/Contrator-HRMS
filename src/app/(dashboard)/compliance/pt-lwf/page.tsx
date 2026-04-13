"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, RefreshCw, Users, IndianRupee } from "lucide-react";
import { formatCurrency, formatNumber, currentMonthYear } from "@/lib/utils";
import { complianceApi } from "@/lib/api";
import { StatsPageSkeleton } from "@/components/ui/page-skeleton";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PtRecord {
  employee_code: string;
  name: string;
  state: string;
  gross: number;
  pt: number;
}

interface PtReport {
  month: number;
  year: number;
  total_workers: number;
  total_pt: number;
  records: PtRecord[];
}

interface LwfStateData {
  workers: number;
  employee_total: number;
  employer_total: number;
}

interface LwfReport {
  month: number;
  year: number;
  by_state: Record<string, LwfStateData>;
}

export default function PTLWFPage() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [month, setMonth] = useState(String(curMonth));
  const [year, setYear] = useState(String(curYear));
  const [ptReport, setPtReport] = useState<PtReport | null>(null);
  const [lwfReport, setLwfReport] = useState<LwfReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ptRes, lwfRes] = await Promise.all([
        complianceApi.ptReport(Number(month), Number(year)),
        complianceApi.lwfReport(Number(month), Number(year)),
      ]);
      setPtReport(ptRes.data);
      setLwfReport(lwfRes.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load PT/LWF data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) return <StatsPageSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load data</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchReports} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ptRecords = ptReport?.records ?? [];
  const lwfStates = lwfReport?.by_state ?? {};

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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

      <Tabs defaultValue="pt">
        <TabsList>
          <TabsTrigger value="pt">Professional Tax</TabsTrigger>
          <TabsTrigger value="lwf">Labour Welfare Fund</TabsTrigger>
        </TabsList>

        {/* PT Tab */}
        <TabsContent value="pt" className="space-y-4 mt-4">
          {/* PT Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Total Workers</p>
                </div>
                <p className="text-2xl font-bold">{formatNumber(ptReport?.total_workers ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="h-4 w-4 text-green-700" />
                  <p className="text-xs text-green-700 font-medium">Total PT</p>
                </div>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(ptReport?.total_pt ?? 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* PT Records Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                PT Details - {MONTHS[Number(month) - 1]} {year}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Code</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">State</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Gross</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">PT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ptRecords.map((rec, i) => (
                    <tr key={`${rec.employee_code}-${i}`} className="hover:bg-secondary/20">
                      <td className="px-4 py-2.5 font-mono text-xs">{rec.employee_code}</td>
                      <td className="px-4 py-2.5 font-medium">{rec.name}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">{rec.state}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(rec.gross)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(rec.pt)}</td>
                    </tr>
                  ))}
                  {ptRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No PT records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* LWF Tab */}
        <TabsContent value="lwf" className="space-y-4 mt-4">
          {Object.keys(lwfStates).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No LWF data available for this period
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(lwfStates).map(([state, data]) => (
                <Card key={state}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{state}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Workers</p>
                        <p className="text-lg font-bold">{formatNumber(data.workers)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Employee Total</p>
                        <p className="text-lg font-bold">{formatCurrency(data.employee_total)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Employer Total</p>
                        <p className="text-lg font-bold">{formatCurrency(data.employer_total)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Grand Total</p>
                        <p className="text-lg font-bold text-blue-700">
                          {formatCurrency(data.employee_total + data.employer_total)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
