"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  Plus,
  Calendar,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { shiftsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Shift {
  id: string;
  name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  grace_minutes: number;
  is_night_shift: boolean;
}

interface Holiday {
  id: string;
  date: string;
  name: string;
  holiday_type: string;
  state: string;
  year: number;
}

const SHIFT_TYPES = [
  { value: "general", label: "General" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "night", label: "Night" },
];

const HOLIDAY_TYPES = [
  { value: "national", label: "National" },
  { value: "state", label: "State" },
  { value: "optional", label: "Optional" },
  { value: "weekly_off", label: "Weekly Off" },
];

const shiftTypeIcon: Record<string, React.ReactNode> = {
  general: <Sun className="h-5 w-5 text-amber-500" />,
  morning: <Sunrise className="h-5 w-5 text-orange-500" />,
  afternoon: <Sunset className="h-5 w-5 text-purple-500" />,
  night: <Moon className="h-5 w-5 text-indigo-500" />,
};

const holidayTypeBadge: Record<string, string> = {
  national: "bg-red-100 text-red-800",
  state: "bg-blue-100 text-blue-800",
  optional: "bg-yellow-100 text-yellow-800",
  weekly_off: "bg-gray-100 text-gray-800",
};

export default function ShiftManagementPage() {
  const now = new Date();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayYear, setHolidayYear] = useState(String(now.getFullYear()));
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(true);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Shift form state
  const [shiftForm, setShiftForm] = useState({
    name: "",
    shift_type: "general",
    start_time: "09:00",
    end_time: "18:00",
    break_duration_minutes: 30,
    grace_minutes: 10,
    is_night_shift: false,
  });

  // Holiday form state
  const [holidayForm, setHolidayForm] = useState({
    date: "",
    name: "",
    holiday_type: "national",
    state: "",
  });

  const loadShifts = useCallback(async () => {
    setIsLoadingShifts(true);
    try {
      const res = await shiftsApi.list();
      setShifts(res.data?.shifts ?? res.data ?? []);
    } catch (err) {
      console.error("Failed to load shifts:", err);
      toast.error("Failed to load shifts.");
    } finally {
      setIsLoadingShifts(false);
    }
  }, []);

  const loadHolidays = useCallback(async () => {
    setIsLoadingHolidays(true);
    try {
      const res = await shiftsApi.holidays(Number(holidayYear));
      setHolidays(res.data?.holidays ?? res.data ?? []);
    } catch (err) {
      console.error("Failed to load holidays:", err);
      toast.error("Failed to load holidays.");
    } finally {
      setIsLoadingHolidays(false);
    }
  }, [holidayYear]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  async function handleAddShift() {
    setIsSaving(true);
    try {
      await shiftsApi.create(shiftForm);
      toast.success(`Shift "${shiftForm.name}" created successfully.`);
      setShowAddShift(false);
      setShiftForm({
        name: "",
        shift_type: "general",
        start_time: "09:00",
        end_time: "18:00",
        break_duration_minutes: 30,
        grace_minutes: 10,
        is_night_shift: false,
      });
      loadShifts();
    } catch (err) {
      console.error("Failed to create shift:", err);
      toast.error("Failed to create shift.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddHoliday() {
    setIsSaving(true);
    try {
      await shiftsApi.createHoliday({
        ...holidayForm,
        year: Number(holidayYear),
      });
      toast.success(`Holiday "${holidayForm.name}" added.`);
      setShowAddHoliday(false);
      setHolidayForm({ date: "", name: "", holiday_type: "national", state: "" });
      loadHolidays();
    } catch (err) {
      console.error("Failed to create holiday:", err);
      toast.error("Failed to add holiday.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="shifts">
        <TabsList>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
        </TabsList>

        {/* ── Shifts Tab ── */}
        <TabsContent value="shifts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {shifts.length} shift{shifts.length !== 1 ? "s" : ""} configured
            </p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setShowAddShift(true)}
            >
              <Plus className="h-4 w-4" />
              Add Shift
            </Button>
          </div>

          {isLoadingShifts ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : shifts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No shifts configured yet. Add your first shift.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <Card
                  key={shift.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {shiftTypeIcon[shift.shift_type] || (
                          <Clock className="h-5 w-5 text-gray-500" />
                        )}
                        <CardTitle className="text-sm font-semibold">
                          {shift.name}
                        </CardTitle>
                      </div>
                      {shift.is_night_shift && (
                        <Badge variant="secondary">Night</Badge>
                      )}
                    </div>
                    <CardDescription className="capitalize">
                      {shift.shift_type} shift
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-secondary rounded-md p-2 text-center">
                        <p className="font-semibold">{shift.start_time}</p>
                        <p className="text-muted-foreground">Start</p>
                      </div>
                      <div className="bg-secondary rounded-md p-2 text-center">
                        <p className="font-semibold">{shift.end_time}</p>
                        <p className="text-muted-foreground">End</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                      <span>Break: {shift.break_duration_minutes} min</span>
                      <span>Grace: {shift.grace_minutes} min</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Holidays Tab ── */}
        <TabsContent value="holidays" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select value={holidayYear} onValueChange={setHolidayYear}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026"].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {holidays.length} holiday{holidays.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setShowAddHoliday(true)}
            >
              <Plus className="h-4 w-4" />
              Add Holiday
            </Button>
          </div>

          {isLoadingHolidays ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : holidays.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No holidays configured for {holidayYear}.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b">
                      <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                        Type
                      </th>
                      <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">
                        State
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {holidays.map((h) => (
                      <tr
                        key={h.id}
                        className="hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(h.date)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-medium">{h.name}</td>
                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              holidayTypeBadge[h.holiday_type] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {h.holiday_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">
                          {h.state || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Shift Dialog ── */}
      <Dialog open={showAddShift} onOpenChange={setShowAddShift}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
            <DialogDescription>
              Configure a new shift schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Shift Name</Label>
              <Input
                className="mt-1"
                value={shiftForm.name}
                onChange={(e) =>
                  setShiftForm({ ...shiftForm, name: e.target.value })
                }
                placeholder="e.g. Morning Shift"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={shiftForm.shift_type}
                onValueChange={(v) =>
                  setShiftForm({ ...shiftForm, shift_type: v })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  className="mt-1"
                  value={shiftForm.start_time}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, start_time: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  className="mt-1"
                  value={shiftForm.end_time}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, end_time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Break (minutes)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  value={shiftForm.break_duration_minutes}
                  onChange={(e) =>
                    setShiftForm({
                      ...shiftForm,
                      break_duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Grace (minutes)</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  value={shiftForm.grace_minutes}
                  onChange={(e) =>
                    setShiftForm({
                      ...shiftForm,
                      grace_minutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="nightShift"
                checked={shiftForm.is_night_shift}
                onChange={(e) =>
                  setShiftForm({
                    ...shiftForm,
                    is_night_shift: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="nightShift">Night Shift</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddShift(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddShift}
              disabled={isSaving || !shiftForm.name}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Holiday Dialog ── */}
      <Dialog open={showAddHoliday} onOpenChange={setShowAddHoliday}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a new holiday for {holidayYear}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                className="mt-1"
                value={holidayForm.date}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, date: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Holiday Name</Label>
              <Input
                className="mt-1"
                value={holidayForm.name}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, name: e.target.value })
                }
                placeholder="e.g. Republic Day"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={holidayForm.holiday_type}
                onValueChange={(v) =>
                  setHolidayForm({ ...holidayForm, holiday_type: v })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>State (optional)</Label>
              <Input
                className="mt-1"
                value={holidayForm.state}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, state: e.target.value })
                }
                placeholder="e.g. Maharashtra"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddHoliday(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddHoliday}
              disabled={isSaving || !holidayForm.name || !holidayForm.date}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
