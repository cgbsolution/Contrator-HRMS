"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Save,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
} from "lucide-react";
import { attendanceCodeConfig, formatDate } from "@/lib/utils";
import { attendanceApi, workersApi } from "@/lib/api";
import { toast } from "sonner";

interface AttendanceRecord {
  id?: string;
  worker_id: string;
  employee_code: string;
  worker_name: string;
  department: string;
  shift: string;
  status: string;
  in_time: string;
  out_time: string;
  overtime_hours: number;
}

const ATTENDANCE_CODES = [
  "P", "A", "H", "HP", "WO", "WOP", "OD", "OT", "L", "ML", "PL", "CL",
];

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [workers, setWorkers] = useState<AttendanceRecord[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [inTime, setInTime] = useState<Record<string, string>>({});
  const [overtime, setOvertime] = useState<Record<string, number>>({});
  const [shifts, setShifts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.getDaily(date);
      const records: AttendanceRecord[] = res.data?.records ?? res.data ?? [];

      if (records.length > 0) {
        setWorkers(records);
        setAttendance(
          Object.fromEntries(records.map((r) => [r.worker_id, r.status || "P"]))
        );
        setInTime(
          Object.fromEntries(records.map((r) => [r.worker_id, r.in_time || ""]))
        );
        setOvertime(
          Object.fromEntries(
            records.map((r) => [r.worker_id, r.overtime_hours || 0])
          )
        );
        setShifts(
          Object.fromEntries(records.map((r) => [r.worker_id, r.shift || "General"]))
        );
      } else {
        // No attendance records - load active workers
        const wRes = await workersApi.list({ status: "active", page_size: 100 });
        const wList = wRes.data?.data ?? wRes.data?.workers ?? wRes.data?.items ?? (Array.isArray(wRes.data) ? wRes.data : []);
        const mapped: AttendanceRecord[] = wList.map(
          (w: Record<string, unknown>) => ({
            worker_id: w.id as string,
            employee_code: (w.employee_code as string) || "",
            worker_name: (w.name as string) || (w.worker_name as string) || `${(w.first_name as string) || ""} ${(w.last_name as string) || ""}`.trim() || "",
            department: (w.department as string) || "",
            shift: (w.shift as string) || "General",
            status: "",
            in_time: "",
            out_time: "",
            overtime_hours: 0,
          })
        );
        setWorkers(mapped);
        setAttendance(Object.fromEntries(mapped.map((r) => [r.worker_id, ""])));
        setInTime(Object.fromEntries(mapped.map((r) => [r.worker_id, ""])));
        setOvertime(Object.fromEntries(mapped.map((r) => [r.worker_id, 0])));
        setShifts(
          Object.fromEntries(mapped.map((r) => [r.worker_id, r.shift || "General"]))
        );
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setError("Failed to load attendance data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const departments = [
    "All",
    ...Array.from(new Set(workers.map((w) => w.department).filter(Boolean))),
  ];

  const filtered = workers.filter((w) => {
    const matchSearch =
      !search ||
      w.worker_name.toLowerCase().includes(search.toLowerCase()) ||
      w.employee_code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || w.department === deptFilter;
    return matchSearch && matchDept;
  });

  const presentCount = Object.values(attendance).filter((s) =>
    ["P", "HP", "WOP", "OD", "PL", "CL", "OT"].includes(s)
  ).length;
  const absentCount = Object.values(attendance).filter((s) =>
    ["A", "L", "ML"].includes(s)
  ).length;
  const totalCount = workers.length;

  function setAllPresent() {
    setAttendance(Object.fromEntries(workers.map((w) => [w.worker_id, "P"])));
    toast.success("All workers marked Present");
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const records = workers.map((w) => ({
        worker_id: w.worker_id,
        date,
        status: attendance[w.worker_id] || "P",
        in_time: inTime[w.worker_id] || "",
        overtime_hours: overtime[w.worker_id] || 0,
        shift: shifts[w.worker_id] || "General",
      }));
      await attendanceApi.bulkMark(records);
      toast.success(`Attendance saved for ${formatDate(date)}`);
    } catch (err) {
      console.error("Failed to save attendance:", err);
      toast.error("Failed to save attendance. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading attendance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadAttendance} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={setAllPresent}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Mark All Present
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-800">{presentCount}</p>
              <p className="text-xs text-green-600 font-medium">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-700">{absentCount}</p>
              <p className="text-xs text-red-500 font-medium">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-800">{totalCount}</p>
              <p className="text-xs text-blue-600 font-medium">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Code Legend */}
      <Card>
        <CardContent className="p-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-green-600 text-white">P - Present</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-red-600 text-white">A - Absent</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-blue-700 text-white">H - Holiday</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-blue-600 text-white">HP - Holiday Present</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-gray-600 text-white">WO - Weekly Off</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-purple-600 text-white">WOP - WO Present</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-teal-700 text-white">OD - On Duty</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-amber-600 text-white">OT - Overtime</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-yellow-600 text-white">L - Leave</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-pink-600 text-white">ML - Medical Leave</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-indigo-600 text-white">PL - Paid Leave</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap bg-cyan-700 text-white">CL - Casual Leave</span>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search worker by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Attendance Grid */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Attendance - {formatDate(date)}
            </CardTitle>
            <Badge variant="secondary">{filtered.length} workers</Badge>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 border-b">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                  Worker
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                  Code
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                  Department
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                  In Time
                </th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">
                  OT Hours
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((worker) => {
                const code = attendance[worker.worker_id] || "P";
                const cfg =
                  attendanceCodeConfig[code] || attendanceCodeConfig["P"];
                return (
                  <tr
                    key={worker.worker_id}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-sm">
                        {worker.worker_name}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <p className="text-xs text-muted-foreground font-mono">
                        {worker.employee_code}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <p className="text-sm">{worker.department}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {shifts[worker.worker_id] || worker.shift}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center h-7 min-w-[32px] text-xs font-bold rounded ${cfg.color}`}
                        >
                          {code}
                        </span>
                        <select
                          value={code}
                          onChange={(e) =>
                            setAttendance((prev) => ({
                              ...prev,
                              [worker.worker_id]: e.target.value,
                            }))
                          }
                          className="h-8 border rounded-md px-1 text-xs bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ATTENDANCE_CODES.map((c) => {
                            const cc = attendanceCodeConfig[c];
                            return (
                              <option key={c} value={c}>
                                {c} - {cc.label}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <Input
                        type="time"
                        className="h-8 w-28 text-xs"
                        value={inTime[worker.worker_id] || ""}
                        onChange={(e) =>
                          setInTime((prev) => ({
                            ...prev,
                            [worker.worker_id]: e.target.value,
                          }))
                        }
                        disabled={
                          !["P", "HP", "WOP", "OD", "OT"].includes(code)
                        }
                      />
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <Input
                        type="number"
                        className="h-8 w-20 text-xs"
                        placeholder="0"
                        min={0}
                        max={8}
                        value={overtime[worker.worker_id] || 0}
                        onChange={(e) =>
                          setOvertime((prev) => ({
                            ...prev,
                            [worker.worker_id]: Number(e.target.value),
                          }))
                        }
                        disabled={!["P", "HP", "WOP", "OT"].includes(code)}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No workers found.
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
