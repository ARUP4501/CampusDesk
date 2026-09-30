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
          ? "bg-[#78350F]/20 border-amber-500/30 text-amber-200"
          : "bg-[#064E3B]/20 border-emerald-500/30 text-emerald-200"
      }`}
    >
      <div className="flex items-center space-x-2.5">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" aria-hidden="true" />
        )}
        <span>
          {!isOnline
            ? t("common.offlineNotice", "Network offline. CampusDesk is operating in local queue mode via IndexedDB. Actions will auto-sync when connection resumes.")
            : `Campus network connected. ${queueCount} pending action(s) in local queue ready for synchronization.`}
        </span>
      </div>

      {queueCount > 0 && (
        <div className="flex items-center space-x-2">
          <span className="bg-[#14181C] px-2 py-0.5 border border-[#252B31] text-[11px] font-mono text-[#F3F4F6] rounded-[3px]">
            {t("common.waitingToSend", "Queue")}: {queueCount}
          </span>
          {isOnline && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] text-[11px] font-bold px-2.5 py-1 rounded-[3px] disabled:opacity-50 flex items-center space-x-1 transition-colors"
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
