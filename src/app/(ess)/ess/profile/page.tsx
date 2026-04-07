"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, User, Briefcase, CreditCard, FileText, Shield, Lock, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import { essApi, authApi } from "@/lib/api";
import { toast } from "sonner";

export default function EssProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    essApi.profile()
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePassword() {
    if (!currentPw) { toast.error("Enter current password"); return; }
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    setChangingPw(true);
    try {
      await authApi.changePassword(currentPw, newPw);
      toast.success("Password changed successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setShowPwSection(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to change password";
      toast.error(msg);
    } finally { setChangingPw(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Profile not found. Contact your HR manager.</p>
        </CardContent>
      </Card>
    );
  }

  const docs = (profile.documents as Record<string, unknown>[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground text-sm">Your personal and employment details</p>
      </div>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              ["Full Name", `${profile.first_name} ${profile.last_name}`],
              ["Employee Code", profile.employee_code],
              ["Father's Name", profile.father_name],
              ["Date of Birth", profile.date_of_birth],
              ["Gender", profile.gender],
              ["Mobile", profile.mobile],
              ["Email", profile.email],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-muted-foreground">{label as string}</p>
                <p className="font-medium capitalize">{(val as string) || "-"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" /> Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              ["Department", profile.department],
              ["Designation", profile.designation],
              ["Date of Joining", profile.date_of_joining],
              ["Plant ID", profile.plant_id],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-muted-foreground">{label as string}</p>
                <p className="font-medium">{(val as string) || "-"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statutory IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" /> Statutory Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ["UAN Number", profile.uan_number],
              ["ESI Number", profile.esi_number],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-muted-foreground">{label as string}</p>
                <p className="font-medium font-mono">{(val as string) || "-"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              ["Bank Name", profile.bank_name],
              ["Account Number", profile.bank_account_number],
              ["IFSC Code", profile.ifsc_code],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-muted-foreground">{label as string}</p>
                <p className="font-medium font-mono">{(val as string) || "-"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((d, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{(d.document_type as string).replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{d.file_name as string}</p>
                  </div>
                  <Badge variant={d.is_verified ? "default" : "secondary"}>
                    {d.is_verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
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
              <Button variant="outline" onClick={() => { setShowPwSection(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}>
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
