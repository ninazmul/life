/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { WifiOff, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) =>
          console.log("Life PWA SW registered:", reg.scope),
        )
        .catch((err) =>
          console.log("Life PWA SW registration failed:", err),
        );
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "beforeinstallprompt",
        handleInstallPrompt,
      );
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
      {isOffline && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md"
        >
          <WifiOff
            className="w-4 h-4 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="text-center">
            You are offline. Reconnect to access live secure data and vault
            items.
          </span>
        </div>
      )}

      {showInstallBanner && (
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-950/90 to-slate-900 border-b border-emerald-500/30 text-emerald-100 text-xs z-40 sticky top-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">
              Install Life as a native app for one-touch home screen access
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg gap-1.5"
              aria-label="Install Life as Progressive Web App"
            >
              <Download
                className="w-3.5 h-3.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              Install App
            </Button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-slate-400 hover:text-white text-xs p-1.5 rounded-md hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Dismiss install banner"
            >
              <X
                className="w-4 h-4 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
