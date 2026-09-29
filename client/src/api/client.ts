import { enqueueOfflineRequest } from "./offlineQueue.js";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "WARDEN" | "STAFF" | "ADMIN";
  employeeId?: string | null;
  rollNumber?: string | null;
  phone: string;
  dob?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  bloodGroup?: string | null;
  course?: string | null;
  department?: string | null;
  branch?: string | null;
  year?: number | null;
  semester?: number | null;
  batch?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  fatherName?: string | null;
  fatherPhone?: string | null;
  motherName?: string | null;
  motherPhone?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;
  guardianAddress?: string | null;
  hostelBlock?: string | null;
  roomNumber?: string | null;
  bedNumber?: string | null;
  requestedHostel?: string | null;
  roomPreference?: string | null;
  verificationStatus?: "PENDING_WARDEN_VERIFICATION" | "REJECTED_BY_WARDEN" | "PENDING_ADMIN_APPROVAL" | "REJECTED_BY_ADMIN" | "ACTIVE" | "INACTIVE";
  wardenVerificationDate?: string | null;
  adminApprovalDate?: string | null;
  rejectionReason?: string | null;
  isActive?: boolean;
}

const API_BASE = "";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  offlineFallback?: { label: string; data: any }
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline && options.method && options.method !== "GET" && offlineFallback) {
    await enqueueOfflineRequest(url, options.method as any, offlineFallback.data, offlineFallback.label);
    return {
      _offlineQueued: true,
      message: `Offline mode: ${offlineFallback.label} saved in offline queue. It will submit automatically when reconnected.`
    } as unknown as T;
  }

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err: any) {
    if (!isOnline && options.method && options.method !== "GET" && offlineFallback) {
      await enqueueOfflineRequest(url, options.method as any, offlineFallback.data, offlineFallback.label);
      return {
        _offlineQueued: true,
        message: `Connection lost: ${offlineFallback.label} queued in local storage.`
      } as unknown as T;
    }
    throw err;
  }
}
