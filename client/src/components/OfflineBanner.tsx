import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { getQueuedRequests, flushOfflineQueue } from "../api/offlineQueue.js";

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updateQueueCount = async () => {
    const items = await getQueuedRequests();
    setQueueCount(items.length);
  };

  useEffect(() => {
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateQueueCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(updateQueueCount, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    await flushOfflineQueue();
    await updateQueueCount();
    setIsSyncing(false);
  };

  if (isOnline && queueCount === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`px-4 py-2 border-b text-xs font-medium flex items-center justify-between transition-colors ${
        !isOnline
          ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
          : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
      }`}
    >
      <div className="flex items-center space-x-2.5">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
        )}
        <span>
          {!isOnline
            ? t("common.offlineNotice", "Network offline. CampusDesk is operating in local queue mode via IndexedDB. Actions will auto-sync when connection resumes.")
            : `Campus network connected. ${queueCount} pending action(s) in local queue ready for synchronization.`}
        </span>
      </div>

      {queueCount > 0 && (
        <div className="flex items-center space-x-2">
          <span className="glass-panel px-2.5 py-0.5 text-[11px] font-mono text-campus-text font-bold rounded-lg border border-campus-border">
            {t("common.waitingToSend", "Queue")}: {queueCount}
          </span>
          {isOnline && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="btn-primary text-[11px] font-bold px-3 py-1 rounded-lg disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};


