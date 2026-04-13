"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Play,
  Download,
  CheckCircle2,
  Clock,
  IndianRupee,
  Users,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  Plus,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { payrollApi, reportsApi } from "@/lib/api";
import { toast } from "sonner";
import { StatsPageSkeleton } from "@/components/ui/page-skeleton";

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
  // Attendance
  total_days_in_month: number;
  weekly_offs: number;
  holidays: number;
  working_days: number;
  present_days: number;
  paid_leave_days: number;
  paid_days: number;
  absent_days: number;
  overtime_hours: number;
  // Earnings
  monthly_ctc: number;
  basic: number;
  da: number;
  hra: number;
  bonus: number;
  per_day_salary: number;
  loss_of_pay: number;
  overtime_amount: number;
  gross_salary: number;
  // Deductions
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  pt_amount: number;
  total_deductions: number;
  net_salary: number;
  status: string;
}

interface SalaryStructure {
  id: string;
  name: string;
  work_category: string;
  basic_percentage: number;
  da_percentage: number;
  hra_percentage: number;
  conveyance_allowance: number;
  special_allowance: number;
  medical_allowance: number;
}

interface PayrollSummary {
  total_workers: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  processed: "default",
  paid: "default",
  draft: "secondary",
};

const statusBadgeClass: Record<string, string> = {
  processed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-600",
};

export default function PayrollPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [plantId] = useState("plant_001");
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState("");

  // Data states
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isLoadingStructures, setIsLoadingStructures] = useState(true);

  // Add structure dialog
  const [showAddStructure, setShowAddStructure] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [structureForm, setStructureForm] = useState({
    name: "",
    work_category: "unskilled",
    basic_percentage: 60,
    da_percentage: 20,
    hra_percentage: 10,
    conveyance_allowance: 0,
    special_allowance: 0,
    medical_allowance: 0,
  });

  const loadSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const res = await reportsApi.payroll({
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load payroll summary:", err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const res = await payrollApi.list({
        month: Number(selectedMonth),
        year: Number(selectedYear),
      });
      setRecords(res.data?.records ?? res.data ?? []);
    } catch (err) {
      console.error("Failed to load payroll records:", err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadStructures = useCallback(async () => {
    setIsLoadingStructures(true);
    try {
      const res = await payrollApi.salaryStructures();
      setStructures(res.data?.structures ?? res.data ?? []);
    } catch (err) {
      console.error("Failed to load salary structures:", err);
    } finally {
      setIsLoadingStructures(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    loadRecords();
  }, [loadSummary, loadRecords]);

  useEffect(() => {
    loadStructures();
  }, [loadStructures]);

  const filtered = records.filter(
    (r) =>
      !search ||
      r.worker_name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase())
  );

  async function handleProcessPayroll() {
    setIsProcessing(true);
    try {
      await payrollApi.process(
        Number(selectedMonth),
        Number(selectedYear),
        plantId
      );
      toast.success(
        `Payroll processed for ${MONTHS[Number(selectedMonth) - 1]} ${selectedYear}`
      );
      loadSummary();
      loadRecords();
    } catch (err) {
      console.error("Failed to process payroll:", err);
      toast.error("Failed to process payroll. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDownloadPayslip(id: string, name: string) {
    try {
      const res = await payrollApi.payslip(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download payslip:", err);
      toast.error("Failed to download payslip.");
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await payrollApi.updatePayment(id, {
        status: "paid",
        payment_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Marked as paid.");
      loadRecords();
    } catch (err) {
      console.error("Failed to update payment:", err);
      toast.error("Failed to mark as paid.");
    }
  }

  async function handleAddStructure() {
    setIsSaving(true);
    try {
      await payrollApi.createSalaryStructure(structureForm);
      toast.success(`Structure "${structureForm.name}" created.`);
      setShowAddStructure(false);
      setStructureForm({
        name: "",
        work_category: "unskilled",
        basic_percentage: 60,
        da_percentage: 20,
        hra_percentage: 10,
        conveyance_allowance: 0,
        special_allowance: 0,
        medical_allowance: 0,
      });
      loadStructures();
    } catch (err) {
      console.error("Failed to create structure:", err);
      toast.error("Failed to create salary structure.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Month/Year selector & actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
          <Select value={selectedYear} onValueChange={setSelectedYear}>
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
          size="sm"
          className="gap-2 bg-green-600 hover:bg-green-500"
          onClick={handleProcessPayroll}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Clock className="h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Run Payroll
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="structures">Structures</TabsTrigger>
        </TabsList>

        {/* ── Summary Tab ── */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          {isLoadingSummary ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Total Workers</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatNumber(summary.total_workers)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">Gross Payroll</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(summary.total_gross)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Before deductions
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Total Deductions
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(summary.total_deductions)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PF + ESI + PT + others
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-5">
                    <p className="text-sm text-blue-700 font-medium">
                      Net Payable
                    </p>
                    <p className="text-2xl font-bold mt-1 text-blue-900">
                      {formatCurrency(summary.total_net)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      For disbursement
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">
                  No payroll data available
                </p>
                <p className="text-sm text-amber-700">
                  Run payroll to generate summary for{" "}
                  {MONTHS[Number(selectedMonth) - 1]} {selectedYear}.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Records Tab ── */}
        <TabsContent value="records" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search worker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoadingRecords ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b">
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">
                        Worker
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                        CTC
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                        Work / Present / Absent
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">
                        LOP
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                        Gross
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">
                        Deductions
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">
                        Net Payout
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((rec) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-sm">{rec.worker_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rec.employee_code} · {rec.department}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right hidden sm:table-cell text-sm">
                          {formatCurrency(rec.monthly_ctc || 0)}
                        </td>
                        <td className="px-3 py-2.5 text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1.5 text-xs">
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium" title="Working days">
                              {rec.working_days || rec.paid_days || 0}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium" title="Present days">
                              {rec.present_days || rec.paid_days || 0}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className={`px-1.5 py-0.5 rounded font-medium ${(rec.absent_days || 0) > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-500"}`} title="Absent days">
                              {rec.absent_days || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right hidden lg:table-cell">
                          {(rec.loss_of_pay || 0) > 0 ? (
                            <span className="text-red-600 text-xs font-medium">-{formatCurrency(rec.loss_of_pay)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right hidden md:table-cell text-sm">
                          {formatCurrency(rec.gross_salary)}
                        </td>
                        <td className="px-3 py-2.5 text-right hidden lg:table-cell text-red-600 text-sm">
                          {formatCurrency(rec.total_deductions)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-green-700">
                          {formatCurrency(rec.net_salary)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              statusBadgeClass[rec.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                handleDownloadPayslip(rec.id, rec.worker_name)
                              }
                              title="Download Payslip"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            {rec.status === "processed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-green-700"
                                onClick={() => handleMarkPaid(rec.id)}
                                title="Mark as Paid"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No payroll records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── Structures Tab ── */}
        <TabsContent value="structures" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {structures.length} salary structure
              {structures.length !== 1 ? "s" : ""} configured
            </p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setShowAddStructure(true)}
            >
              <Plus className="h-4 w-4" />
              Add Structure
            </Button>
          </div>

          {isLoadingStructures ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : structures.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No salary structures configured yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {structures.map((ss) => (
                <Card
                  key={ss.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {ss.name}
                      </CardTitle>
                      <Badge variant="secondary" className="capitalize">
                        {(ss.work_category || "").replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { label: "Basic", value: `${ss.basic_percentage}%` },
                        { label: "DA", value: `${ss.da_percentage}%` },
                        { label: "HRA", value: `${ss.hra_percentage}%` },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-secondary rounded-md p-2 text-center"
                        >
                          <p className="font-semibold">{item.value}</p>
                          <p className="text-muted-foreground">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    {(ss.conveyance_allowance > 0 ||
                      ss.special_allowance > 0 ||
                      ss.medical_allowance > 0) && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {ss.conveyance_allowance > 0 && (
                          <span>Conv: {formatCurrency(ss.conveyance_allowance)}</span>
                        )}
                        {ss.special_allowance > 0 && (
                          <span>Special: {formatCurrency(ss.special_allowance)}</span>
                        )}
                        {ss.medical_allowance > 0 && (
                          <span>Medical: {formatCurrency(ss.medical_allowance)}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Structure Dialog ── */}
      <Dialog open={showAddStructure} onOpenChange={setShowAddStructure}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Salary Structure</DialogTitle>
            <DialogDescription>
              Define a new salary structure with component percentages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Structure Name</Label>
              <Input
                className="mt-1"
                value={structureForm.name}
                onChange={(e) =>
                  setStructureForm({ ...structureForm, name: e.target.value })
                }
                placeholder="e.g. Skilled Worker"
              />
            </div>
            <div>
              <Label>Work Category</Label>
              <Select
                value={structureForm.work_category}
                onValueChange={(v) =>
                  setStructureForm({ ...structureForm, work_category: v })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "unskilled",
                    "semi_skilled",
                    "skilled",
                    "highly_skilled",
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Basic %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={structureForm.basic_percentage}
                  onChange={(e) =>
                    setStructureForm({
                      ...structureForm,
                      basic_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>DA %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={structureForm.da_percentage}
                  onChange={(e) =>
                    setStructureForm({
                      ...structureForm,
                      da_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>HRA %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={structureForm.hra_percentage}
                  onChange={(e) =>
                    setStructureForm({
                      ...structureForm,
                      hra_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Conveyance</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={structureForm.conveyance_allowance}
                  onChange={(e) =>
                    setStructureForm({
                      ...structureForm,
                      conveyance_allowance: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Special</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={structureForm.special_allowance}
                  onChange={(e) =>
                    setStructureForm({
                      ...structureForm,
                      special_allowance: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Medical</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={structureForm.medical_allowance}
                  onChange={(e) =>
                    setStructureForm({
                      ...structureForm,
                      medical_allowance: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddStructure(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStructure}
              disabled={isSaving || !structureForm.name}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
