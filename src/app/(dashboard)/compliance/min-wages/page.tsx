"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import { formatCurrency, formatDate, formatNumber, currentMonthYear } from "@/lib/utils";
import { complianceApi } from "@/lib/api";

const STATES = [
  "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "West Bengal",
  "Andhra Pradesh", "Telangana", "Rajasthan", "Madhya Pradesh", "Uttar Pradesh",
];

const CATEGORIES = [
  "Unskilled", "Semi-Skilled", "Skilled", "Highly Skilled", "Clerical", "Supervisory",
];

interface MinWageEntry {
  id: string;
  state: string;
  zone: string;
  work_category: string;
  basic_wage: number;
  da: number;
  total_minimum: number;
  effective_from: string;
  effective_to: string;
}

interface Violation {
  employee_code: string;
  worker_name: string;
  state: string;
  category: string;
  daily_rate_paid: number;
  minimum_daily_rate: number;
  shortfall: number;
}

interface ComplianceCheck {
  month: number;
  year: number;
  total_workers: number;
  violations: Violation[];
  compliant: boolean;
}

export default function MinWagesPage() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [state, setState] = useState("Maharashtra");
  const [category, setCategory] = useState("Unskilled");
  const [wages, setWages] = useState<MinWageEntry[]>([]);
  const [wagesLoading, setWagesLoading] = useState(false);
  const [wagesError, setWagesError] = useState<string | null>(null);

  const [month, setMonth] = useState(String(curMonth));
  const [year, setYear] = useState(String(curYear));
  const [compliance, setCompliance] = useState<ComplianceCheck | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const fetchWages = useCallback(async () => {
    setWagesLoading(true);
    setWagesError(null);
    try {
      const res = await complianceApi.minimumWages({ state, category });
      setWages(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load minimum wages";
      setWagesError(message);
    } finally {
      setWagesLoading(false);
    }
  }, [state, category]);

  const fetchCompliance = useCallback(async () => {
    setComplianceLoading(true);
    setComplianceError(null);
    try {
      const res = await complianceApi.checkMinWageCompliance(Number(month), Number(year));
      setCompliance(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to check compliance";
      setComplianceError(message);
    } finally {
      setComplianceLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchWages();
  }, [fetchWages]);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  return (
    <div className="space-y-6">
      {/* Minimum Wages Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Minimum Wages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {wagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : wagesError ? (
            <div className="text-center py-8 space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">{wagesError}</p>
              <Button onClick={fetchWages} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">State</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">Zone</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Category</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Basic</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">DA</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Total Minimum</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">Effective From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wages.map((w) => (
                    <tr key={w.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-2.5">{w.state}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">{w.zone}</td>
                      <td className="px-4 py-2.5">{w.work_category}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(w.basic_wage)}</td>
                      <td className="px-4 py-2.5 text-right hidden sm:table-cell">{formatCurrency(w.da)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(w.total_minimum)}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell">{formatDate(w.effective_from)}</td>
                    </tr>
                  ))}
                  {wages.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No minimum wage records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Check Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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

          {complianceLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : complianceError ? (
            <div className="text-center py-8 space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">{complianceError}</p>
              <Button onClick={fetchCompliance} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />Retry
              </Button>
            </div>
          ) : compliance ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {compliance.compliant ? (
                  <>
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Compliant</Badge>
                    <span className="text-sm text-muted-foreground">
                      All {formatNumber(compliance.total_workers)} workers meet minimum wage requirements
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Violations Found</Badge>
                    <span className="text-sm text-muted-foreground">
                      {compliance.violations.length} of {formatNumber(compliance.total_workers)} workers below minimum wage
                    </span>
                  </>
                )}
              </div>

              {!compliance.compliant && compliance.violations.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-red-50 border-b">
                        <th className="text-left px-4 py-2.5 font-semibold text-red-800">Code</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-red-800">Worker</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-red-800 hidden sm:table-cell">State</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-red-800 hidden sm:table-cell">Category</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-red-800">Paid</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-red-800">Minimum</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-red-800">Shortfall</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {compliance.violations.map((v, i) => (
                        <tr key={`${v.employee_code}-${i}`} className="hover:bg-red-50/50">
                          <td className="px-4 py-2.5 font-mono text-xs">{v.employee_code}</td>
                          <td className="px-4 py-2.5 font-medium">{v.worker_name}</td>
                          <td className="px-4 py-2.5 hidden sm:table-cell">{v.state}</td>
                          <td className="px-4 py-2.5 hidden sm:table-cell">{v.category}</td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(v.daily_rate_paid)}</td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(v.minimum_daily_rate)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                            {formatCurrency(v.shortfall)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
