import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, RefreshCw } from "lucide-react";
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
      className={`px-4 py-2 border-b text-sm font-medium flex items-center justify-between ${
        !isOnline
          ? "bg-amber-100 border-amber-300 text-amber-900"
          : "bg-emerald-50 border-emerald-300 text-emerald-900"
      }`}
    >
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <WifiOff className="w-4 h-4 text-amber-700 flex-shrink-0" aria-hidden="true" />
        ) : (
          <RefreshCw className="w-4 h-4 text-emerald-700 flex-shrink-0" aria-hidden="true" />
        )}
        <span>
          {!isOnline
            ? t("common.offlineNotice", "You are currently offline. Actions will be queued and sent when network returns.")
            : `Network restored. ${queueCount} item(s) pending sync.`}
        </span>
      </div>

      {queueCount > 0 && (
        <div className="flex items-center space-x-2">
          <span className="bg-white px-2 py-0.5 border border-stone-300 text-xs font-semibold rounded-[4px]">
            {t("common.waitingToSend", "Waiting to send")}: {queueCount}
          </span>
          {isOnline && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="bg-emerald-800 text-white text-xs px-2.5 py-1 rounded-[4px] font-medium hover:bg-emerald-900 disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
