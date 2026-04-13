"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface SettingField {
  key: string;
  label: string;
  defaultValue: string;
  suffix?: string;
}

const FIELDS: SettingField[] = [
  { key: "pf_wage_ceiling", label: "PF Wage Ceiling", defaultValue: "15000", suffix: "INR/month" },
  { key: "pf_employee_rate", label: "PF Employee Rate", defaultValue: "12", suffix: "%" },
  { key: "pf_employer_epf_rate", label: "PF Employer EPF Rate", defaultValue: "3.67", suffix: "%" },
  { key: "pf_employer_eps_rate", label: "PF Employer EPS Rate", defaultValue: "8.33", suffix: "%" },
  { key: "esi_wage_ceiling", label: "ESI Wage Ceiling", defaultValue: "21000", suffix: "INR/month" },
  { key: "esi_employee_rate", label: "ESI Employee Rate", defaultValue: "0.75", suffix: "%" },
  { key: "esi_employer_rate", label: "ESI Employer Rate", defaultValue: "3.25", suffix: "%" },
];

export default function ComplianceConfigPage() {
  const [plantId, setPlantId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSettings() {
    setLoading(true);
    setError(null);
    try {
      // First get plant list to find the default plant
      const plantsRes = await settingsApi.listPlants();
      const plants = plantsRes.data?.data ?? plantsRes.data ?? [];
      const pid = Array.isArray(plants) && plants.length > 0 ? (plants[0] as { id: string }).id : "";
      setPlantId(pid);

      if (pid) {
        const res = await settingsApi.getComplianceSettings(pid);
        const settings = res.data ?? {};
        const vals: Record<string, string> = {};
        for (const field of FIELDS) {
          vals[field.key] = settings[field.key]?.toString() ?? field.defaultValue;
        }
        setValues(vals);
      } else {
        // Use defaults if no plant exists
        const vals: Record<string, string> = {};
        for (const field of FIELDS) {
          vals[field.key] = field.defaultValue;
        }
        setValues(vals);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load compliance settings";
      setError(message);
      // Still populate defaults
      const vals: Record<string, string> = {};
      for (const field of FIELDS) {
        vals[field.key] = field.defaultValue;
      }
      setValues(vals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!plantId) {
      toast.error("No plant configured. Please set up a plant first.");
      return;
    }
    setSaving(true);
    try {
      const settings = FIELDS.map((f) => ({
        key: f.key,
        value: values[f.key] || f.defaultValue,
      }));
      await settingsApi.updateComplianceSettings(plantId, settings);
      toast.success("Compliance settings saved successfully");
    } catch {
      toast.error("Failed to save compliance settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <CardGridSkeleton />;

  if (error && Object.keys(values).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load settings</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchSettings} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-purple-100">
              <ShieldCheck className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <CardTitle className="text-base">Compliance Configuration</CardTitle>
              <CardDescription>Configure PF, ESI rates and ceilings for your plant</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!plantId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 font-medium">No plant configured</p>
              <p className="text-xs text-amber-700 mt-1">
                Please set up a plant in Plant Settings before configuring compliance rates.
              </p>
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-6">
            {/* PF Settings */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Provident Fund (PF)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.filter((f) => f.key.startsWith("pf_")).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={field.key}
                        type="number"
                        step="any"
                        value={values[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                      {field.suffix && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{field.suffix}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ESI Settings */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Employee State Insurance (ESI)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.filter((f) => f.key.startsWith("esi_")).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={field.key}
                        type="number"
                        step="any"
                        value={values[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                      />
                      {field.suffix && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{field.suffix}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving || !plantId} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
