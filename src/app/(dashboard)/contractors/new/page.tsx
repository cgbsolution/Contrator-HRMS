"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  CreditCard,
  Briefcase,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Upload,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { workersApi, agenciesApi } from "@/lib/api";

// ─── Steps ───────────────────────────────────────────────────────────────────
const steps = [
  { id: 1, title: "Personal Details", description: "Basic info & contact", icon: User },
  { id: 2, title: "Employment", description: "Job & agency details", icon: Briefcase },
  { id: 3, title: "Address", description: "Residential information", icon: MapPin },
  { id: 4, title: "Statutory IDs", description: "Aadhaar, PAN, UAN, ESI", icon: CreditCard },
  { id: 5, title: "Documents", description: "Upload KYC documents", icon: FileText },
];

interface Agency {
  id: string;
  name: string;
}

interface DocUpload {
  key: string;
  label: string;
  required: boolean;
  file: File | null;
}

const departments = ["Production", "Maintenance", "Quality", "Warehouse", "Security", "Housekeeping", "Canteen"];
const designations = ["Machine Operator", "Fitter", "Welder", "Helper", "QC Inspector", "Security Guard", "Driver", "Electrician", "Plumber", "Housekeeping Staff"];
const workCategories = ["Unskilled", "Semi-Skilled", "Skilled", "Highly Skilled"];
const shifts = [
  { value: "general", label: "General (9AM-6PM)" },
  { value: "morning", label: "Morning (6AM-2PM)" },
  { value: "afternoon", label: "Afternoon (2PM-10PM)" },
  { value: "night", label: "Night (10PM-6AM)" },
];
const indianStates = ["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const DOCUMENT_TYPES: { key: string; label: string; required: boolean }[] = [
  { key: "aadhaar", label: "Aadhaar Card", required: true },
  { key: "pan", label: "PAN Card", required: false },
  { key: "bank_passbook", label: "Bank Passbook / Cancelled Cheque", required: false },
  { key: "photo", label: "Passport Photo", required: true },
  { key: "medical_certificate", label: "Medical Fitness Certificate", required: false },
  { key: "police_verification", label: "Police Verification", required: false },
];

export default function OnboardWorkerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Form state
  const [form, setForm] = useState({
    // Personal
    first_name: "", last_name: "", father_name: "",
    date_of_birth: "", gender: "", blood_group: "",
    marital_status: "", mobile: "", alternate_mobile: "",
    email: "",
    // Employment
    agency_id: "", department: "", designation: "",
    work_category: "", shift: "", date_of_joining: new Date().toISOString().split("T")[0],
    basic_wage: "", da: "", hra: "", other_allowances: "",
    // Address
    permanent_address: "", current_address: "", state: "", district: "", pincode: "",
    // Statutory
    aadhaar: "", pan: "", uan: "", esi_number: "",
    bank_account: "", bank_name: "", ifsc: "", bank_branch: "",
    // Emergency
    emergency_name: "", emergency_phone: "", emergency_relation: "",
  });

  const [documents, setDocuments] = useState<DocUpload[]>(
    DOCUMENT_TYPES.map((d) => ({ ...d, file: null }))
  );

  // Load agencies when step 2 is reached
  useEffect(() => {
    if (currentStep === 2 && agencies.length === 0) {
      loadAgencies();
    }
  }, [currentStep]);

  async function loadAgencies() {
    setAgenciesLoading(true);
    try {
      const res = await agenciesApi.list();
      const data = res.data;
      setAgencies(data.data || data || []);
    } catch {
      toast.error("Failed to load agencies");
    } finally {
      setAgenciesLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileSelect(docKey: string, file: File | null) {
    setDocuments((prev) =>
      prev.map((d) => (d.key === docKey ? { ...d, file } : d))
    );
  }

  function validateStep(): boolean {
    switch (currentStep) {
      case 1:
        if (!form.first_name || !form.last_name || !form.date_of_birth || !form.gender || !form.mobile) {
          toast.error("Please fill all required fields");
          return false;
        }
        if (form.mobile.length !== 10 || !/^\d+$/.test(form.mobile)) {
          toast.error("Please enter a valid 10-digit mobile number");
          return false;
        }
        return true;
      case 2:
        if (!form.agency_id || !form.department || !form.designation || !form.work_category || !form.shift || !form.date_of_joining || !form.basic_wage) {
          toast.error("Please fill all required fields");
          return false;
        }
        return true;
      case 3:
        if (!form.permanent_address || !form.state || !form.pincode) {
          toast.error("Please fill all required fields");
          return false;
        }
        return true;
      case 4:
        if (!form.aadhaar && !form.pan) {
          toast.error("Please provide at least Aadhaar or PAN number");
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  function handleNext() {
    if (!validateStep()) return;
    setCurrentStep((s) => s + 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      // Build worker payload
      const workerPayload: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        father_name: form.father_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        blood_group: form.blood_group || undefined,
        marital_status: form.marital_status || undefined,
        mobile: form.mobile,
        alternate_mobile: form.alternate_mobile || undefined,
        email: form.email || undefined,
        agency_id: form.agency_id,
        plant_id: "plant_001",
        department: form.department,
        designation: form.designation,
        work_category: form.work_category,
        shift: form.shift,
        date_of_joining: form.date_of_joining,
        basic_wage: Number(form.basic_wage),
        da: Number(form.da) || 0,
        hra: Number(form.hra) || 0,
        other_allowances: Number(form.other_allowances) || 0,
        permanent_address: form.permanent_address,
        current_address: form.current_address || form.permanent_address,
        state: form.state,
        district: form.district || undefined,
        pincode: form.pincode,
        aadhaar_number: form.aadhaar || undefined,
        pan_number: form.pan || undefined,
        uan_number: form.uan || undefined,
        esi_number: form.esi_number || undefined,
        bank_account_number: form.bank_account || undefined,
        bank_name: form.bank_name || undefined,
        ifsc_code: form.ifsc || undefined,
        bank_branch: form.bank_branch || undefined,
        emergency_contact_name: form.emergency_name || undefined,
        emergency_contact_phone: form.emergency_phone || undefined,
        emergency_contact_relation: form.emergency_relation || undefined,
      };

      // Remove undefined values
      Object.keys(workerPayload).forEach((key) => {
        if (workerPayload[key] === undefined) delete workerPayload[key];
      });

      // Create worker
      const createRes = await workersApi.create(workerPayload);
      const workerId = createRes.data?.id || createRes.data?.data?.id;

      if (!workerId) {
        toast.error("Worker created but no ID returned");
        setIsSubmitting(false);
        return;
      }

      // Upload documents
      const docsToUpload = documents.filter((d) => d.file);
      let uploadErrors = 0;

      for (const doc of docsToUpload) {
        try {
          const formData = new FormData();
          formData.append("file", doc.file!);
          await workersApi.uploadDocument(workerId + `?document_type=${doc.key}`, formData);
        } catch {
          uploadErrors++;
        }
      }

      if (uploadErrors > 0) {
        toast.warning(`Worker onboarded but ${uploadErrors} document(s) failed to upload. You can upload them later.`);
      } else {
        toast.success("Worker onboarded successfully!");
      }

      router.push("/contractors");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: unknown } } };
      const detail = axiosErr?.response?.data?.detail;
      const message = typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail.map((e: { msg?: string }) => e.msg || "Validation error").join(", ")
        : "Failed to onboard worker. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const progressPct = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Worker Onboarding</h2>
              <p className="text-sm text-muted-foreground">Step {currentStep} of {steps.length}</p>
            </div>
            <Badge variant="info">{Math.round(progressPct)}% complete</Badge>
          </div>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all",
                        isCompleted
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isCurrent
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-gray-300 text-gray-300 bg-white"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <p className={cn("text-xs mt-1 font-medium", isCurrent ? "text-blue-600" : isCompleted ? "text-foreground" : "text-muted-foreground")}>
                      {step.title}
                    </p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-2 mb-5", isCompleted ? "bg-blue-600" : "bg-gray-200")} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile progress bar */}
          <div className="sm:hidden">
            <div className="flex items-center gap-2 mb-2">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="h-5 w-5 text-blue-600" />;
              })()}
              <span className="font-semibold text-sm">{steps[currentStep - 1].title}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Ramu" value={form.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Prasad" value={form.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Father&apos;s Name</Label>
                <Input placeholder="Father's full name" value={form.father_name} onChange={(e) => handleChange("father_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date of Birth <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender <span className="text-red-500">*</span></Label>
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Blood Group</Label>
                <Select value={form.blood_group} onValueChange={(v) => handleChange("blood_group", v)}>
                  <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marital Status</Label>
                <Select value={form.marital_status} onValueChange={(v) => handleChange("marital_status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {["single", "married", "divorced", "widowed"].map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mobile Number <span className="text-red-500">*</span></Label>
                <Input type="tel" placeholder="10-digit mobile" maxLength={10} value={form.mobile} onChange={(e) => handleChange("mobile", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Alternate Mobile</Label>
                <Input type="tel" placeholder="Optional" maxLength={10} value={form.alternate_mobile} onChange={(e) => handleChange("alternate_mobile", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" placeholder="Optional" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: Employment */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contractor Agency <span className="text-red-500">*</span></Label>
                {agenciesLoading ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading agencies...
                  </div>
                ) : (
                  <Select value={form.agency_id} onValueChange={(v) => handleChange("agency_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                    <SelectContent>
                      {agencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Department <span className="text-red-500">*</span></Label>
                <Select value={form.department} onValueChange={(v) => handleChange("department", v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Designation <span className="text-red-500">*</span></Label>
                <Select value={form.designation} onValueChange={(v) => handleChange("designation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Work Category <span className="text-red-500">*</span></Label>
                <Select value={form.work_category} onValueChange={(v) => handleChange("work_category", v)}>
                  <SelectTrigger><SelectValue placeholder="Skill category" /></SelectTrigger>
                  <SelectContent>
                    {workCategories.map((c) => (
                      <SelectItem key={c} value={c.toLowerCase().replace("-", "_").replace(" ", "_")}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shift <span className="text-red-500">*</span></Label>
                <Select value={form.shift} onValueChange={(v) => handleChange("shift", v)}>
                  <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                  <SelectContent>
                    {shifts.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date of Joining <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.date_of_joining} onChange={(e) => handleChange("date_of_joining", e.target.value)} />
              </div>
              <div className="sm:col-span-2 border-t pt-4">
                <p className="font-semibold text-sm mb-3 text-muted-foreground">Wage Details (Monthly)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label>Basic Wage <span className="text-red-500">*</span></Label>
                    <Input type="number" placeholder="0" value={form.basic_wage} onChange={(e) => handleChange("basic_wage", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>DA</Label>
                    <Input type="number" placeholder="0" value={form.da} onChange={(e) => handleChange("da", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>HRA</Label>
                    <Input type="number" placeholder="0" value={form.hra} onChange={(e) => handleChange("hra", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Other Allow.</Label>
                    <Input type="number" placeholder="0" value={form.other_allowances} onChange={(e) => handleChange("other_allowances", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Permanent Address <span className="text-red-500">*</span></Label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="House No., Village/Town, District"
                  value={form.permanent_address}
                  onChange={(e) => handleChange("permanent_address", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Current Address (if different)</Label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Current residence address"
                  value={form.current_address}
                  onChange={(e) => handleChange("current_address", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <Select value={form.state} onValueChange={(v) => handleChange("state", v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {indianStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>District</Label>
                  <Input placeholder="District name" value={form.district} onChange={(e) => handleChange("district", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>PIN Code <span className="text-red-500">*</span></Label>
                  <Input placeholder="6-digit PIN" maxLength={6} value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} />
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="font-semibold text-sm mb-3 text-muted-foreground">Emergency Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Contact Name</Label>
                    <Input placeholder="Full name" value={form.emergency_name} onChange={(e) => handleChange("emergency_name", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Phone</Label>
                    <Input type="tel" placeholder="Mobile number" maxLength={10} value={form.emergency_phone} onChange={(e) => handleChange("emergency_phone", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Relation</Label>
                    <Select value={form.emergency_relation} onValueChange={(v) => handleChange("emergency_relation", v)}>
                      <SelectTrigger><SelectValue placeholder="Relation" /></SelectTrigger>
                      <SelectContent>
                        {["Spouse", "Father", "Mother", "Brother", "Sister", "Son", "Daughter", "Friend"].map((r) => (
                          <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Statutory IDs */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Aadhaar Number</Label>
                <Input placeholder="XXXX XXXX XXXX" maxLength={12} value={form.aadhaar} onChange={(e) => handleChange("aadhaar", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>PAN Number</Label>
                <Input placeholder="ABCDE1234F" maxLength={10} className="uppercase" value={form.pan} onChange={(e) => handleChange("pan", e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5">
                <Label>UAN (PF Universal Account)</Label>
                <Input placeholder="12-digit UAN" maxLength={12} value={form.uan} onChange={(e) => handleChange("uan", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>ESI Number</Label>
                <Input placeholder="ESI IP number" value={form.esi_number} onChange={(e) => handleChange("esi_number", e.target.value)} />
              </div>
              <div className="sm:col-span-2 border-t pt-4">
                <p className="font-semibold text-sm mb-3 text-muted-foreground">Bank Account Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Account Number</Label>
                    <Input placeholder="Bank account number" value={form.bank_account} onChange={(e) => handleChange("bank_account", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bank Name</Label>
                    <Input placeholder="e.g. State Bank of India" value={form.bank_name} onChange={(e) => handleChange("bank_name", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>IFSC Code</Label>
                    <Input placeholder="e.g. SBIN0001234" className="uppercase" value={form.ifsc} onChange={(e) => handleChange("ifsc", e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Branch</Label>
                    <Input placeholder="Branch name" value={form.bank_branch} onChange={(e) => handleChange("bank_branch", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Documents */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">Upload clear scanned copies or photos. Supported formats: PDF, JPG, PNG (max 5MB each).</p>
              </div>
              {documents.map((doc) => {
                const hasFile = !!doc.file;
                return (
                  <div
                    key={doc.key}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border-2 border-dashed transition-colors",
                      hasFile ? "border-green-400 bg-green-50" : "border-gray-200 bg-secondary/30 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {hasFile ? (
                        <Check className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {doc.label}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        {hasFile && (
                          <p className="text-xs text-green-600 truncate">{doc.file!.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleFileSelect(doc.key, null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant={hasFile ? "outline" : "secondary"}
                        size="sm"
                        className="gap-2"
                        onClick={() => fileInputRefs.current[doc.key]?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        {hasFile ? "Replace" : "Upload"}
                      </Button>
                      <input
                        ref={(el) => { fileInputRefs.current[doc.key] = el; }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file && file.size > 5 * 1024 * 1024) {
                            toast.error("File size must be less than 5MB");
                            return;
                          }
                          handleFileSelect(doc.key, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back()}
          className="gap-2"
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep > 1 ? "Previous" : "Cancel"}
        </Button>
        {currentStep < steps.length ? (
          <Button onClick={handleNext} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 bg-green-600 hover:bg-green-500">
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Onboarding...</>
            ) : (
              <><Check className="h-4 w-4" /> Complete Onboarding</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
