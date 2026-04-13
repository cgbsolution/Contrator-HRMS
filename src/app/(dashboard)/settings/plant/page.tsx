"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, RefreshCw, Building2, Save } from "lucide-react";
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface Plant {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pf_establishment_code: string;
  esi_code: string;
}

const EMPTY_FORM = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstin: "",
  pf_establishment_code: "",
  esi_code: "",
};

export default function PlantSetupPage() {
  const [plant, setPlant] = useState<Plant | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPlants() {
    setLoading(true);
    setError(null);
    try {
      const res = await settingsApi.listPlants();
      const plants = res.data?.data ?? res.data ?? [];
      if (Array.isArray(plants) && plants.length > 0) {
        const p = plants[0] as Plant;
        setPlant(p);
        setForm({
          name: p.name || "",
          code: p.code || "",
          address: p.address || "",
          city: p.city || "",
          state: p.state || "",
          pincode: p.pincode || "",
          gstin: p.gstin || "",
          pf_establishment_code: p.pf_establishment_code || "",
          esi_code: p.esi_code || "",
        });
      } else {
        setPlant(null);
        setForm(EMPTY_FORM);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load plant data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlants();
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (plant) {
        await settingsApi.updatePlant(plant.id, form);
        toast.success("Plant updated successfully");
      } else {
        await settingsApi.createPlant(form);
        toast.success("Plant created successfully");
      }
      fetchPlants();
    } catch {
      toast.error(plant ? "Failed to update plant" : "Failed to create plant");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <CardGridSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load plant</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchPlants} variant="outline" className="gap-2">
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
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-100">
              <Building2 className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <CardTitle className="text-base">{plant ? "Update Plant" : "Create Plant"}</CardTitle>
              <CardDescription>
                {plant ? "Edit your plant / factory details" : "Set up your plant / factory"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plant Name</Label>
                <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Plant Code</Label>
                <Input id="code" value={form.code} onChange={(e) => handleChange("code", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(e) => handleChange("state", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" value={form.gstin} onChange={(e) => handleChange("gstin", e.target.value)} placeholder="e.g. 27AAAAA0000A1Z5" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf_establishment_code">PF Establishment Code</Label>
                <Input id="pf_establishment_code" value={form.pf_establishment_code} onChange={(e) => handleChange("pf_establishment_code", e.target.value)} placeholder="e.g. MH/MUM/12345" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="esi_code">ESI Code</Label>
                <Input id="esi_code" value={form.esi_code} onChange={(e) => handleChange("esi_code", e.target.value)} placeholder="e.g. 31-00-123456-000-0001" />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {plant ? "Update Plant" : "Create Plant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
