"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { essApi } from "@/lib/api";

export default function EssLeavesPage() {
  const [leaveTypes, setLeaveTypes] = useState<Record<string, unknown>[]>([]);
  const [balances, setBalances] = useState<Record<string, unknown>[]>([]);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  function loadData() {
    Promise.all([
      essApi.leaveTypes().catch(() => ({ data: [] })),
      essApi.leaveBalance().catch(() => ({ data: [] })),
      essApi.myLeaves().catch(() => ({ data: [] })),
    ]).then(([typesRes, balRes, appRes]) => {
      setLeaveTypes(typesRes.data || []);
      setBalances(balRes.data || []);
      setApplications(appRes.data || []);
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, []);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveTypeId || !fromDate || !toDate) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await essApi.applyLeave({
        leave_type_id: leaveTypeId,
        from_date: fromDate,
        to_date: toDate,
        reason,
      });
      toast.success("Leave application submitted!");
      setShowForm(false);
      setLeaveTypeId("");
      setFromDate("");
      setToDate("");
      setReason("");
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to apply leave";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    try {
      await essApi.cancelLeave(id);
      toast.success("Leave cancelled");
      loadData();
    } catch {
      toast.error("Failed to cancel leave");
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const days = fromDate && toDate
    ? Math.max(0, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Leave Management</h2>
          <p className="text-muted-foreground text-sm">Apply for leave and track your applications</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-500">
          <Plus className="h-4 w-4 mr-1" /> Apply Leave
        </Button>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {balances.map((b, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-sm font-medium">{b.leave_type as string}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{String(b.remaining)}</p>
              <p className="text-xs text-muted-foreground">of {String(b.total)} remaining</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full"
                  style={{ width: `${Number(b.total) > 0 ? (Number(b.remaining) / Number(b.total)) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Apply Leave Form */}
      {showForm && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Apply for Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApply} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Leave Type *</Label>
                  <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((lt) => (
                        <SelectItem key={lt.id as string} value={lt.id as string}>
                          {lt.name as string} ({lt.code as string})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  {days > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 mb-2">{days} day(s)</Badge>
                  )}
                </div>

                <div>
                  <Label>From Date *</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>To Date *</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  placeholder="Enter reason for leave..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-500">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Submit Application
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Applications History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Leave Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No leave applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id as string} className="border rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{app.leave_type as string}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status as string] || ""}`}>
                          {(app.status as string).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(app.from_date as string).toLocaleDateString("en-IN")} - {new Date(app.to_date as string).toLocaleDateString("en-IN")} ({app.days as number} days)
                      </p>
                      {app.reason ? <p className="text-xs text-muted-foreground mt-0.5">{String(app.reason)}</p> : null}
                      {app.reviewer_remarks ? (
                        <p className="text-xs text-red-600 mt-0.5">Remarks: {String(app.reviewer_remarks)}</p>
                      ) : null}
                    </div>
                    {app.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handleCancel(app.id as string)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
