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

  // Debounced search: reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, deptFilter]);

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
                  return (
                    <tr key={worker.id} className="hover:bg-secondary/30 transition-colors">
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

      {/* Terminate - Date of Leaving Dialog */}
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
    </div>
  );
}
