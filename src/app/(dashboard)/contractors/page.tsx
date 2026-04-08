"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Search,
  Download,
  Upload,
  Eye,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Edit,
  LogOut,
  Power,
  XCircle,
  CalendarDays,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatDate, workerStatusConfig, getInitials } from "@/lib/utils";
import { workersApi } from "@/lib/api";
import type { Worker } from "@/types";
import { toast } from "sonner";

const departments = ["All", "Production", "Maintenance", "Quality", "Warehouse", "Security", "Housekeeping", "Canteen"];
const statuses = ["all", "active", "onboarding", "offboarding", "inactive", "terminated"];

export default function ContractorsPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [terminateDialog, setTerminateDialog] = useState<{ open: boolean; workerId: string; workerName: string }>({ open: false, workerId: "", workerName: "" });
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split("T")[0]);

  // Delete states
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; workerId: string; workerName: string }>({ open: false, workerId: "", workerName: "" });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Import states
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: { row: number; errors: string[] }[];
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const pageSize = 20;

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (deptFilter !== "All") params.department = deptFilter;

      const res = await workersApi.list(params);
      const data = res.data;
      setWorkers(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load workers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, deptFilter]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, deptFilter]);

  // Clear selection when page/filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, search, statusFilter, deptFilter]);

  async function handleAction(action: "activate" | "offboard" | "terminate", workerId: string, workerName: string) {
    if (action === "terminate") {
      setLeavingDate(new Date().toISOString().split("T")[0]);
      setTerminateDialog({ open: true, workerId, workerName });
      return;
    }
    setActionLoading(workerId);
    try {
      if (action === "activate") {
        await workersApi.activate(workerId);
        toast.success(`${workerName} activated successfully`);
      } else if (action === "offboard") {
        await workersApi.offboard(workerId);
        toast.success(`${workerName} offboarding initiated`);
      }
      fetchWorkers();
    } catch {
      toast.error(`Failed to ${action} ${workerName}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmTerminate() {
    const { workerId, workerName } = terminateDialog;
    setTerminateDialog({ open: false, workerId: "", workerName: "" });
    setActionLoading(workerId);
    try {
      await workersApi.terminate(workerId, leavingDate);
      toast.success(`${workerName} terminated`);
      fetchWorkers();
    } catch {
      toast.error(`Failed to terminate ${workerName}`);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Single Delete ────────────────────────────────────────────────────────
  async function confirmDelete() {
    const { workerId, workerName } = deleteDialog;
    setDeleteDialog({ open: false, workerId: "", workerName: "" });
    setDeleteLoading(true);
    try {
      await workersApi.delete(workerId);
      toast.success(`${workerName} deleted successfully`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(workerId);
        return next;
      });
      fetchWorkers();
    } catch {
      toast.error(`Failed to delete ${workerName}`);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Bulk Delete ──────────────────────────────────────────────────────────
  async function confirmBulkDelete() {
    setBulkDeleteDialog(false);
    setDeleteLoading(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        await workersApi.delete(id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} worker(s) deleted successfully`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} worker(s) failed to delete`);
    }

    setSelectedIds(new Set());
    setDeleteLoading(false);
    fetchWorkers();
  }

  // ── Selection helpers ────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === workers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(workers.map((w) => w.id)));
    }
  }

  // ── Import helpers ────────────────────────────────────────────────────────
  async function downloadTemplate() {
    try {
      const res = await workersApi.importTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "worker_import_template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch {
      toast.error("Failed to download template");
    }
  }

  function handleImportFile(file: File) {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Only .xlsx Excel files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }
    setImportFile(file);
    setImportResult(null);
  }

  async function handleImportSubmit() {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await workersApi.bulkImport(formData);
      setImportResult(res.data);
      if (res.data.success > 0) {
        toast.success(`${res.data.success} worker(s) imported successfully`);
        fetchWorkers();
      }
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} row(s) failed`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Import failed";
      toast.error(msg);
    } finally {
      setImportLoading(false);
    }
  }

  function closeImportDialog() {
    setImportDialog(false);
    setImportFile(null);
    setImportResult(null);
    setIsDragOver(false);
  }

  const allSelected = workers.length > 0 && selectedIds.size === workers.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < workers.length;
  const showFrom = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const showTo = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Users className="h-4 w-4" />
          <span>{total} workers</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setImportDialog(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/contractors/new">
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Onboard Worker
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or phone..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} worker{selectedIds.size > 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear selection
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setBulkDeleteDialog(true)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected ({selectedIds.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchWorkers} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading workers...</p>
          </CardContent>
        </Card>
      )}

      {/* Workers Table */}
      {!loading && !error && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Worker</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Designation</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Joining Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workers.map((worker) => {
                  const statusCfg = workerStatusConfig[worker.status] || { label: worker.status, color: "bg-gray-100 text-gray-600" };
                  const fullName = `${worker.first_name} ${worker.last_name}`;
                  const isActioning = actionLoading === worker.id;
                  const isSelected = selectedIds.has(worker.id);
                  return (
                    <tr
                      key={worker.id}
                      className={`hover:bg-secondary/30 transition-colors ${isSelected ? "bg-blue-50/60" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(worker.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                            {getInitials(fullName)}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{fullName}</p>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Phone className="h-3 w-3" />
                              <span>{worker.mobile}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{worker.employee_code}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm">{worker.department}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground">{worker.designation}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(worker.date_of_joining)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/contractors/${worker.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/contractors/${worker.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {worker.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                              title="Offboard"
                              disabled={isActioning}
                              onClick={() => handleAction("offboard", worker.id, fullName)}
                            >
                              {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                            </Button>
                          )}
                          {(worker.status === "onboarding" || worker.status === "offboarding" || worker.status === "inactive") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Activate"
                              disabled={isActioning}
                              onClick={() => handleAction("activate", worker.id, fullName)}
                            >
                              {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                            </Button>
                          )}
                          {worker.status !== "terminated" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Terminate"
                              disabled={isActioning}
                              onClick={() => handleAction("terminate", worker.id, fullName)}
                            >
                              {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                            disabled={isActioning || deleteLoading}
                            onClick={() => setDeleteDialog({ open: true, workerId: worker.id, workerName: fullName })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {workers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No workers found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {showFrom}–{showTo} of {total}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Terminate Dialog ──────────────────────────────────────────────── */}
      <Dialog open={terminateDialog.open} onOpenChange={(open) => setTerminateDialog({ open, workerId: open ? terminateDialog.workerId : "", workerName: open ? terminateDialog.workerName : "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-red-600" />
              Date of Leaving
            </DialogTitle>
            <DialogDescription>
              Enter the last working date for <span className="font-semibold">{terminateDialog.workerName}</span> before termination.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Date of Leaving <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={leavingDate}
              onChange={(e) => setLeavingDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialog({ open: false, workerId: "", workerName: "" })}>
              Cancel
            </Button>
            <Button onClick={confirmTerminate} disabled={!leavingDate} className="bg-red-600 hover:bg-red-500">
              <XCircle className="h-4 w-4 mr-1" />
              Confirm Terminate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Single Delete Confirmation Dialog ─────────────────────────────── */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, workerId: open ? deleteDialog.workerId : "", workerName: open ? deleteDialog.workerName : "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Worker
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">{deleteDialog.workerName}</span>? This will remove all their records including documents, attendance, and payroll data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, workerId: "", workerName: "" })}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={deleteLoading} className="bg-red-600 hover:bg-red-500">
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirmation Dialog ────────────────────────────────── */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete {selectedIds.size} Worker{selectedIds.size > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">{selectedIds.size} selected worker{selectedIds.size > 1 ? "s" : ""}</span>? This will remove all their records including documents, attendance, and payroll data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">
                  This is a bulk delete operation. All selected workers and their associated data (documents, attendance, payroll, compliance records) will be permanently removed.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBulkDelete} disabled={deleteLoading} className="bg-red-600 hover:bg-red-500">
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete {selectedIds.size} Worker{selectedIds.size > 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Workers Dialog ──────────────────────────────────────────── */}
      <Dialog open={importDialog} onOpenChange={(open) => { if (!open) closeImportDialog(); else setImportDialog(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Import Workers from Excel
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx) to bulk import workers. Use the template to ensure correct format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Download Template */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Download Template</p>
                  <p className="text-xs text-blue-600">Excel file with all columns and instructions</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-100">
                <Download className="h-3.5 w-3.5" />
                Template
              </Button>
            </div>

            {/* Drag & Drop Zone */}
            {!importResult && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleImportFile(f);
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".xlsx,.xls";
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleImportFile(f);
                  };
                  input.click();
                }}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : importFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }
                `}
              >
                {importFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-800">{importFile.name}</p>
                    <p className="text-xs text-green-600">
                      {(importFile.size / 1024).toFixed(1)} KB — Ready to import
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={(e) => { e.stopPropagation(); setImportFile(null); setImportResult(null); }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove file
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className={`h-10 w-10 mx-auto ${isDragOver ? "text-blue-500" : "text-gray-400"}`} />
                    <p className="text-sm font-medium text-gray-700">
                      {isDragOver ? "Drop your file here" : "Drag & drop Excel file here"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse — .xlsx only, max 10MB, up to 500 rows
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="space-y-3">
                {/* Success */}
                {importResult.success > 0 && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">{importResult.success}</span> worker(s) imported successfully
                    </p>
                  </div>
                )}

                {/* Errors */}
                {importResult.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                      <p className="text-sm text-red-800">
                        <span className="font-semibold">{importResult.failed}</span> row(s) failed
                      </p>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="text-xs text-red-700 bg-red-100/50 rounded px-2 py-1">
                          <span className="font-medium">Row {err.row}:</span> {err.errors.join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeImportDialog}>
              {importResult ? "Close" : "Cancel"}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImportSubmit}
                disabled={!importFile || importLoading}
                className="gap-2"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Workers
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
