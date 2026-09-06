/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { WifiOff, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PWAContextType {
  isOffline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  installApp: () => Promise<"accepted" | "dismissed" | "ios_instructions" | "unsupported">;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
}

const PWAContext = createContext<PWAContextType>({
  isOffline: false,
  isInstalled: false,
  isInstallable: false,
  isIOS: false,
  installApp: async () => "unsupported",
  showInstallBanner: false,
  setShowInstallBanner: () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

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

    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsInstalled(Boolean(isStandalone));
    };
    checkStandalone();

    // Detect iOS
    const isIOSDevice =
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    setIsIOS(Boolean(isIOSDevice));

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
      // Only show top banner if not already installed
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallBanner(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<"accepted" | "dismissed" | "ios_instructions" | "unsupported"> => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setInstallPrompt(null);
        setShowInstallBanner(false);
        return "accepted";
      }
      return "dismissed";
    }

    if (isIOS) {
      return "ios_instructions";
    }

    return "unsupported";
  }, [installPrompt, isIOS]);

  const handleBannerInstallClick = async () => {
    await installApp();
  };

  const isInstallable = Boolean(installPrompt) || (isIOS && !isInstalled);

  return (
    <PWAContext.Provider
      value={{
        isOffline,
        isInstalled,
        isInstallable,
        isIOS,
        installApp,
        showInstallBanner,
        setShowInstallBanner,
      }}
    >
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

      {showInstallBanner && !isInstalled && (
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
              onClick={handleBannerInstallClick}
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
    </PWAContext.Provider>
  );
}
