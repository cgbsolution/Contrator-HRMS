"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Briefcase, CreditCard, FileText, Shield } from "lucide-react";
import { essApi } from "@/lib/api";

export default function EssProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    essApi.profile()
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

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
    </div>
  );
}
