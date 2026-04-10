"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2, Plus, Loader2, RefreshCw, AlertTriangle, Eye, Edit, Trash2,
  Power, Users, Mail, Phone, Copy, KeyRound, Search, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { tenantsApi } from "@/lib/api";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  notes: string;
  is_active: boolean;
  worker_count: number;
  user_count: number;
  agency_count: number;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  domain: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  notes: "",
  admin_name: "",
  admin_email: "",
  admin_password: "",
};

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<{ name: string; admin_email: string; admin_password: string; email_sent: boolean } | null>(null);

  // View / Edit / Delete dialogs
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset password
  const [resetTenant, setResetTenant] = useState<Tenant | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ admin_email: string; new_password: string; email_sent: boolean } | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page_size: 100 };
      if (search) params.search = search;
      const res = await tenantsApi.list(params);
      setTenants(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tenants";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.admin_name || !form.admin_email) {
      toast.error("Please fill all required fields");
      return;
    }
    setCreating(true);
    try {
      const res = await tenantsApi.create(form);
      setCreatedTenant({
        name: res.data.name,
        admin_email: res.data.admin_email,
        admin_password: res.data.admin_password,
        email_sent: res.data.email_sent,
      });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      fetchTenants();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to create tenant";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(tenant: Tenant) {
    try {
      await tenantsApi.toggleActive(tenant.id);
      toast.success(`${tenant.name} ${tenant.is_active ? "deactivated" : "activated"}`);
      fetchTenants();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    if (!deleteTenant) return;
    setDeleting(true);
    try {
      await tenantsApi.delete(deleteTenant.id);
      toast.success(`${deleteTenant.name} deleted`);
      setDeleteTenant(null);
      fetchTenants();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to delete";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetPassword() {
    if (!resetTenant) return;
    setResetting(true);
    try {
      const res = await tenantsApi.resetAdminPassword(resetTenant.id);
      setResetResult({
        admin_email: res.data.admin_email,
        new_password: res.data.new_password,
        email_sent: res.data.email_sent,
      });
      setResetTenant(null);
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setResetting(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
            <Building2 className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Tenants</h2>
            <p className="text-sm text-muted-foreground">{total} organization{total !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500">
          <Plus className="h-4 w-4" />
          New Tenant
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, domain, or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error / Loading */}
      {error && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchTenants} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading tenants...</p>
          </CardContent>
        </Card>
      )}

      {/* Tenants Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className={`overflow-hidden transition-all hover:shadow-md ${!tenant.is_active ? "opacity-60" : ""}`}>
              <div className={`h-1 ${tenant.is_active ? "bg-gradient-to-r from-purple-500 to-blue-500" : "bg-gray-300"}`} />
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{tenant.slug}</p>
                    </div>
                  </div>
                  {tenant.is_active ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Inactive</Badge>
                  )}
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs">
                  {tenant.contact_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{tenant.contact_email}</span>
                    </div>
                  )}
                  {tenant.contact_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{tenant.contact_phone}</span>
                    </div>
                  )}
                  {tenant.domain && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{tenant.domain}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold">{tenant.worker_count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Workers</p>
                  </div>
                  <div className="text-center border-x">
                    <p className="text-lg font-bold">{tenant.user_count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{tenant.agency_count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Agencies</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2 border-t">
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => setViewTenant(tenant)}>
                    <Eye className="h-3.5 w-3.5" />View
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => setResetTenant(tenant)}>
                    <KeyRound className="h-3.5 w-3.5" />Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${tenant.is_active ? "text-orange-500 hover:text-orange-700 hover:bg-orange-50" : "text-green-500 hover:text-green-700 hover:bg-green-50"}`}
                    title={tenant.is_active ? "Deactivate" : "Activate"}
                    onClick={() => handleToggleActive(tenant)}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Delete"
                    onClick={() => setDeleteTenant(tenant)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {tenants.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No tenants found</p>
              <p className="text-xs mt-1">Click &quot;New Tenant&quot; to create your first organization</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create Tenant Dialog ─────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Create New Tenant
            </DialogTitle>
            <DialogDescription>
              Set up a new organization with its own admin account and isolated data.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Org details */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Organization</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Organization Name <span className="text-red-500">*</span></Label>
                  <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Artbox Solutions Pvt Ltd" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Domain</Label>
                  <Input value={form.domain} onChange={(e) => handleChange("domain", e.target.value)} placeholder="artboxsolutions.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input value={form.contact_phone} onChange={(e) => handleChange("contact_phone", e.target.value)} placeholder="9876543210" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Admin user */}
            <div className="space-y-3 pt-3 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tenant Admin</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Admin Name <span className="text-red-500">*</span></Label>
                  <Input value={form.admin_name} onChange={(e) => handleChange("admin_name", e.target.value)} placeholder="John Doe" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Admin Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={form.admin_email} onChange={(e) => handleChange("admin_email", e.target.value)} placeholder="info@artboxsolutions.com" required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Initial Password (leave blank to auto-generate)</Label>
                  <Input value={form.admin_password} onChange={(e) => handleChange("admin_password", e.target.value)} placeholder="Auto-generated" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800">
                  Login credentials will be emailed to the admin automatically. They can change the password after first login.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="gap-2 bg-purple-600 hover:bg-purple-500">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Created Tenant Success Dialog ──────────────────────────────── */}
      <Dialog open={!!createdTenant} onOpenChange={(open) => { if (!open) setCreatedTenant(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Tenant Created Successfully
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{createdTenant?.name}</span> is now active. Share these credentials with the admin (they have also been emailed).
            </DialogDescription>
          </DialogHeader>
          {createdTenant && (
            <div className="space-y-3">
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm">{createdTenant.admin_email}</p>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(createdTenant.admin_email, "Email")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground">Temporary Password</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-semibold text-purple-700">{createdTenant.admin_password}</p>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(createdTenant.admin_password, "Password")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              {createdTenant.email_sent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-800">Welcome email sent to admin</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs text-amber-800">Email not sent. Please share credentials manually.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedTenant(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Tenant Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!viewTenant} onOpenChange={(open) => { if (!open) setViewTenant(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              {viewTenant?.name}
            </DialogTitle>
            <DialogDescription>Tenant details and statistics</DialogDescription>
          </DialogHeader>
          {viewTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <Users className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-purple-800">{viewTenant.worker_count}</p>
                  <p className="text-[10px] text-purple-600 uppercase">Workers</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <ShieldCheck className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-blue-800">{viewTenant.user_count}</p>
                  <p className="text-[10px] text-blue-600 uppercase">Users</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Building2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-800">{viewTenant.agency_count}</p>
                  <p className="text-[10px] text-green-600 uppercase">Agencies</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Slug</p>
                  <p className="font-mono">{viewTenant.slug}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Domain</p>
                  <p className="font-medium">{viewTenant.domain || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {viewTenant.is_active ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Email</p>
                  <p className="font-medium">{viewTenant.contact_email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Phone</p>
                  <p className="font-medium">{viewTenant.contact_phone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{viewTenant.address || "-"}</p>
                </div>
                {viewTenant.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{viewTenant.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTenant(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ──────────────────────────────────────── */}
      <Dialog open={!!resetTenant} onOpenChange={(open) => { if (!open) setResetTenant(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <KeyRound className="h-5 w-5" />
              Reset Admin Password
            </DialogTitle>
            <DialogDescription>
              Generate a new password for <span className="font-semibold text-foreground">{resetTenant?.name}</span>&apos;s admin? They will receive the new credentials by email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTenant(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={resetting} className="bg-amber-600 hover:bg-amber-500 gap-2">
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset & Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Result Dialog ──────────────────────────────── */}
      <Dialog open={!!resetResult} onOpenChange={(open) => { if (!open) setResetResult(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Password Reset
            </DialogTitle>
          </DialogHeader>
          {resetResult && (
            <div className="space-y-3">
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{resetResult.admin_email}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground">New Password</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-semibold text-amber-700">{resetResult.new_password}</p>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(resetResult.new_password, "Password")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              {resetResult.email_sent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-800">Email sent to admin with new credentials</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Tenant Dialog ────────────────────────────────────────── */}
      <Dialog open={!!deleteTenant} onOpenChange={(open) => { if (!open) setDeleteTenant(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Tenant
            </DialogTitle>
            <DialogDescription>
              Permanently delete <span className="font-semibold text-foreground">{deleteTenant?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {(deleteTenant?.worker_count ?? 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-xs text-red-800">
                  This tenant has <span className="font-semibold">{deleteTenant?.worker_count}</span> worker(s).
                  You must delete all workers first before deleting the tenant.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTenant(null)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting || (deleteTenant?.worker_count ?? 0) > 0} className="bg-red-600 hover:bg-red-500 gap-2">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
