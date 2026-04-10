// ─── Enums ───────────────────────────────────────────────────────────────────

export type ContractorStatus = "active" | "onboarding" | "offboarding" | "inactive" | "terminated";
export type Gender = "male" | "female" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type AttendanceCode = "P" | "A" | "H" | "HP" | "WO" | "WOP" | "OD" | "OT" | "L" | "ML" | "PL" | "CL";
export type DocumentType = "aadhaar" | "pan" | "bank_passbook" | "photo" | "medical_certificate" | "training_certificate" | "police_verification" | "offer_letter" | "appointment_letter" | "exit_form" | "other";
export type ComplianceType = "pf" | "esi" | "pt" | "lwf" | "minimum_wage";
export type ShiftType = "general" | "morning" | "afternoon" | "night";
export type WorkCategory = "skilled" | "semi_skilled" | "unskilled" | "highly_skilled";

// ─── User / Auth ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "hr_manager" | "plant_manager" | "supervisor" | "viewer" | "worker";
  plant_id: string;
  tenant_id?: string | null;
  tenant_name?: string | null;
  is_super_admin?: boolean;
  avatar?: string;
}

// ─── Plant / Location ─────────────────────────────────────────────────────────

export interface Plant {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

// ─── Contractor Agency ────────────────────────────────────────────────────────

export interface ContractorAgency {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  pan: string;
  gstin?: string;
  license_number?: string;
  license_expiry?: string;
  pf_code?: string;
  esi_code?: string;
  is_active: boolean;
}

// ─── Worker (Blue Collar Contractor Staff) ────────────────────────────────────

export interface Worker {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  father_name: string;
  date_of_birth: string;
  gender: Gender;
  blood_group?: BloodGroup;
  marital_status: "single" | "married" | "divorced" | "widowed";
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  permanent_address: string;
  current_address: string;
  state: string;
  district: string;
  pincode: string;

  // Employment
  agency_id: string;
  agency?: ContractorAgency;
  plant_id: string;
  plant?: Plant;
  department: string;
  designation: string;
  work_category: WorkCategory;
  date_of_joining: string;
  date_of_leaving?: string;
  status: ContractorStatus;
  shift: ShiftType;

  // Statutory
  aadhaar_number?: string;
  pan_number?: string;
  uan_number?: string;  // PF UAN
  esi_number?: string;
  bank_account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  bank_branch?: string;

  // Salary
  salary_structure_id?: string;
  basic_wage: number;
  da: number;
  hra: number;
  other_allowances: number;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  documents?: WorkerDocument[];
  created_at: string;
  updated_at: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export interface WorkerDocument {
  id: string;
  worker_id: string;
  document_type: DocumentType;
  document_number?: string;
  file_url: string;
  file_name: string;
  expiry_date?: string;
  is_verified: boolean;
  uploaded_at: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  worker_id: string;
  worker?: Worker;
  date: string;
  status: AttendanceCode;
  in_time?: string;
  out_time?: string;
  overtime_hours?: number;
  shift: ShiftType;
  remarks?: string;
}

export interface MonthlyAttendance {
  worker_id: string;
  worker?: Worker;
  month: number;
  year: number;
  present_days: number;
  absent_days: number;
  holiday_present: number;
  weekly_off_present: number;
  overtime_hours: number;
  paid_days: number;
  leave_days: number;
}

// ─── Shift ────────────────────────────────────────────────────────────────────

export interface Shift {
  id: string;
  name: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  grace_minutes: number;
  is_night_shift: boolean;
}

// ─── Salary Structure ─────────────────────────────────────────────────────────

export interface SalaryStructure {
  id: string;
  name: string;
  work_category: WorkCategory;
  basic_percentage: number;
  da_percentage: number;
  hra_percentage: number;
  conveyance_allowance: number;
  special_allowance: number;
  medical_allowance: number;
  pf_applicable: boolean;
  esi_applicable: boolean;
  pt_applicable: boolean;
  lwf_applicable: boolean;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export interface PayrollRecord {
  id: string;
  worker_id: string;
  worker?: Worker;
  month: number;
  year: number;
  paid_days: number;
  basic: number;
  da: number;
  hra: number;
  conveyance: number;
  special_allowance: number;
  medical_allowance: number;
  overtime_amount: number;
  gross_salary: number;
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  pt_amount: number;
  lwf_amount: number;
  tds_amount: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  status: "draft" | "processed" | "paid" | "cancelled";
  payment_date?: string;
  payment_mode?: "bank_transfer" | "cash" | "cheque";
  utr_number?: string;
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export interface PFRecord {
  id: string;
  worker_id: string;
  month: number;
  year: number;
  uan: string;
  basic_da: number;
  employee_contribution: number;  // 12%
  employer_eps: number;           // 8.33%
  employer_edli: number;          // 0.5%
  employer_epf: number;           // 3.67%
  employer_admin: number;         // 0.5%
  total_employer: number;
  total_challan: number;
}

export interface ESIRecord {
  id: string;
  worker_id: string;
  month: number;
  year: number;
  esi_number: string;
  gross_wages: number;
  employee_contribution: number;  // 0.75%
  employer_contribution: number;  // 3.25%
  total_contribution: number;
}

export interface PTRecord {
  id: string;
  worker_id: string;
  month: number;
  year: number;
  state: string;
  gross_salary: number;
  pt_amount: number;
}

export interface LWFRecord {
  id: string;
  worker_id: string;
  month: number;
  year: number;
  state: string;
  employee_contribution: number;
  employer_contribution: number;
}

// ─── Compliance Settings ──────────────────────────────────────────────────────

export interface ComplianceSettings {
  pf_wage_ceiling: number;        // 15000
  esi_wage_ceiling: number;       // 21000
  pf_employee_rate: number;       // 12
  pf_employer_rate: number;       // 12
  esi_employee_rate: number;      // 0.75
  esi_employer_rate: number;      // 3.25
  gratuity_rate: number;          // 4.81
  bonus_rate: number;             // 8.33
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_workers: number;
  active_workers: number;
  onboarding_workers: number;
  offboarding_workers: number;
  today_present: number;
  today_absent: number;
  today_attendance_percentage: number;
  pending_documents: number;
  current_month_payroll_total: number;
  compliance_dues: number;
  agencies: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface WorkerFilters {
  search?: string;
  status?: ContractorStatus;
  agency_id?: string;
  department?: string;
  work_category?: WorkCategory;
  page?: number;
  page_size?: number;
}
