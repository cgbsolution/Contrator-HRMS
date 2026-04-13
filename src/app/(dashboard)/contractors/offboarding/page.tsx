"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, AlertTriangle, RefreshCw, UserMinus, CheckCircle2, XCircle, ClipboardList, CalendarDays,
} from "lucide-react";
import { workersApi } from "@/lib/api";
import { toast } from "sonner";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface Worker {
  id: string;
  name: string;
  employee_code: string;
  department: string;
  agency_name: string;
  [key: string]: unknown;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "checked">[] = [
  { id: "exit_interview", label: "Exit Interview" },
  { id: "id_card", label: "ID Card Returned" },
  { id: "tools", label: "Tools Returned" },
  { id: "settlement", label: "Final Settlement" },
];

export default function OffboardingPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionIds, setActionIds] = useState<Set<string>>(new Set());
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [leavingDialog, setLeavingDialog] = useState<{ open: boolean; workerId: string }>({ open: false, workerId: "" });
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().split("T")[0]);

  async function fetchWorkers() {
    setLoading(true);
    setError(null);
    try {
      const res = await workersApi.list({ status: "offboarding" });
      const data = res.data?.data ?? res.data ?? [];
      setWorkers(Array.isArray(data) ? data : []);
      // Initialize checklists for each worker
      const lists: Record<string, ChecklistItem[]> = {};
      for (const w of data) {
        if (!checklists[w.id]) {
          lists[w.id] = DEFAULT_CHECKLIST.map((item) => ({ ...item, checked: false }));
        }
      }
      setChecklists((prev) => ({ ...prev, ...lists }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load offboarding workers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCheckItem(workerId: string, itemId: string) {
    setChecklists((prev) => ({
      ...prev,
      [workerId]: (prev[workerId] || []).map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }));
  }

  function handleComplete(workerId: string) {
    setLeavingDate(new Date().toISOString().split("T")[0]);
    setLeavingDialog({ open: true, workerId });
  }

  async function confirmComplete() {
    const workerId = leavingDialog.workerId;
    setLeavingDialog({ open: false, workerId: "" });
    setActionIds((prev) => new Set(prev).add(workerId));
    try {
      await workersApi.terminate(workerId, leavingDate);
      toast.success("Worker offboarding completed");
      fetchWorkers();
    } catch {
      toast.error("Failed to complete offboarding");
    } finally {
      setActionIds((prev) => {
        const next = new Set(prev);
        next.delete(workerId);
        return next;
      });
    }
  }

  async function handleCancel(workerId: string) {
    setActionIds((prev) => new Set(prev).add(workerId));
    try {
      await workersApi.activate(workerId);
      toast.success("Offboarding cancelled, worker reactivated");
      fetchWorkers();
    } catch {
      toast.error("Failed to cancel offboarding");
    } finally {
      setActionIds((prev) => {
        const next = new Set(prev);
        next.delete(workerId);
        return next;
      });
    }
  }

  if (loading) return <CardGridSkeleton />;

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
            <Button onClick={fetchWorkers} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <UserMinus className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
          <h3 className="font-semibold text-lg">No workers in offboarding</h3>
          <p className="text-sm text-muted-foreground">All clear - no pending exit processes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-orange-100">
          <UserMinus className="h-5 w-5 text-orange-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Offboarding</h2>
          <p className="text-sm text-muted-foreground">{workers.length} workers in exit process</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => {
          const workerChecklist = checklists[worker.id] || DEFAULT_CHECKLIST.map((item) => ({ ...item, checked: false }));
          const isActioning = actionIds.has(worker.id);

          return (
            <Card key={worker.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{worker.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">{worker.employee_code}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Offboarding</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{worker.department || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Agency</p>
                    <p className="font-medium">{worker.agency_name || "-"}</p>
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Exit Checklist</p>
                  </div>
                  <div className="space-y-1.5">
                    {workerChecklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/20 rounded px-2 py-1"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleCheckItem(worker.id, item.id)}
                        />
                        <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                          {item.label}
                        </span>
                        {item.checked && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 ml-auto" />}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    className="flex-1 gap-1 h-8 text-xs"
                    onClick={() => handleComplete(worker.id)}
                    disabled={isActioning}
                  >
                    {isActioning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Complete Offboarding
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 h-8 text-xs"
                    onClick={() => handleCancel(worker.id)}
                    disabled={isActioning}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Date of Leaving Dialog */}
      <Dialog open={leavingDialog.open} onOpenChange={(open) => setLeavingDialog({ open, workerId: open ? leavingDialog.workerId : "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-600" />
              Date of Leaving
            </DialogTitle>
            <DialogDescription>
              Enter the worker&apos;s last working date to complete offboarding.
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
            <Button variant="outline" onClick={() => setLeavingDialog({ open: false, workerId: "" })}>
              Cancel
            </Button>
            <Button onClick={confirmComplete} disabled={!leavingDate} className="bg-orange-600 hover:bg-orange-500">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirm & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
