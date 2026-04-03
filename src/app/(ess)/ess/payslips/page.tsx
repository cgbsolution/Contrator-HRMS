"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Eye, Receipt } from "lucide-react";
import { essApi } from "@/lib/api";

export default function EssPayslipsPage() {
  const [payslips, setPayslips] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    essApi.payslips()
      .then((res) => setPayslips(res.data || []))
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(id: string, month: number, year: number) {
    setDownloading(id);
    try {
      const res = await essApi.downloadPayslip(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip_${month}_${year}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setDownloading(null);
    }
  }

  const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Payslips</h2>
        <p className="text-muted-foreground text-sm">View and download your salary slips</p>
      </div>

      {payslips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No payslips available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payslips.map((p) => (
            <Card key={p.id as string} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{months[p.month as number]} {p.year as number}</p>
                    <p className="text-xs text-muted-foreground">{p.paid_days as number} days paid</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Gross</p>
                      <p className="text-sm">₹{Number(p.gross_salary).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Deductions</p>
                      <p className="text-sm text-red-600">₹{Number(p.total_deductions).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Net Pay</p>
                      <p className="text-lg font-bold text-green-600">₹{Number(p.net_salary).toLocaleString("en-IN")}</p>
                    </div>
                    <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                      {(p.status as string).toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewing(p)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(p.id as string, p.month as number, p.year as number)}
                      disabled={downloading === p.id}
                    >
                      {downloading === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Detail Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>
                Payslip - {months[viewing.month as number]} {viewing.year as number}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-2">
                  <p className="text-muted-foreground text-xs">Days Paid</p>
                  <p className="font-semibold">{viewing.paid_days as number}</p>
                </div>
                <div className="border rounded p-2">
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="font-semibold capitalize">{viewing.status as string}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2 text-green-700">Earnings</p>
                <div className="space-y-1 text-sm">
                  {[
                    ["Gross Salary", viewing.gross_salary],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between">
                      <span>{label as string}</span>
                      <span className="font-medium">₹{Number(val).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2 text-red-700">Deductions</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Deductions</span>
                    <span className="text-red-600">₹{Number(viewing.total_deductions).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Salary</span>
                  <span className="text-green-600">₹{Number(viewing.net_salary).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Button className="w-full" onClick={() => setViewing(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
