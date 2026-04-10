import axios from "axios";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ─── Request interceptor: attach auth token ───────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 (session expired) + stale token 403 ───
let isRedirecting = false;

function forceLogout(message: string) {
  if (isRedirecting || typeof window === "undefined") return;
  isRedirecting = true;
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  toast.error(message, { duration: 5000 });
  setTimeout(() => {
    window.location.href = "/login";
    isRedirecting = false;
  }, 500);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail: string = error.response?.data?.detail || "";

    if (status === 401) {
      forceLogout("Session expired. Please log in again.");
    } else if (status === 403 && detail.includes("No tenant context")) {
      // Stale JWT from before multi-tenancy was added → force re-login
      forceLogout("Your session is outdated. Please log in again.");
    }
    return Promise.reject(error);
  }
);

// ─── Tenants (Super Admin) ────────────────────────────────────────────────────
export const tenantsApi = {
  list: (params?: Record<string, unknown>) => api.get("/tenants", { params }),
  get: (id: string) => api.get(`/tenants/${id}`),
  create: (data: Record<string, unknown>) => api.post("/tenants", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/tenants/${id}`, data),
  toggleActive: (id: string) => api.patch(`/tenants/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/tenants/${id}`),
  resetAdminPassword: (id: string) => api.post(`/tenants/${id}/reset-admin-password`),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put("/auth/profile", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  listUsers: () => api.get("/auth/users"),
  createUser: (data: Record<string, unknown>) => api.post("/auth/users", data),
  updateUser: (id: string, params: Record<string, unknown>) =>
    api.patch(`/auth/users/${id}`, null, { params }),
};

// ─── Workers ──────────────────────────────────────────────────────────────────
export const workersApi = {
  list: (params?: Record<string, unknown>) => api.get("/workers", { params }),
  get: (id: string) => api.get(`/workers/${id}`),
  create: (data: Record<string, unknown>) => api.post("/workers", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/workers/${id}`, data),
  delete: (id: string) => api.delete(`/workers/${id}`),
  offboard: (id: string) => api.post(`/workers/${id}/offboard`),
  activate: (id: string) => api.post(`/workers/${id}/activate`),
  terminate: (id: string, dateOfLeaving?: string) =>
    api.post(`/workers/${id}/terminate`, null, {
      params: dateOfLeaving ? { date_of_leaving: dateOfLeaving } : {},
    }),
  createLogin: (id: string) => api.post(`/workers/${id}/create-login`),
  uploadDocument: (id: string, data: FormData, params?: Record<string, string>) =>
    api.post(`/workers/${id}/documents`, data, {
      headers: { "Content-Type": "multipart/form-data" },
      params,
    }),
  documents: (id: string) => api.get(`/workers/${id}/documents`),
  allDocuments: (params?: Record<string, unknown>) => api.get("/workers/documents/all", { params }),
  verifyDocument: (docId: string) => api.patch(`/workers/documents/${docId}/verify`),
  stats: () => api.get("/workers/stats"),
  nextCode: (agencyId?: string) =>
    api.get("/workers/next-code", { params: agencyId ? { agency_id: agencyId } : {} }),
  importTemplate: () =>
    api.get("/workers/import/template", { responseType: "blob" }),
  bulkImport: (data: FormData) =>
    api.post("/workers/import/bulk", data, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    }),
};

// ─── Agencies ─────────────────────────────────────────────────────────────────
export const agenciesApi = {
  list: (params?: Record<string, unknown>) => api.get("/agencies", { params }),
  get: (id: string) => api.get(`/agencies/${id}`),
  create: (data: Record<string, unknown>) => api.post("/agencies", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/agencies/${id}`, data),
  delete: (id: string) => api.delete(`/agencies/${id}`),
  toggleActive: (id: string) => api.patch(`/agencies/${id}/deactivate`),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceApi = {
  getDaily: (date: string, plant_id?: string) =>
    api.get("/attendance/daily", { params: { date, plant_id } }),
  markAttendance: (data: Record<string, unknown>) => api.post("/attendance", data),
  bulkMark: (records: Record<string, unknown>[]) =>
    api.post("/attendance/bulk", { records }),
  getMonthly: (month: number, year: number, params?: Record<string, unknown>) =>
    api.get("/attendance/monthly", { params: { month, year, ...params } }),
};

// ─── Shifts & Holidays ───────────────────────────────────────────────────────
export const shiftsApi = {
  list: (plant_id?: string) => api.get("/shifts", { params: { plant_id } }),
  create: (data: Record<string, unknown>) => api.post("/shifts", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/shifts/${id}`, data),
  delete: (id: string) => api.delete(`/shifts/${id}`),
  holidays: (year: number, plant_id?: string) =>
    api.get("/holidays", { params: { year, plant_id } }),
  createHoliday: (data: Record<string, unknown>) => api.post("/holidays", data),
  updateHoliday: (id: string, data: Record<string, unknown>) => api.patch(`/holidays/${id}`, data),
  deleteHoliday: (id: string) => api.delete(`/holidays/${id}`),
};

// ─── Payroll ──────────────────────────────────────────────────────────────────
export const payrollApi = {
  process: (month: number, year: number, plant_id: string) =>
    api.post("/payroll/process", { month, year, plant_id }),
  list: (params: Record<string, unknown>) => api.get("/payroll", { params }),
  get: (id: string) => api.get(`/payroll/${id}`),
  payslip: (id: string) => api.get(`/payroll/${id}/payslip`, { responseType: "blob" }),
  updatePayment: (id: string, data: Record<string, unknown>) =>
    api.patch(`/payroll/${id}/payment`, data),
  salaryStructures: () => api.get("/payroll/salary-structures"),
  createSalaryStructure: (data: Record<string, unknown>) =>
    api.post("/payroll/salary-structures", data),
};

// ─── Compliance ───────────────────────────────────────────────────────────────
export const complianceApi = {
  pfReport: (month: number, year: number) =>
    api.get("/compliance/pf", { params: { month, year } }),
  esiReport: (month: number, year: number) =>
    api.get("/compliance/esi", { params: { month, year } }),
  ptReport: (month: number, year: number) =>
    api.get("/compliance/pt", { params: { month, year } }),
  lwfReport: (month: number, year: number) =>
    api.get("/compliance/lwf", { params: { month, year } }),
  minimumWages: (params?: Record<string, unknown>) =>
    api.get("/compliance/minimum-wages", { params }),
  checkMinWageCompliance: (month: number, year: number) =>
    api.get("/compliance/minimum-wages/check", { params: { month, year } }),
  downloadPfEcr: (month: number, year: number) =>
    api.get("/compliance/pf/ecr", { params: { month, year }, responseType: "blob" }),
  downloadEsiReturn: (month: number, year: number) =>
    api.get("/compliance/esi/return", { params: { month, year }, responseType: "blob" }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  attendance: (params: Record<string, unknown>) =>
    api.get("/reports/attendance", { params }),
  payroll: (params: Record<string, unknown>) =>
    api.get("/reports/payroll", { params }),
  headcount: () => api.get("/reports/headcount"),
  wageRegister: (month: number, year: number) =>
    api.get("/reports/wage-register", { params: { month, year }, responseType: "blob" }),
  salaryRegister: (month: number, year: number) =>
    api.get("/reports/salary-register", { params: { month, year }, responseType: "blob" }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  attendanceTrend: (days = 7) =>
    api.get("/dashboard/attendance-trend", { params: { days } }),
  workersByDepartment: () => api.get("/dashboard/workers-by-department"),
  upcomingCompliance: () => api.get("/dashboard/upcoming-compliance"),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  listPlants: () => api.get("/settings/plants"),
  getPlant: (id: string) => api.get(`/settings/plants/${id}`),
  createPlant: (data: Record<string, unknown>) => api.post("/settings/plants", data),
  updatePlant: (id: string, data: Record<string, unknown>) =>
    api.patch(`/settings/plants/${id}`, data),
  getComplianceSettings: (plant_id: string) =>
    api.get("/settings/compliance", { params: { plant_id } }),
  updateComplianceSettings: (plant_id: string, settings: Record<string, unknown>[]) =>
    api.put("/settings/compliance", settings, { params: { plant_id } }),
};

// ─── ESS (Employee Self Service) ──────────────────────────────────────────────
export const essApi = {
  profile: () => api.get("/ess/profile"),
  attendance: (month: number, year: number) =>
    api.get("/ess/attendance", { params: { month, year } }),
  payslips: () => api.get("/ess/payslips"),
  downloadPayslip: (id: string) =>
    api.get(`/ess/payslips/${id}/download`, { responseType: "blob" }),
  leaveTypes: () => api.get("/ess/leaves/types"),
  leaveBalance: (year?: number) =>
    api.get("/ess/leaves/balance", { params: { year } }),
  applyLeave: (data: Record<string, unknown>) => api.post("/ess/leaves/apply", data),
  myLeaves: () => api.get("/ess/leaves"),
  cancelLeave: (id: string) => api.delete(`/ess/leaves/${id}`),
  investments: () => api.get("/ess/investments"),
  declareInvestment: (data: Record<string, unknown>) =>
    api.post("/ess/investments", data),
  uploadProof: (declarationId: string, data: FormData) =>
    api.post(`/ess/investments/${declarationId}/proof`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // Punch attendance
  punch: (data: { latitude?: number; longitude?: number; address?: string }) =>
    api.post("/ess/punch", data),
  punchToday: () => api.get("/ess/punch/today"),
  punchHistory: (days?: number) =>
    api.get("/ess/punch/history", { params: { days } }),
};

// ─── Leave Admin ──────────────────────────────────────────────────────────────
export const leaveAdminApi = {
  types: () => api.get("/leaves/types"),
  createType: (data: Record<string, unknown>) => api.post("/leaves/types", data),
  pendingLeaves: (plant_id?: string) =>
    api.get("/leaves/pending", { params: { plant_id } }),
  allLeaves: (params?: Record<string, unknown>) =>
    api.get("/leaves/all", { params }),
  approve: (id: string, remarks?: string) =>
    api.post(`/leaves/${id}/approve`, { remarks }),
  reject: (id: string, remarks: string) =>
    api.post(`/leaves/${id}/reject`, { remarks }),
  initBalances: (year: number) =>
    api.post("/leaves/balances/bulk-init", null, { params: { year } }),
};
