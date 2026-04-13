"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PiggyBank, Upload } from "lucide-react";
import { toast } from "sonner";
import { essApi } from "@/lib/api";
import { ESSPageSkeleton } from "@/components/ui/page-skeleton";

export default function EssInvestmentsPage() {
  const [declarations, setDeclarations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const fy = `${currentYear - 1}-${String(currentYear).slice(2)}`;

  const [form, setForm] = useState({
    financial_year: fy,
    section_80c: 0,
    section_80d: 0,
    hra_exemption: 0,
    lta: 0,
    nps_80ccd: 0,
    other_deductions: 0,
  });

  function loadData() {
    essApi.investments()
      .then((res) => setDeclarations(res.data || []))
      .catch(() => setDeclarations([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await essApi.declareInvestment(form);
      toast.success("Investment declaration submitted!");
      setShowForm(false);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to submit";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadProof(declarationId: string, section: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("section", section);
      fd.append("amount", "0");
      fd.append("description", `${section} proof`);
      try {
        await essApi.uploadProof(declarationId, fd);
        toast.success("Proof uploaded!");
        loadData();
      } catch {
        toast.error("Failed to upload proof");
      }
    };
    input.click();
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-100 text-blue-700",
    verified: "bg-green-100 text-green-700",
  };

  if (loading) return <ESSPageSkeleton />;

  const total = form.section_80c + form.section_80d + form.hra_exemption + form.lta + form.nps_80ccd + form.other_deductions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Investment Declarations</h2>
          <p className="text-muted-foreground text-sm">Declare investments for tax computation</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-500">
          <PiggyBank className="h-4 w-4 mr-1" /> New Declaration
        </Button>
      </div>

      {/* Declaration Form */}
      {showForm && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg">Investment Declaration - FY {form.financial_year}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Financial Year</Label>
                  <Select value={form.financial_year} onValueChange={(v) => setForm({ ...form, financial_year: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={`${currentYear}-${String(currentYear + 1).slice(2)}`}>{currentYear}-{String(currentYear + 1).slice(2)}</SelectItem>
                      <SelectItem value={fy}>{fy}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section 80C (PPF, ELSS, LIC, etc.)</Label>
                  <Input
                    type="number"
                    value={form.section_80c}
                    onChange={(e) => setForm({ ...form, section_80c: Number(e.target.value) })}
                    className="mt-1"
                    max={150000}
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">Max: ₹1,50,000</p>
                </div>
                <div>
                  <Label>Section 80D (Medical Insurance)</Label>
                  <Input
                    type="number"
                    value={form.section_80d}
                    onChange={(e) => setForm({ ...form, section_80d: Number(e.target.value) })}
                    className="mt-1"
                    max={75000}
                  />
                </div>
                <div>
                  <Label>HRA Exemption</Label>
                  <Input
                    type="number"
                    value={form.hra_exemption}
                    onChange={(e) => setForm({ ...form, hra_exemption: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>LTA</Label>
                  <Input
                    type="number"
                    value={form.lta}
                    onChange={(e) => setForm({ ...form, lta: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>NPS (80CCD)</Label>
                  <Input
                    type="number"
                    value={form.nps_80ccd}
                    onChange={(e) => setForm({ ...form, nps_80ccd: Number(e.target.value) })}
                    className="mt-1"
                    max={50000}
                  />
                </div>
                <div>
                  <Label>Other Deductions</Label>
                  <Input
                    type="number"
                    value={form.other_deductions}
                    onChange={(e) => setForm({ ...form, other_deductions: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-lg font-bold">Total Declared: ₹{total.toLocaleString("en-IN")}</p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-500">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Submit Declaration
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Declarations */}
      {declarations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No investment declarations found.</p>
          </CardContent>
        </Card>
      ) : (
        declarations.map((d) => (
          <Card key={d.id as string}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">FY {d.financial_year as string}</CardTitle>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status as string] || ""}`}>
                  {(d.status as string).toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  ["80C", d.section_80c],
                  ["80D", d.section_80d],
                  ["HRA", d.hra_exemption],
                  ["LTA", d.lta],
                  ["NPS", d.nps_80ccd],
                  ["Other", d.other_deductions],
                ].map(([label, val]) => (
                  <div key={label as string} className="border rounded p-2">
                    <p className="text-xs text-muted-foreground">{label as string}</p>
                    <p className="font-medium">₹{Number(val).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <p className="font-bold">Total: ₹{Number(d.total_declared).toLocaleString("en-IN")}</p>
                <div className="flex gap-2">
                  {["80C", "80D", "HRA"].map((section) => (
                    <Button
                      key={section}
                      size="sm"
                      variant="outline"
                      onClick={() => handleUploadProof(d.id as string, section)}
                    >
                      <Upload className="h-3 w-3 mr-1" /> {section}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Show uploaded proofs */}
              {(d.proofs as Record<string, unknown>[])?.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Uploaded Proofs:</p>
                  {(d.proofs as Record<string, unknown>[]).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span>{p.section as string} - {p.description as string}</span>
                      <Badge variant={p.is_verified ? "default" : "secondary"} className="text-[10px]">
                        {p.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
