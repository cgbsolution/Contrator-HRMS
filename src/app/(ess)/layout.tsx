"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EssSidebar } from "@/components/layout/ess-sidebar";
import { Menu, HardHat } from "lucide-react";

export default function EssLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/30">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <EssSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 h-full" onClick={(e) => e.stopPropagation()}>
            <EssSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center gap-4 px-6 bg-white border-b border-border sticky top-0 z-30">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-green-600">
              <HardHat className="h-4 w-4 text-white" />
            </div>
          </div>
          <h1 className="hidden lg:block text-xl font-semibold text-foreground">Employee Self Service</h1>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground">Employee</p>
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
