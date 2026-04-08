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
import {
  Loader2, AlertTriangle, RefreshCw, Plus, Building, Users,
  Eye, Edit, Trash2, X, Copy, Power,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { agenciesApi } from "@/lib/api";
import { toast } from "sonner";

interface Agency {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  pan: string;
  gstin: string;
  license_number: string;
  license_expiry: string;
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

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // View dialog
  const [viewAgency, setViewAgency] = useState<Agency | null>(null);

  // Edit dialog
  const [editAgency, setEditAgency] = useState<Agency | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteAgency, setDeleteAgency] = useState<Agency | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function handleEditChange(field: string, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
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

  function openEdit(agency: Agency) {
    setEditForm({
      name: agency.name || "",
      contact_person: agency.contact_person || "",
      phone: agency.phone || "",
      email: agency.email || "",
      pan: agency.pan || "",
      gstin: agency.gstin || "",
      license_number: agency.license_number || "",
      pf_code: agency.pf_code || "",
      esi_code: agency.esi_code || "",
    });
    setEditAgency(agency);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editAgency) return;
    setSaving(true);
    try {
      await agenciesApi.update(editAgency.id, editForm);
      toast.success("Agency updated successfully");
      setEditAgency(null);
      fetchAgencies();
    } catch {
      toast.error("Failed to update agency");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteAgency) return;
    setDeleting(true);
    try {
      await agenciesApi.delete(deleteAgency.id);
      toast.success(`${deleteAgency.name} deleted permanently`);
      setDeleteAgency(null);
      fetchAgencies();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to delete agency";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(agency: Agency) {
    try {
      await agenciesApi.toggleActive(agency.id);
      toast.success(`${agency.name} ${agency.is_active ? "deactivated" : "activated"}`);
      fetchAgencies();
    } catch {
      toast.error("Failed to update agency status");
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    toast.success("Agency ID copied to clipboard");
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
                  <Label htmlFor="name">Agency Name <span className="text-red-500">*</span></Label>
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
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-secondary/20 transition-colors">
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
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="View Details"
                        onClick={() => setViewAgency(agency)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit"
                        onClick={() => openEdit(agency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${agency.is_active ? "text-orange-500 hover:text-orange-700 hover:bg-orange-50" : "text-green-500 hover:text-green-700 hover:bg-green-50"}`}
                        title={agency.is_active ? "Deactivate" : "Activate"}
                        onClick={() => handleToggleActive(agency)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                        onClick={() => setDeleteAgency(agency)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {agencies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
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

      {/* ── View Agency Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!viewAgency} onOpenChange={(open) => { if (!open) setViewAgency(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              {viewAgency?.name}
            </DialogTitle>
            <DialogDescription>Agency details and registration information</DialogDescription>
          </DialogHeader>
          {viewAgency && (
            <div className="space-y-4 py-2">
              {/* Agency ID with copy */}
              <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs text-muted-foreground">Agency ID (use in Excel import)</p>
                  <p className="font-mono text-xs mt-0.5">{viewAgency.id}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyId(viewAgency.id)} title="Copy ID">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{viewAgency.contact_person || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewAgency.phone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{viewAgency.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PAN</p>
                  <p className="font-mono font-medium">{viewAgency.pan || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GSTIN</p>
                  <p className="font-mono font-medium">{viewAgency.gstin || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">License Number</p>
                  <p className="font-medium">{viewAgency.license_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">License Expiry</p>
                  <p className="font-medium">{viewAgency.license_expiry || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PF Code</p>
                  <p className="font-mono font-medium">{viewAgency.pf_code || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ESI Code</p>
                  <p className="font-mono font-medium">{viewAgency.esi_code || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Workers</p>
                  <p className="font-semibold">{viewAgency.worker_count ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {viewAgency.is_active ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mt-0.5">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 mt-0.5">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAgency(null)}>Close</Button>
            <Button onClick={() => { if (viewAgency) { openEdit(viewAgency); setViewAgency(null); } }}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Agency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Agency Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!editAgency} onOpenChange={(open) => { if (!open) setEditAgency(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Agency</DialogTitle>
            <DialogDescription>Update details for {editAgency?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Agency Name <span className="text-red-500">*</span></Label>
                <Input value={editForm.name} onChange={(e) => handleEditChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={editForm.contact_person} onChange={(e) => handleEditChange("contact_person", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editForm.phone} onChange={(e) => handleEditChange("phone", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => handleEditChange("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input value={editForm.pan} onChange={(e) => handleEditChange("pan", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={editForm.gstin} onChange={(e) => handleEditChange("gstin", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>License Number</Label>
                <Input value={editForm.license_number} onChange={(e) => handleEditChange("license_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>PF Code</Label>
                <Input value={editForm.pf_code} onChange={(e) => handleEditChange("pf_code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ESI Code</Label>
                <Input value={editForm.esi_code} onChange={(e) => handleEditChange("esi_code", e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditAgency(null)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Agency Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!deleteAgency} onOpenChange={(open) => { if (!open) setDeleteAgency(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Agency
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">{deleteAgency?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {(deleteAgency?.worker_count ?? 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-800">
                  This agency has <span className="font-semibold">{deleteAgency?.worker_count}</span> active worker(s).
                  You must remove or reassign all workers before deleting this agency.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteAgency(null)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-500 gap-2">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
