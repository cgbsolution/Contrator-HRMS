"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, Briefcase, CreditCard, Shield, FileText, Phone, MapPin,
  Loader2, ArrowLeft, Save, Edit, X, Power, LogOut, UserPlus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { workersApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  onboarding: "bg-blue-100 text-blue-700",
  offboarding: "bg-yellow-100 text-yellow-700",
  terminated: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-700",
};

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.id as string;

  const [worker, setWorker] = useState<Record<string, unknown> | null>(null);
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  const loadWorker = useCallback(() => {
    setLoading(true);
    Promise.all([
      workersApi.get(workerId),
      workersApi.documents(workerId).catch(() => ({ data: [] })),
    ])
      .then(([wRes, dRes]) => {
        setWorker(wRes.data);
        setDocuments(dRes.data || []);
      })
      .catch(() => {
        toast.error("Worker not found");
        router.push("/contractors");
      })
      .finally(() => setLoading(false));
  }, [workerId, router]);

  useEffect(() => { loadWorker(); }, [loadWorker]);

  function startEdit() {
    if (!worker) return;
    setEditData({
      first_name: worker.first_name,
      last_name: worker.last_name,
      mobile: worker.mobile,
      department: worker.department,
      designation: worker.designation,
      work_category: worker.work_category,
      shift: worker.shift,
      basic_wage: worker.basic_wage,
      da: worker.da,
      hra: worker.hra,
      other_allowances: worker.other_allowances,
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await workersApi.update(workerId, editData);
      toast.success("Worker updated");
      setEditing(false);
      loadWorker();
    } catch {
      toast.error("Failed to update worker");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(action: string) {
    try {
      if (action === "activate") await workersApi.activate(workerId);
      else if (action === "offboard") await workersApi.offboard(workerId);
      else if (action === "terminate") await workersApi.terminate(workerId);
      else if (action === "create-login") {
        const res = await workersApi.createLogin(workerId);
        toast.success(`Login created: ${res.data.email}`);
        return;
      }
      toast.success(`Worker ${action}d successfully`);
      loadWorker();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || `Failed to ${action}`;
      toast.error(msg);
    }
  }

  async function handleVerifyDoc(docId: string) {
    try {
      await workersApi.verifyDocument(docId);
      toast.success("Document verified");
      loadWorker();
    } catch {
      toast.error("Failed to verify document");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!worker) return null;

  const w = worker;
  const status = w.status as string;

  function Field({ label, value }: { label: string; value: unknown }) {
    return (
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{String(value || "-")}</p>
      </div>
    );
  }

  function EditField({ label, field, type = "text" }: { label: string; field: string; type?: string }) {
    return (
      <div>
        <Label className="text-xs">{label}</Label>
        <Input
          type={type}
          value={String(editData[field] || "")}
          onChange={(e) => setEditData({ ...editData, [field]: type === "number" ? Number(e.target.value) : e.target.value })}
          className="mt-1 h-9"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contractors")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{w.first_name as string} {w.last_name as string}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || ""}`}>
                {status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{w.employee_code as string} · {w.department as string} · {w.designation as string}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </>
          )}
          {status === "onboarding" && (
            <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => handleAction("activate")}>
              <Power className="h-4 w-4 mr-1" /> Activate
            </Button>
          )}
          {status === "active" && (
            <Button size="sm" variant="outline" className="text-yellow-600" onClick={() => handleAction("offboard")}>
              <LogOut className="h-4 w-4 mr-1" /> Offboard
            </Button>
          )}
          {(status === "offboarding" || status === "active") && (
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleAction("terminate")}>
              <Trash2 className="h-4 w-4 mr-1" /> Terminate
            </Button>
          )}
          {!w.user_id && (
            <Button size="sm" variant="outline" onClick={() => handleAction("create-login")}>
              <UserPlus className="h-4 w-4 mr-1" /> Create Login
            </Button>
          )}
        </div>
      </div>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditField label="First Name" field="first_name" />
              <EditField label="Last Name" field="last_name" />
              <EditField label="Mobile" field="mobile" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="First Name" value={w.first_name} />
              <Field label="Last Name" value={w.last_name} />
              <Field label="Mobile" value={w.mobile} />
              <Field label="Email" value={w.email} />
              <Field label="Date of Birth" value={w.date_of_birth} />
              <Field label="Gender" value={w.gender} />
              <Field label="Blood Group" value={w.blood_group} />
              <Field label="Marital Status" value={w.marital_status} />
            </div>
          )}
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
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditField label="Department" field="department" />
              <EditField label="Designation" field="designation" />
              <div>
                <Label className="text-xs">Work Category</Label>
                <select
                  value={String(editData.work_category || "")}
                  onChange={(e) => setEditData({ ...editData, work_category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 h-9"
                >
                  <option value="unskilled">Unskilled</option>
                  <option value="semi_skilled">Semi Skilled</option>
                  <option value="skilled">Skilled</option>
                  <option value="highly_skilled">Highly Skilled</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Shift</Label>
                <select
                  value={String(editData.shift || "")}
                  onChange={(e) => setEditData({ ...editData, shift: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 h-9"
                >
                  <option value="general">General</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Department" value={w.department} />
              <Field label="Designation" value={w.designation} />
              <Field label="Work Category" value={(w.work_category as string)?.replace("_", " ")} />
              <Field label="Shift" value={w.shift} />
              <Field label="Date of Joining" value={w.date_of_joining} />
              <Field label="Date of Leaving" value={w.date_of_leaving} />
              <Field label="Plant ID" value={w.plant_id} />
              <Field label="Agency ID" value={w.agency_id} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salary Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Salary & Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EditField label="Basic Wage" field="basic_wage" type="number" />
              <EditField label="DA" field="da" type="number" />
              <EditField label="HRA" field="hra" type="number" />
              <EditField label="Other Allowances" field="other_allowances" type="number" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Basic Wage" value={`₹${Number(w.basic_wage).toLocaleString("en-IN")}`} />
              <Field label="DA" value={`₹${Number(w.da).toLocaleString("en-IN")}`} />
              <Field label="HRA" value={`₹${Number(w.hra).toLocaleString("en-IN")}`} />
              <Field label="Other Allowances" value={`₹${Number(w.other_allowances).toLocaleString("en-IN")}`} />
              <Field label="Bank Name" value={w.bank_name} />
              <Field label="Account Number" value={w.bank_account_number} />
              <Field label="IFSC Code" value={w.ifsc_code} />
              <Field label="Bank Branch" value={w.bank_branch} />
            </div>
          )}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Aadhaar Number" value={w.aadhaar_number} />
            <Field label="PAN Number" value={w.pan_number} />
            <Field label="UAN Number" value={w.uan_number} />
            <Field label="ESI Number" value={w.esi_number} />
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id as string} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{(doc.document_type as string)?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{doc.file_name as string}</p>
                    {doc.document_number && (
                      <p className="text-xs text-muted-foreground">No: {doc.document_number as string}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.is_verified ? (
                      <Badge className="bg-green-100 text-green-700">Verified</Badge>
                    ) : (
                      <>
                        <Badge variant="secondary">Pending</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleVerifyDoc(doc.id as string)}>
                          Verify
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
