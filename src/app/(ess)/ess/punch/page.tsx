"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Fingerprint,
  MapPin,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { essApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PunchLog {
  id: string;
  punch_type: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  source: string;
}

interface TodayData {
  status: string;
  first_in?: string;
  last_out?: string;
  total_hours?: number;
  logs: PunchLog[];
}

interface DayGroup {
  date: string;
  first_in?: string;
  last_out?: string;
  total_hours?: number;
  logs: PunchLog[];
}

export default function PunchPage() {
  const [time, setTime] = useState(new Date());
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [history, setHistory] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
    error?: string;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Live clock
  useEffect(() => {
    intervalRef.current = setInterval(() => setTime(new Date()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Get location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 0, lng: 0, error: "Geolocation not supported" });
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocLoading(false);
      },
      (err) => {
        setLocation({ lat: 0, lng: 0, error: err.message });
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Load today's data and history
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        essApi.punchToday(),
        essApi.punchHistory(7),
      ]);
      setTodayData(todayRes.data);
      setHistory(historyRes.data || []);
    } catch {
      toast.error("Failed to load punch data");
    } finally {
      setLoading(false);
    }
  }

  async function handlePunch() {
    setPunching(true);
    try {
      const payload: { latitude?: number; longitude?: number; address?: string } = {};
      if (location && !location.error) {
        payload.latitude = location.lat;
        payload.longitude = location.lng;
        payload.address = location.address;
      }
      const res = await essApi.punch(payload);
      toast.success(res.data.message);
      await loadData();
    } catch {
      toast.error("Failed to record punch");
    } finally {
      setPunching(false);
    }
  }

  const isPunchedIn = todayData?.status === "punched_in";
  const isPunchedOut = todayData?.status === "punched_out";
  const isNotPunched = !todayData || todayData.status === "not_punched";

  const timeStr = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const dateStr = time.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm text-muted-foreground">Loading punch data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Live Clock */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6 text-center">
          <p className="text-5xl font-mono font-bold tracking-wider">
            {timeStr.toUpperCase()}
          </p>
          <p className="text-slate-400 mt-2 text-sm">{dateStr}</p>

          {/* Current Status */}
          <div className="mt-4">
            {isPunchedIn && (
              <Badge className="bg-green-600 text-white text-sm px-4 py-1">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Punched In
              </Badge>
            )}
            {isPunchedOut && (
              <Badge className="bg-orange-600 text-white text-sm px-4 py-1">
                <LogOut className="h-4 w-4 mr-1" /> Punched Out
              </Badge>
            )}
            {isNotPunched && (
              <Badge className="bg-slate-600 text-white text-sm px-4 py-1">
                <Clock className="h-4 w-4 mr-1" /> Not Punched
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location + Punch Button */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Location */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {locLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Acquiring location...
                </div>
              ) : location?.error ? (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Location unavailable: {location.error}</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Location acquired</p>
                  <p className="text-xs text-muted-foreground">
                    {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
            {location && !location.error && (
              <Badge variant="outline" className="text-green-600 border-green-300 shrink-0">
                GPS OK
              </Badge>
            )}
          </div>

          {/* Map preview */}
          {location && !location.error && (
            <div className="rounded-lg overflow-hidden border h-[200px]">
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.003},${location.lng + 0.005},${location.lat + 0.003}&layer=mapnik&marker=${location.lat},${location.lng}`}
              />
            </div>
          )}

          {/* Punch Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className={cn(
                "flex-1 gap-2 h-14 text-lg font-semibold",
                (isNotPunched || isPunchedOut)
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-green-600/30 text-green-200 cursor-not-allowed"
              )}
              disabled={punching || isPunchedIn}
              onClick={handlePunch}
            >
              {punching && (isNotPunched || isPunchedOut) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              PUNCH IN
            </Button>
            <Button
              size="lg"
              className={cn(
                "flex-1 gap-2 h-14 text-lg font-semibold",
                isPunchedIn
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-red-600/30 text-red-200 cursor-not-allowed"
              )}
              disabled={punching || !isPunchedIn}
              onClick={handlePunch}
            >
              {punching && isPunchedIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              PUNCH OUT
            </Button>
          </div>

          {/* Remarks */}
          {isPunchedIn && todayData?.first_in && (
            <p className="text-center text-xs text-muted-foreground">
              Your last punch was <strong>IN</strong> at {todayData.first_in}
            </p>
          )}
          {isPunchedOut && todayData?.last_out && (
            <p className="text-center text-xs text-muted-foreground">
              Your last punch was <strong>OUT</strong> at {todayData.last_out}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {todayData && todayData.logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Fingerprint className="h-4 w-4" /> Today&apos;s Punches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground">First In</p>
                <p className="text-sm font-semibold text-green-700">
                  {todayData.first_in || "--:--"}
                </p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Last Out</p>
                <p className="text-sm font-semibold text-red-700">
                  {todayData.last_out || "--:--"}
                </p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-sm font-semibold text-blue-700">
                  {todayData.total_hours != null
                    ? `${todayData.total_hours}h`
                    : "--"}
                </p>
              </div>
            </div>

            {/* Punch log timeline */}
            <div className="space-y-2">
              {todayData.logs.map((log) => {
                const t = new Date(log.timestamp);
                const isIn = log.punch_type === "punch_in";
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-2 rounded-lg border text-sm"
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        isIn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}
                    >
                      {isIn ? (
                        <LogIn className="h-4 w-4" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {isIn ? "Punch In" : "Punch Out"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.source === "biometric" ? "Biometric" : "Web"}{" "}
                        {log.address && `- ${log.address}`}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {t.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      <Card>
        <CardHeader
          className="pb-2 cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" /> Recent History (7 days)
            </span>
            {showHistory ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No punch history found
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((day) => {
                  const d = new Date(day.date + "T00:00:00");
                  return (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-3 rounded-lg border text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {d.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.logs.length} punch(es)
                        </p>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <p className="text-xs text-muted-foreground">In</p>
                          <p className="font-mono text-xs">
                            {day.first_in || "--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Out</p>
                          <p className="font-mono text-xs">
                            {day.last_out || "--"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Hours</p>
                          <p className="font-mono text-xs font-semibold">
                            {day.total_hours != null
                              ? `${day.total_hours}h`
                              : "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
