"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Shield, Building2, Save, Loader2, Lock, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";
import { DetailPageSkeleton } from "@/components/ui/page-skeleton";

export default function AdminProfilePage() {
  const [user, setUser] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Password change
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await authApi.me();
      setUser(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ name: name.trim(), email: email.trim() });
      toast.success("Profile updated successfully");
      // Update localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = res.data.name;
        parsed.email = res.data.email;
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      setUser(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to update";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw) {
      toast.error("Enter current password");
      return;
    }
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      toast.success("Password changed successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setShowPwSection(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to change password";
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  }

  if (loading) return <DetailPageSkeleton />;

  if (!user) return null;

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    hr_manager: "bg-purple-100 text-purple-700",
    plant_manager: "bg-blue-100 text-blue-700",
    supervisor: "bg-orange-100 text-orange-700",
    viewer: "bg-gray-100 text-gray-700",
    worker: "bg-green-100 text-green-700",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize", roleBadgeColor[user.role] || "bg-gray-100 text-gray-700")}>
                  {user.role?.replace("_", " ")}
                </span>
                {user.plant_id && (
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {user.plant_id}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" /> Edit Profile
          </CardTitle>
          <CardDescription>Update your name and email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2">
            <Shield className="h-4 w-4" />
            <span>Role: <strong className="capitalize">{user.role?.replace("_", " ")}</strong> (managed by admin)</span>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5" /> Change Password
              </CardTitle>
              <CardDescription>Update your login password</CardDescription>
            </div>
            {!showPwSection && (
              <Button variant="outline" size="sm" onClick={() => setShowPwSection(true)}>
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        {showPwSection && (
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  className="pl-9 pr-10"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    className="pr-10"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                />
                {confirmPw && newPw === confirmPw && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPwSection(false);
                  setCurrentPw("");
                  setNewPw("");
                  setConfirmPw("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={changingPw} className="gap-2">
                {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update Password
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
