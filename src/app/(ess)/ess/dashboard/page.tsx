"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, IndianRupee, ClipboardList, Clock, Loader2 } from "lucide-react";
import { essApi } from "@/lib/api";

export default function EssDashboard() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [payslips, setPayslips] = useState<Record<string, unknown>[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, unknown>[]>([]);
  const [attendance, setAttendance] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    Promise.all([
      essApi.profile().catch(() => null),
      essApi.payslips().catch(() => ({ data: [] })),
      essApi.leaveBalance().catch(() => ({ data: [] })),
      essApi.attendance(month, year).catch(() => ({ data: null })),
    ]).then(([profileRes, payslipsRes, balanceRes, attRes]) => {
      if (profileRes) setProfile(profileRes.data);
      setPayslips(payslipsRes?.data || []);
      setLeaveBalances(balanceRes?.data || []);
      if (attRes?.data) setAttendance(attRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const latestPayslip = payslips[0] as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">
          Welcome, {(profile?.first_name as string) || "Employee"}!
        </h2>
        <p className="text-muted-foreground text-sm">
          {profile?.employee_code as string} · {profile?.department as string} · {profile?.designation as string}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(attendance?.present_days as number) ?? 0}</p>
                <p className="text-xs text-muted-foreground">Present This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(attendance?.absent_days as number) ?? 0}</p>
                <p className="text-xs text-muted-foreground">Absent This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {latestPayslip ? `₹${Number(latestPayslip.net_salary).toLocaleString("en-IN")}` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Last Net Salary</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {leaveBalances.reduce((sum, b) => sum + Number(b.remaining || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Leave Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave balances found for this year.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {leaveBalances.map((b, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <p className="text-sm font-medium">{b.leave_type as string}</p>
                  <p className="text-xs text-muted-foreground">{b.code as string}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">{String(b.remaining)}</span>
                    <span className="text-xs text-muted-foreground">/ {String(b.total)}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{ width: `${Number(b.total) > 0 ? (Number(b.remaining) / Number(b.total)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payslips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payslips found.</p>
          ) : (
            <div className="space-y-2">
              {payslips.slice(0, 5).map((p, i) => {
                const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return (
                  <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">{months[p.month as number]} {p.year as number}</p>
                      <p className="text-xs text-muted-foreground">{p.paid_days as number} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{Number(p.net_salary).toLocaleString("en-IN")}</p>
                      <Badge variant={p.status === "paid" ? "default" : "secondary"} className="text-[10px]">
                        {(p.status as string).toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
