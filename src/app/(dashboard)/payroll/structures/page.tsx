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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Briefcase, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { payrollApi } from "@/lib/api";
import { toast } from "sonner";

interface SalaryStructure {
  id: string;
  name: string;
  work_category: string;
  basic_percentage: number;
  da_percentage: number;
  hra_percentage: number;
  conveyance_allowance: number;
  special_allowance: number;
  medical_allowance: number;
}

const WORK_CATEGORIES = [
  { value: "unskilled", label: "Unskilled" },
  { value: "semi_skilled", label: "Semi Skilled" },
  { value: "skilled", label: "Skilled" },
  { value: "highly_skilled", label: "Highly Skilled" },
];

const categoryColor: Record<string, string> = {
  unskilled: "bg-gray-100 text-gray-800",
  semi_skilled: "bg-blue-100 text-blue-800",
  skilled: "bg-green-100 text-green-800",
  highly_skilled: "bg-purple-100 text-purple-800",
};

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    work_category: "unskilled",
    basic_percentage: 60,
    da_percentage: 20,
    hra_percentage: 10,
    conveyance_allowance: 0,
    special_allowance: 0,
    medical_allowance: 0,
  });

  const loadStructures = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await payrollApi.salaryStructures();
      setStructures(res.data?.structures ?? res.data ?? []);
    } catch (err) {
      console.error("Failed to load salary structures:", err);
      setError("Failed to load salary structures.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStructures();
  }, [loadStructures]);

  async function handleCreate() {
    setIsSaving(true);
    try {
      await payrollApi.createSalaryStructure(form);
      toast.success(`Structure "${form.name}" created successfully.`);
      setShowAdd(false);
      setForm({
        name: "",
        work_category: "unskilled",
        basic_percentage: 60,
        da_percentage: 20,
        hra_percentage: 10,
        conveyance_allowance: 0,
        special_allowance: 0,
        medical_allowance: 0,
      });
      loadStructures();
    } catch (err) {
      console.error("Failed to create salary structure:", err);
      toast.error("Failed to create salary structure.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">
          Loading salary structures...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={loadStructures} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Salary Structures</h2>
          <p className="text-sm text-muted-foreground">
            {structures.length} structure{structures.length !== 1 ? "s" : ""}{" "}
            configured
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Structure
        </Button>
      </div>

      {/* Structure Cards */}
      {structures.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p>No salary structures configured yet.</p>
            <p className="text-xs mt-1">
              Add your first structure to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map((ss) => {
            const totalPct =
              ss.basic_percentage + ss.da_percentage + ss.hra_percentage;
            return (
              <Card
                key={ss.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {ss.name}
                    </CardTitle>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded capitalize ${
                        categoryColor[ss.work_category] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {(ss.work_category || "").replace(/_/g, " ")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Percentage Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-secondary rounded-md p-2 text-center">
                      <p className="font-semibold text-base">
                        {ss.basic_percentage}%
                      </p>
                      <p className="text-muted-foreground">Basic</p>
                    </div>
                    <div className="bg-secondary rounded-md p-2 text-center">
                      <p className="font-semibold text-base">
                        {ss.da_percentage}%
                      </p>
                      <p className="text-muted-foreground">DA</p>
                    </div>
                    <div className="bg-secondary rounded-md p-2 text-center">
                      <p className="font-semibold text-base">
                        {ss.hra_percentage}%
                      </p>
                      <p className="text-muted-foreground">HRA</p>
                    </div>
                  </div>

                  {/* Percentage bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: `${(ss.basic_percentage / totalPct) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-green-500 h-full"
                      style={{
                        width: `${(ss.da_percentage / totalPct) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{
                        width: `${(ss.hra_percentage / totalPct) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Fixed Allowances */}
                  {(ss.conveyance_allowance > 0 ||
                    ss.special_allowance > 0 ||
                    ss.medical_allowance > 0) && (
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-muted-foreground">
                        Fixed Allowances
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ss.conveyance_allowance > 0 && (
                          <span className="bg-secondary px-2 py-0.5 rounded">
                            Conv: {formatCurrency(ss.conveyance_allowance)}
                          </span>
                        )}
                        {ss.special_allowance > 0 && (
                          <span className="bg-secondary px-2 py-0.5 rounded">
                            Special: {formatCurrency(ss.special_allowance)}
                          </span>
                        )}
                        {ss.medical_allowance > 0 && (
                          <span className="bg-secondary px-2 py-0.5 rounded">
                            Medical: {formatCurrency(ss.medical_allowance)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Compliance tags */}
                  <div className="flex gap-2 pt-1">
                    {["PF", "ESI", "PT"].map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Add Structure Dialog ── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Salary Structure</DialogTitle>
            <DialogDescription>
              Define a new salary structure with component percentages and fixed
              allowances.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Structure Name</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Skilled Worker"
              />
            </div>
            <div>
              <Label>Work Category</Label>
              <Select
                value={form.work_category}
                onValueChange={(v) => setForm({ ...form, work_category: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Basic %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  max={100}
                  value={form.basic_percentage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      basic_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>DA %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  max={100}
                  value={form.da_percentage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      da_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>HRA %</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  max={100}
                  value={form.hra_percentage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hra_percentage: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Conveyance</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  value={form.conveyance_allowance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      conveyance_allowance: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Special</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  value={form.special_allowance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      special_allowance: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Medical</Label>
                <Input
                  type="number"
                  className="mt-1"
                  min={0}
                  value={form.medical_allowance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      medical_allowance: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdd(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving || !form.name}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
