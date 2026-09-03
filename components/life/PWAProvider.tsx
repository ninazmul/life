/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { WifiOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Life PWA SW registered:", reg.scope))
        .catch((err) => console.log("Life PWA SW registration failed:", err));
    }

    // 2. Connectivity Listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // 3. BeforeInstallPrompt Listener
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are offline. Reconnect to access live secure data and vault items.</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-950/90 to-slate-900 border-b border-emerald-500/30 text-emerald-100 text-xs z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Install Life as a native app for one-touch home screen access</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </Button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
