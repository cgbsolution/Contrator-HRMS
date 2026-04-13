"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, RefreshCw, UserPlus, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "plant_manager", label: "Plant Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "viewer", label: "Viewer" },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plant_id: string | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "viewer",
  plant_id: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.listUsers();
      setUsers(res.data?.data ?? res.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };
      if (form.plant_id) payload.plant_id = form.plant_id;
      await authApi.createUser(payload);
      toast.success("User created successfully");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchUsers();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(user: User) {
    setTogglingId(user.id);
    try {
      await authApi.updateUser(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? "User deactivated" : "User activated");
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) return <TablePageSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load users</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchUsers} variant="outline" className="gap-2">
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
            <Users className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Users & Roles</h2>
            <p className="text-sm text-muted-foreground">{users.length} users</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with role assignment</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plant_id">Plant ID (optional)</Label>
                <Input id="plant_id" value={form.plant_id} onChange={(e) => handleChange("plant_id", e.target.value)} placeholder="Leave empty for all plants" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Role</th>
                <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Active</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="capitalize text-xs">
                      {user.role.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {user.is_active ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleToggleActive(user)}
                      disabled={togglingId === user.id}
                    >
                      {togglingId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : user.is_active ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No users found. Add your first user above.
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
