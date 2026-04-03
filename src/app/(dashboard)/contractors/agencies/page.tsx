"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, RefreshCw, Plus, Building, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { agenciesApi } from "@/lib/api";
import { toast } from "sonner";

interface Agency {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  pan: string;
  gstin: string;
  license_number: string;
  pf_code: string;
  esi_code: string;
  is_active: boolean;
  worker_count: number;
}

const EMPTY_FORM = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  pan: "",
  gstin: "",
  license_number: "",
  pf_code: "",
  esi_code: "",
};

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  async function fetchAgencies() {
    setLoading(true);
    setError(null);
    try {
      const res = await agenciesApi.list();
      const data = res.data;
      if (data?.data) {
        setAgencies(data.data);
        setTotal(data.total ?? data.data.length);
      } else if (Array.isArray(data)) {
        setAgencies(data);
        setTotal(data.length);
      } else {
        setAgencies([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load agencies";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgencies();
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await agenciesApi.create(form);
      toast.success("Agency created successfully");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchAgencies();
    } catch {
      toast.error("Failed to create agency");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Loading agencies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load agencies</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchAgencies} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-100">
            <Building className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Contractor Agencies</h2>
            <p className="text-sm text-muted-foreground">{total} agencies</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />Add Agency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Agency</DialogTitle>
              <DialogDescription>Register a new contractor agency</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Agency Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input id="contact_person" value={form.contact_person} onChange={(e) => handleChange("contact_person", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input id="pan" value={form.pan} onChange={(e) => handleChange("pan", e.target.value)} placeholder="AAAAA0000A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" value={form.gstin} onChange={(e) => handleChange("gstin", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input id="license_number" value={form.license_number} onChange={(e) => handleChange("license_number", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf_code">PF Code</Label>
                  <Input id="pf_code" value={form.pf_code} onChange={(e) => handleChange("pf_code", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="esi_code">ESI Code</Label>
                  <Input id="esi_code" value={form.esi_code} onChange={(e) => handleChange("esi_code", e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Agency
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agencies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">PAN</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Workers</th>
                <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{agency.name}</p>
                    <p className="text-xs text-muted-foreground md:hidden">{agency.contact_person}</p>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">{agency.contact_person || "-"}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">{agency.phone || "-"}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell font-mono text-xs">{agency.pan || "-"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold">{formatNumber(agency.worker_count ?? 0)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {agency.is_active ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Inactive</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {agencies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Building className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="font-medium text-muted-foreground">No agencies found</p>
                    <p className="text-sm text-muted-foreground">Add your first contractor agency above</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
