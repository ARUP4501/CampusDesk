import React, { useState, useEffect, useMemo } from "react";
import {
  Bus,
  Car,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Search,
  Plus,
  Compass,
  ChevronRight,
  Info,
  X,
  Edit2,
  Trash2,
  Users,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Navigation,
  Calendar
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

// --- TYPES ---
export interface BusItem {
  id: string;
  busNumber: string;
  vehicleNumber: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  status: "ACTIVE" | "INACTIVE";
  routes?: { id: string; routeNumber: string; routeName: string; status: string }[];
}

export interface RouteStopItem {
  id: string;
  routeId: string;
  stopName: string;
  location?: string | null;
  pickupTime: string;
  dropTime?: string | null;
  stopOrder: number;
}

export interface BusRouteItem {
  id: string;
  routeNumber: string;
  routeName: string;
  description?: string | null;
  startPoint: string;
  destination: string;
  status: "ACTIVE" | "INACTIVE";
  delayStatus: "ON_TIME" | "DELAYED" | "CANCELLED";
  delayNotice?: string | null;
  busId?: string | null;
  bus?: BusItem | null;
  stops: RouteStopItem[];
}

export interface ParkingZone {
  id: string;
  name: string;
  vehicleType?: string;
  totalSlots: number;
  occupiedSlots: number;
  status: string;
  notice?: string;
  category?: string;
  totalCapacity?: number;
  occupied?: number;
  notes?: string;
}

export interface TransportOverview {
  totalBuses: number;
  activeBuses: number;
  inactiveBuses: number;
  totalRoutes: number;
  activeRoutes: number;
  inactiveRoutes: number;
  totalStops: number;
}

export const TransportPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const isAdmin = user?.role === "ADMIN";

  // Data States
  const [overview, setOverview] = useState<TransportOverview | null>(null);
  const [routes, setRoutes] = useState<BusRouteItem[]>([]);
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active view tabs: 'routes' | 'buses' | 'parking'
  const [activeTab, setActiveTab] = useState<"routes" | "buses" | "parking">("routes");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Route detail selection (for student detail view & preview)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Status/Toast notification
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // --- ADMIN MODALS STATE ---
  // Bus modal
  const [busModalOpen, setBusModalOpen] = useState<boolean>(false);
  const [editingBus, setEditingBus] = useState<BusItem | null>(null);
  const [busForm, setBusForm] = useState({
    busNumber: "",
    vehicleNumber: "",
    capacity: 50,
    driverName: "",
    driverPhone: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE"
  });

  // Route modal
  const [routeModalOpen, setRouteModalOpen] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<BusRouteItem | null>(null);
  const [routeForm, setRouteForm] = useState({
    routeNumber: "",
    routeName: "",
    description: "",
    startPoint: "",
    destination: "",
    busId: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE"
  });

  // Assign Bus modal
  const [assignBusModalOpen, setAssignBusModalOpen] = useState<boolean>(false);
  const [assigningRoute, setAssigningRoute] = useState<BusRouteItem | null>(null);
  const [selectedBusIdForAssign, setSelectedBusIdForAssign] = useState<string>("");

  // Manage Stops modal
  const [stopsModalOpen, setStopsModalOpen] = useState<boolean>(false);
  const [stopsRoute, setStopsRoute] = useState<BusRouteItem | null>(null);
  const [editingStop, setEditingStop] = useState<RouteStopItem | null>(null);
  const [stopForm, setStopForm] = useState({
    stopName: "",
    location: "",
    pickupTime: "07:30 AM",
    dropTime: "05:15 PM",
    stopOrder: 1
  });

  // Delay / Live Notice broadcast modal
  const [delayModalOpen, setDelayModalOpen] = useState<boolean>(false);
  const [delayRoute, setDelayRoute] = useState<BusRouteItem | null>(null);
  const [delayStatus, setDelayStatus] = useState<string>("ON_TIME");
  const [delayNotice, setDelayNotice] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Helper Toast trigger
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, routesRes, busesRes, parkingRes] = await Promise.allSettled([
        apiRequest<{ overview: TransportOverview }>("/api/transport/overview"),
        apiRequest<{ routes: BusRouteItem[] }>("/api/transport/routes"),
        apiRequest<{ buses: BusItem[] }>("/api/transport/buses"),
        apiRequest<{ parkingLots: ParkingZone[] }>("/api/transport/parking")
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value?.overview) {
        setOverview(overviewRes.value.overview);
      }
      if (routesRes.status === "fulfilled" && routesRes.value?.routes) {
        setRoutes(routesRes.value.routes);
        if (!selectedRouteId && routesRes.value.routes.length > 0) {
          setSelectedRouteId(routesRes.value.routes[0].id);
        }
      }
      if (busesRes.status === "fulfilled" && busesRes.value?.buses) {
        setBuses(busesRes.value.buses);
      }
      if (parkingRes.status === "fulfilled") {
        const val = parkingRes.value as any;
        const lots = val?.parkingLots || val?.parkingZones;
        if (Array.isArray(lots)) {
          setParkingLots(lots);
        }
      }
    } catch (err: any) {
      console.error("Failed to load transport coordinates:", err);
      showToast("Failed to sync transport data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered views
  const filteredRoutes = useMemo(() => {
    if (!searchQuery) return routes;
    const q = searchQuery.toLowerCase();
    return routes.filter(
      (r) =>
        r.routeNumber.toLowerCase().includes(q) ||
        r.routeName.toLowerCase().includes(q) ||
        r.startPoint.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.stops?.some((s) => s.stopName.toLowerCase().includes(q))
    );
  }, [routes, searchQuery]);

  const filteredBuses = useMemo(() => {
    if (!searchQuery) return buses;
    const q = searchQuery.toLowerCase();
    return buses.filter(
      (b) =>
        b.busNumber.toLowerCase().includes(q) ||
        b.vehicleNumber.toLowerCase().includes(q) ||
        b.driverName.toLowerCase().includes(q)
    );
  }, [buses, searchQuery]);

  const currentRouteDetail = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0] || null;
  }, [routes, selectedRouteId]);

  // --- ADMIN ACTIONS HANDLERS ---
  // Bus Management
  const handleOpenBusModal = (bus?: BusItem) => {
    if (bus) {
      setEditingBus(bus);
      setBusForm({
        busNumber: bus.busNumber,
        vehicleNumber: bus.vehicleNumber,
        capacity: bus.capacity,
        driverName: bus.driverName,
        driverPhone: bus.driverPhone,
        status: bus.status
      });
    } else {
      setEditingBus(null);
      setBusForm({
        busNumber: "",
        vehicleNumber: "",
        capacity: 50,
        driverName: "",
        driverPhone: "",
        status: "ACTIVE"
      });
    }
    setBusModalOpen(true);
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingBus) {
        await apiRequest(`/api/transport/buses/${editingBus.id}`, {
          method: "PUT",
          body: JSON.stringify(busForm)
        });
        showToast(`Bus ${busForm.busNumber} updated successfully.`);
      } else {
        await apiRequest("/api/transport/buses", {
          method: "POST",
          body: JSON.stringify(busForm)
        });
        showToast(`Bus ${busForm.busNumber} added to fleet.`);
      }
      setBusModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save bus", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBus = async (bus: BusItem) => {
    if (!window.confirm(`Are you sure you want to delete bus ${bus.busNumber}?`)) return;
    try {
      await apiRequest(`/api/transport/buses/${bus.id}`, { method: "DELETE" });
      showToast(`Bus ${bus.busNumber} removed.`);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete bus", "error");
    }
  };

  // Route Management
  const handleOpenRouteModal = (route?: BusRouteItem) => {
    if (route) {
      setEditingRoute(route);
      setRouteForm({
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        description: route.description || "",
        startPoint: route.startPoint,
        destination: route.destination,
        busId: route.busId || "",
        status: route.status
      });
    } else {
      setEditingRoute(null);
      setRouteForm({
        routeNumber: "",
        routeName: "",
        description: "",
        startPoint: "",
        destination: "",
        busId: "",
        status: "ACTIVE"
      });
    }
    setRouteModalOpen(true);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingRoute) {
        await apiRequest(`/api/transport/routes/${editingRoute.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...routeForm,
            busId: routeForm.busId ? routeForm.busId : null
          })
        });
        showToast(`Route ${routeForm.routeNumber} updated.`);
      } else {
        await apiRequest("/api/transport/routes", {
          method: "POST",
          body: JSON.stringify({
            ...routeForm,
            busId: routeForm.busId ? routeForm.busId : null
          })
        });
        showToast(`Route ${routeForm.routeNumber} created.`);
      }
      setRouteModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save route", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoute = async (route: BusRouteItem) => {
    if (!window.confirm(`Are you sure you want to delete route ${route.routeNumber}?`)) return;
    try {
      await apiRequest(`/api/transport/routes/${route.id}`, { method: "DELETE" });
      showToast(`Route ${route.routeNumber} removed.`);
      if (selectedRouteId === route.id) setSelectedRouteId(null);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete route", "error");
    }
  };

  // Bus Assignment
  const handleOpenAssignModal = (route: BusRouteItem) => {
    setAssigningRoute(route);
    setSelectedBusIdForAssign(route.busId || "");
    setAssignBusModalOpen(true);
  };

  const handleSaveAssignBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningRoute) return;
    try {
      setSubmitting(true);
      await apiRequest(`/api/transport/routes/${assigningRoute.id}/assign-bus`, {
        method: "PATCH",
        body: JSON.stringify({ busId: selectedBusIdForAssign ? selectedBusIdForAssign : null })
      });
      showToast("Bus assignment updated successfully!");
      setAssignBusModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to assign bus", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Stops Management
  const handleOpenStopsModal = (route: BusRouteItem) => {
    setStopsRoute(route);
    setEditingStop(null);
    const nextOrder = route.stops && route.stops.length > 0 ? Math.max(...route.stops.map((s) => s.stopOrder)) + 1 : 1;
    setStopForm({
      stopName: "",
      location: "",
      pickupTime: "07:30 AM",
      dropTime: "05:15 PM",
      stopOrder: nextOrder
    });
    setStopsModalOpen(true);
  };

  const handleStartEditStop = (stop: RouteStopItem) => {
    setEditingStop(stop);
    setStopForm({
      stopName: stop.stopName,
      location: stop.location || "",
      pickupTime: stop.pickupTime,
      dropTime: stop.dropTime || "",
      stopOrder: stop.stopOrder
    });
  };

  const handleCancelEditStop = () => {
    setEditingStop(null);
    if (!stopsRoute) return;
    const nextOrder = stopsRoute.stops && stopsRoute.stops.length > 0 ? Math.max(...stopsRoute.stops.map((s) => s.stopOrder)) + 1 : 1;
    setStopForm({
      stopName: "",
      location: "",
      pickupTime: "07:30 AM",
      dropTime: "05:15 PM",
      stopOrder: nextOrder
    });
  };

  const handleSaveStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopsRoute) return;
    try {
      setSubmitting(true);
      if (editingStop) {
        await apiRequest(`/api/transport/stops/${editingStop.id}`, {
          method: "PUT",
          body: JSON.stringify(stopForm)
        });
        showToast(`Stop "${stopForm.stopName}" updated.`);
      } else {
        await apiRequest(`/api/transport/routes/${stopsRoute.id}/stops`, {
          method: "POST",
          body: JSON.stringify(stopForm)
        });
        showToast(`Stop "${stopForm.stopName}" added.`);
      }
      const res = await apiRequest<{ route: BusRouteItem }>(`/api/transport/routes/${stopsRoute.id}`);
      if (res?.route) {
        setStopsRoute(res.route);
      }
      handleCancelEditStop();
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save stop", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStop = async (stopId: string, stopName: string) => {
    if (!window.confirm(`Delete stop "${stopName}"?`)) return;
    try {
      await apiRequest(`/api/transport/stops/${stopId}`, { method: "DELETE" });
      showToast(`Stop "${stopName}" deleted.`);
      if (stopsRoute) {
        const res = await apiRequest<{ route: BusRouteItem }>(`/api/transport/routes/${stopsRoute.id}`);
        if (res?.route) setStopsRoute(res.route);
      }
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete stop", "error");
    }
  };

  // Delay / Live Notice Broadcast
  const handleOpenDelayModal = (route: BusRouteItem) => {
    setDelayRoute(route);
    setDelayStatus(route.delayStatus || "ON_TIME");
    setDelayNotice(route.delayNotice || "");
    setDelayModalOpen(true);
  };

  const handleSaveDelayStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayRoute) return;
    try {
      setSubmitting(true);
      await apiRequest(`/api/transport/routes/${delayRoute.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: delayStatus, delayNotice })
      });
      showToast("Route operational status and live notice broadcasted!");
      setDelayModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Broadcast failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner — Campus OS Editorial */}
      <div className="campus-panel border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="editorial-eyebrow">05 // TRANSIT & MOBILITY</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE MONITORING
              </span>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ADMIN DISPATCH
                </span>
              )}
            </div>

            <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">
              Campus Transit & Spatial Fleet Grid
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Official university shuttle routes, scheduled sequential bus stops, morning pickup & drop timings, live delay broadcasts, and campus parking bays.
            </p>
          </div>

          {/* Quick Stats Metric Blocks — Hairline Editorial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)] text-center min-w-[90px]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                {isAdmin ? "Total Fleet" : "Active Fleet"}
              </span>
              <span className="text-xl font-bold text-[var(--text-primary)] font-mono">
                {isAdmin ? overview?.totalBuses ?? buses.length : overview?.activeBuses ?? buses.filter((b) => b.status === "ACTIVE").length}
              </span>
            </div>

            <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)] text-center min-w-[90px]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">
                {isAdmin ? "Total Routes" : "Active Routes"}
              </span>
              <span className="text-xl font-bold text-[var(--text-primary)] font-mono">
                {isAdmin ? overview?.totalRoutes ?? routes.length : overview?.activeRoutes ?? routes.filter((r) => r.status === "ACTIVE").length}
              </span>
            </div>

            <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)] text-center min-w-[90px]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Waypoints</span>
              <span className="text-xl font-bold text-[var(--text-primary)] font-mono">
                {overview?.totalStops ?? routes.reduce((acc, r) => acc + (r.stops?.length || 0), 0)}
              </span>
            </div>

            <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)] text-center min-w-[90px]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block">Parking Bays</span>
              <span className="text-xl font-bold text-[var(--text-primary)] font-mono">{parkingLots.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toast / Status Alert */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 3. Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 ${
              activeTab === "routes"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <Bus className={`w-3.5 h-3.5 ${activeTab === "routes" ? "text-[#FF6D1F]" : ""}`} />
            <span>01 BUS ROUTES ({routes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("buses")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 ${
              activeTab === "buses"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === "buses" ? "text-[#FF6D1F]" : ""}`} />
            <span>02 FLEET ({buses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("parking")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 ${
              activeTab === "parking"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <Car className={`w-3.5 h-3.5 ${activeTab === "parking" ? "text-[#FF6D1F]" : ""}`} />
            <span>03 PARKING ({parkingLots.length})</span>
          </button>
        </div>

        {/* Action Controls & Search Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                activeTab === "buses"
                  ? "Search bus #, vehicle, driver..."
                  : "Search route code, stop, terminal..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* ADMIN ONLY Action Buttons */}
          {isAdmin && activeTab === "routes" && (
            <button
              onClick={() => handleOpenRouteModal()}
              className="btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Route</span>
            </button>
          )}

          {isAdmin && activeTab === "buses" && (
            <button
              onClick={() => handleOpenBusModal()}
              className="btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Bus</span>
            </button>
          )}

          <button
            onClick={fetchAllData}
            title="Refresh transport data"
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#FF6D1F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">Syncing campus transit coordinates & fleet data...</p>
        </div>
      ) : activeTab === "routes" ? (
        /* ======================================================== */
        /* ROUTES TAB: Route List -> Detailed Route Stop Timeline   */
        /* ======================================================== */
        filteredRoutes.length === 0 ? (
          <div className="p-12 text-center campus-panel rounded-2xl border border-[var(--border-subtle)] space-y-3">
            <Bus className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No Bus Routes Found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {searchQuery ? "No routes match your search criteria. Try a different keyword." : "No bus routes are currently registered in the system."}
            </p>
            {isAdmin && !searchQuery && (
              <button onClick={() => handleOpenRouteModal()} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold mt-2">
                Create First Bus Route
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Route List Cards (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1 font-mono">
                <span className="text-[11px] uppercase tracking-wider">
                  Available Corridors ({filteredRoutes.length})
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">Select corridor to view stops</span>
              </div>

              <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {filteredRoutes.map((route) => {
                  const isSelected = route.id === currentRouteDetail?.id;
                  const isDelayed = route.delayStatus === "DELAYED";
                  const isCancelled = route.delayStatus === "CANCELLED";

                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border text-left ${
                        isSelected
                          ? "bg-[var(--bg-elevated)] border-[#FF6D1F] shadow-sm"
                          : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[#FF6D1F]/30 hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-lg border ${isSelected ? "bg-[#FF6D1F] text-[#141414] border-[#FF6D1F]" : "bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)]"}`}>
                            <Bus className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono font-bold text-[#FF6D1F]">{route.routeNumber}</span>
                              {route.status === "INACTIVE" && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/25 font-bold">
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-xs text-[var(--text-primary)] leading-tight">{route.routeName}</h3>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shrink-0 ${
                            isCancelled
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                              : isDelayed
                              ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/25"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          }`}
                        >
                          {route.delayStatus || "ON_TIME"}
                        </span>
                      </div>

                      {/* Origin -> Destination summary */}
                      <div className="mt-3 flex items-center text-xs text-[var(--text-secondary)] gap-1.5 font-mono">
                        <MapPin className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                        <span className="truncate max-w-[120px]">{route.startPoint}</span>
                        <ArrowRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                        <span className="truncate max-w-[120px] text-[var(--text-primary)] font-medium">{route.destination}</span>
                      </div>

                      {/* Assigned Bus & Stops count badge */}
                      <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[var(--text-muted)]">Bus:</span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {route.bus ? route.bus.busNumber : "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-[#FF6D1F]">{route.stops?.length || 0}</span>
                          <span className="text-[var(--text-muted)]">Waypoints</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-[#FF6D1F] translate-x-0.5" : "text-[var(--text-muted)]"}`} />
                        </div>
                      </div>

                      {/* Live Notice indicator */}
                      {route.delayNotice && (
                        <div className="mt-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-300 px-2.5 py-1 rounded-lg text-[10px] flex items-center space-x-1 font-medium truncate">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{route.delayNotice}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Route Full Details & Spatial Stops Flow (Section 26) */}
            <div className="lg:col-span-7">
              {currentRouteDetail ? (
                <div className="campus-panel rounded-2xl p-5 sm:p-7 border border-[var(--border-subtle)] space-y-6">
                  {/* Detail Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[var(--bg-input)] text-[#FF6D1F] border border-[var(--border-subtle)]">
                          {currentRouteDetail.routeNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            currentRouteDetail.delayStatus === "DELAYED"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : currentRouteDetail.delayStatus === "CANCELLED"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {currentRouteDetail.delayStatus || "ON_TIME"}
                        </span>
                        {currentRouteDetail.status === "INACTIVE" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            INACTIVE ROUTE
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-2 font-display">
                        {currentRouteDetail.routeName}
                      </h2>
                      {currentRouteDetail.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{currentRouteDetail.description}</p>
                      )}
                    </div>

                    {/* ADMIN ONLY management buttons for this route */}
                    {isAdmin && (
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenStopsModal(currentRouteDetail)}
                          title="Manage route stops"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[#FF6D1F] flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-[#FF6D1F]" />
                          <span>Stops</span>
                        </button>

                        <button
                          onClick={() => handleOpenAssignModal(currentRouteDetail)}
                          title="Assign bus to route"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[#FF6D1F] flex items-center gap-1"
                        >
                          <Bus className="w-3 h-3 text-[#FF6D1F]" />
                          <span>Bus</span>
                        </button>

                        <button
                          onClick={() => handleOpenDelayModal(currentRouteDetail)}
                          title="Broadcast delay or live notice"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--bg-elevated)] text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/10 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Status</span>
                        </button>

                        <button
                          onClick={() => handleOpenRouteModal(currentRouteDetail)}
                          title="Edit route metadata"
                          className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteRoute(currentRouteDetail)}
                          title="Delete route safely"
                          className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Delay / Live Notice Alert */}
                  {currentRouteDetail.delayNotice && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-xs flex items-start space-x-2.5 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="block text-amber-800 dark:text-amber-200 font-bold uppercase text-[10px] font-mono tracking-wider">
                          Transit Operational Update:
                        </strong>
                        <span className="text-amber-900 dark:text-amber-100 text-xs leading-relaxed">
                          {currentRouteDetail.delayNotice}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Route Key Details Grid: Origin/Destination & Bus/Driver */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Origin & Destination Card */}
                    <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-3">
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                        <Compass className="w-3.5 h-3.5 text-[#FF6D1F]" />
                        <span>Transit Corridor</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-start space-x-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                          <div>
                            <span className="text-[var(--text-muted)] text-[10px] block font-mono">ORIGIN</span>
                            <strong className="text-[var(--text-primary)] text-xs font-semibold">
                              {currentRouteDetail.startPoint}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2 pt-1 border-t border-[var(--border-subtle)]">
                          <div className="w-2 h-2 rounded-full bg-[#FF6D1F] mt-1 shrink-0"></div>
                          <div>
                            <span className="text-[var(--text-muted)] text-[10px] block font-mono">DESTINATION</span>
                            <strong className="text-[var(--text-primary)] text-xs font-semibold">
                              {currentRouteDetail.destination}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Bus & Driver Card */}
                    <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-3">
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                        <Bus className="w-3.5 h-3.5 text-[#FF6D1F]" />
                        <span>Assigned Vehicle & Crew</span>
                      </div>

                      {currentRouteDetail.bus ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] font-mono text-[11px]">Bus ID:</span>
                            <span className="font-bold text-[var(--text-primary)] font-mono">
                              {currentRouteDetail.bus.busNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] font-mono text-[11px]">Registration:</span>
                            <span className="font-mono text-[var(--text-secondary)]">
                              {currentRouteDetail.bus.vehicleNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-muted)] font-mono text-[11px]">Seating:</span>
                            <span className="font-mono text-[var(--text-secondary)]">
                              {currentRouteDetail.bus.capacity} seats
                            </span>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                            <div>
                              <span className="text-[var(--text-muted)] text-[10px] block font-mono">DRIVER</span>
                              <strong className="text-[var(--text-primary)] text-xs font-medium">
                                {currentRouteDetail.bus.driverName}
                              </strong>
                            </div>
                            {currentRouteDetail.bus.driverPhone && (
                              <a
                                href={`tel:${currentRouteDetail.bus.driverPhone}`}
                                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[var(--bg-elevated)] text-[#FF6D1F] border border-[var(--border-subtle)] hover:border-[#FF6D1F] flex items-center space-x-1 transition-all"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{currentRouteDetail.bus.driverPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-[var(--text-muted)] space-y-1">
                          <p>No bus currently assigned to this route.</p>
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenAssignModal(currentRouteDetail)}
                              className="text-[#FF6D1F] hover:underline text-xs font-mono font-semibold"
                            >
                              + Assign Vehicle Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 26: Spatial Route Flow Visualization */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-[#FF6D1F]" />
                        <h3 className="font-bold text-sm text-[var(--text-primary)] font-mono uppercase tracking-wider">
                          Transit Corridor Stops ({currentRouteDetail.stops?.length || 0})
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">Sequential waypoint trajectory</span>
                    </div>

                    {!currentRouteDetail.stops || currentRouteDetail.stops.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-2">
                        <MapPin className="w-6 h-6 text-[var(--text-muted)] mx-auto opacity-40" />
                        <p>No sequential stops registered for this route yet.</p>
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenStopsModal(currentRouteDetail)}
                            className="btn-primary px-3 py-1.5 rounded-xl text-xs font-bold"
                          >
                            Add Stops Now
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Spatial Vertical Corridor Sequence: HOSTEL ↓ MAIN GATE ↓ ACADEMIC BLOCK */
                      <div className="space-y-1">
                        {currentRouteDetail.stops.map((stop, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === (currentRouteDetail.stops?.length || 0) - 1;

                          return (
                            <React.Fragment key={stop.id || idx}>
                              <div className="p-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)] transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[#FF6D1F] flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                                    {stop.stopOrder || idx + 1}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] font-mono">
                                        {stop.stopName}
                                      </h4>
                                      {isFirst && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                          START
                                        </span>
                                      )}
                                      {isLast && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/25">
                                          TERMINUS
                                        </span>
                                      )}
                                    </div>
                                    {stop.location && (
                                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                                        <span>{stop.location}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Timings Badges */}
                                <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                                  <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] text-[var(--text-muted)]">Pickup:</span>
                                    <strong className="font-bold">{stop.pickupTime}</strong>
                                  </div>

                                  {stop.dropTime && (
                                    <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-sky-500" />
                                      <span className="text-[10px] text-[var(--text-muted)]">Drop:</span>
                                      <strong className="font-bold">{stop.dropTime}</strong>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Spatial Connector Arrow (unless last) */}
                              {!isLast && (
                                <div className="flex items-center pl-7 py-0.5">
                                  <div className="flex items-center space-x-1.5 text-[var(--text-muted)]">
                                    <ArrowDown className="w-3.5 h-3.5 text-[#FF6D1F]/60" />
                                    <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] opacity-60">── transit ──</span>
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center campus-panel rounded-2xl border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
                  Select a corridor from the list to view its complete timetable and waypoint itinerary.
                </div>
              )}
            </div>
          </div>
        )
      ) : activeTab === "buses" ? (
        /* ======================================================== */
        /* FLEET TAB: All Buses Cards / Table (Admin & Read-Only)   */
        /* ======================================================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {isAdmin ? "University Fleet Vehicle Management" : "Campus Transit Buses"} ({filteredBuses.length})
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {isAdmin ? "Admin authority: Add, edit driver info, assign routes, or retire bus" : "Active verified campus shuttles"}
            </span>
          </div>

          {filteredBuses.length === 0 ? (
            <div className="p-12 text-center campus-panel rounded-2xl border border-[var(--border-subtle)] space-y-3">
              <Bus className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No Buses Found</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {searchQuery ? "No fleet vehicles match your query." : "No university buses currently recorded."}
              </p>
              {isAdmin && (
                <button onClick={() => handleOpenBusModal()} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold mt-2">
                  Add New Bus
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBuses.map((bus) => (
                <div
                  key={bus.id}
                  className="p-5 rounded-2xl campus-panel flex flex-col justify-between space-y-4 border border-[var(--border-subtle)] hover:border-[var(--text-muted)] transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[#FF6D1F]">
                          <Bus className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-[#FF6D1F]">{bus.busNumber}</span>
                          </div>
                          <h3 className="font-mono text-xs text-[var(--text-primary)]">{bus.vehicleNumber}</h3>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          bus.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                        }`}
                      >
                        {bus.status}
                      </span>
                    </div>

                    {/* Bus Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Capacity</span>
                        <strong className="text-[var(--text-primary)] text-sm">{bus.capacity} seats</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Routes</span>
                        <strong className="text-[var(--text-primary)] text-sm">
                          {bus.routes ? bus.routes.length : 0}
                        </strong>
                      </div>
                    </div>

                    {/* Driver details */}
                    <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase">Driver</span>
                        <span className="font-medium text-[var(--text-primary)]">{bus.driverName}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
                        <span className="text-[var(--text-muted)] text-[10px] font-mono uppercase">Contact</span>
                        {bus.driverPhone ? (
                          <a
                            href={`tel:${bus.driverPhone}`}
                            className="font-mono text-[#FF6D1F] hover:underline flex items-center gap-1 font-bold text-xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{bus.driverPhone}</span>
                          </a>
                        ) : (
                          <span className="text-[var(--text-muted)] font-mono text-[11px]">N/A</span>
                        )}
                      </div>
                    </div>

                    {/* Assigned route names if any */}
                    {bus.routes && bus.routes.length > 0 && (
                      <div className="space-y-1 text-[11px] font-mono">
                        <span className="text-[var(--text-muted)] block text-[10px] uppercase">Assigned Routes:</span>
                        <div className="flex flex-wrap gap-1">
                          {bus.routes.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px]"
                            >
                              {r.routeNumber}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ADMIN Controls */}
                  {isAdmin && (
                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenBusModal(bus)}
                        className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBus(bus)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* PARKING TAB: Preserved campus parking zones and spots    */
        /* ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parkingLots.map((lot) => {
            const total = lot.totalCapacity || lot.totalSlots || 0;
            const occupied = lot.occupied || lot.occupiedSlots || 0;
            const available = Math.max(0, total - occupied);
            const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
            const isFull = available === 0;

            return (
              <div
                key={lot.id}
                className="p-5 rounded-2xl campus-panel flex flex-col justify-between space-y-4 border border-[var(--border-subtle)] hover:border-[var(--text-muted)] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-input)] text-[#FF6D1F] border border-[var(--border-subtle)]">
                      {lot.category || lot.vehicleType || "VEHICLE PARKING"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isFull
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                      }`}
                    >
                      {isFull ? "FULL" : "SPOTS AVAILABLE"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)] font-mono">{lot.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{lot.notes || lot.notice || "Designated campus parking bay."}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[var(--text-muted)]">Occupancy ({occupancyPct}%)</span>
                      <span className="font-bold text-[var(--text-primary)] font-mono">{occupied} / {total}</span>
                    </div>
                    <div className="w-full bg-[var(--bg-input)] rounded-full h-2 overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occupancyPct > 90 ? "bg-rose-500" : occupancyPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Vacant Bays:</span>
                  <span className="font-bold text-[#FF6D1F] text-sm">{available} Bays</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */
      /* ADMIN MODALS (Strictly rendered only when isAdmin === true) */
      /* ======================================================== */}
      {isAdmin && (
        <>
          {/* A. ADD / EDIT BUS MODAL */}
          {busModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="campus-panel rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-[var(--border-subtle)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                      {editingBus ? "Edit Fleet Vehicle" : "Add New Fleet Bus"}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">Configure bus identification, vehicle number, driver contact, and status.</p>
                  </div>
                  <button onClick={() => setBusModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveBus} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Bus Identifier *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BUS-04"
                        value={busForm.busNumber}
                        onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Vehicle Number (Plate) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. OD-02-AX-8899"
                        value={busForm.vehicleNumber}
                        onChange={(e) => setBusForm({ ...busForm, vehicleNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Passenger Capacity *</label>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        required
                        value={busForm.capacity}
                        onChange={(e) => setBusForm({ ...busForm, capacity: parseInt(e.target.value) || 50 })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Operational Status *</label>
                      <select
                        value={busForm.status}
                        onChange={(e) => setBusForm({ ...busForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                      >
                        <option value="ACTIVE">ACTIVE (In Service)</option>
                        <option value="INACTIVE">INACTIVE (Maintenance / Standby)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Driver Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Nayak"
                        value={busForm.driverName}
                        onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Driver Contact *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={busForm.driverPhone}
                        onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setBusModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingBus ? "Update Bus" : "Save Bus"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* B. ADD / EDIT ROUTE MODAL */}
          {routeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="campus-panel rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-[var(--border-subtle)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                      {editingRoute ? "Edit Bus Route" : "Create New Bus Route"}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">Define route number, start point, destination corridor, and assigned bus.</p>
                  </div>
                  <button onClick={() => setRouteModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveRoute} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Route Code / Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Route 4"
                        value={routeForm.routeNumber}
                        onChange={(e) => setRouteForm({ ...routeForm, routeNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Status *</label>
                      <select
                        value={routeForm.status}
                        onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Route Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master Canteen - Rasulgarh - Campus"
                      value={routeForm.routeName}
                      onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Starting Point *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master Canteen Square"
                        value={routeForm.startPoint}
                        onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Destination *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Campus Main Gate"
                        value={routeForm.destination}
                        onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Assigned Fleet Bus (Optional)</label>
                    <select
                      value={routeForm.busId}
                      onChange={(e) => setRouteForm({ ...routeForm, busId: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                    >
                      <option value="">-- No Bus Assigned --</option>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.busNumber} ({b.vehicleNumber}) - Driver: {b.driverName} [{b.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Description / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Covers major residential areas along NH-16."
                      value={routeForm.description}
                      onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setRouteModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingRoute ? "Update Route" : "Save Route"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* C. ASSIGN BUS TO ROUTE MODAL */}
          {assignBusModalOpen && assigningRoute && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="campus-panel rounded-2xl max-w-md w-full p-6 space-y-4 border border-[var(--border-subtle)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Assign Bus to Route</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{assigningRoute.routeNumber}: {assigningRoute.routeName}</p>
                  </div>
                  <button onClick={() => setAssignBusModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveAssignBus} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Select Fleet Vehicle</label>
                    <select
                      value={selectedBusIdForAssign}
                      onChange={(e) => setSelectedBusIdForAssign(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                    >
                      <option value="">-- No Bus Assigned (Unlink) --</option>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.busNumber} ({b.vehicleNumber}) - Driver: {b.driverName} ({b.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setAssignBusModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save Assignment</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* D. MANAGE STOPS MODAL */}
          {stopsModalOpen && stopsRoute && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="campus-panel rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto border border-[var(--border-subtle)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">
                      Manage Waypoint Stops: {stopsRoute.routeNumber}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">{stopsRoute.routeName} ({stopsRoute.startPoint} → {stopsRoute.destination})</p>
                  </div>
                  <button onClick={() => setStopsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Existing stops table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase block">
                    Current Stops List ({stopsRoute.stops?.length || 0})
                  </span>

                  {!stopsRoute.stops || stopsRoute.stops.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-[var(--bg-input)] border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                      No stops added yet. Use the form below to add the first stop.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {stopsRoute.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-6 h-6 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[#FF6D1F] flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                              {stop.stopOrder}
                            </span>
                            <div>
                              <strong className="text-[var(--text-primary)] font-mono">{stop.stopName}</strong>
                              {stop.location && (
                                <span className="text-[11px] text-[var(--text-secondary)] block">{stop.location}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="text-right font-mono text-[11px]">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">{stop.pickupTime}</span>
                              {stop.dropTime && <span className="text-sky-600 dark:text-sky-400">{stop.dropTime}</span>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleStartEditStop(stop)}
                                title="Edit stop"
                                className="p-1 rounded border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteStop(stop.id, stop.stopName)}
                                title="Delete stop"
                                className="p-1 rounded border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add/Edit Stop Sub-form */}
                <div className="pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase">
                      {editingStop ? `Editing Stop: ${editingStop.stopName}` : "Add New Sequential Stop"}
                    </span>
                    {editingStop && (
                      <button
                        onClick={handleCancelEditStop}
                        className="text-[#FF6D1F] hover:underline text-xs font-mono"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveStop} className="space-y-3 text-xs bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-subtle)]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Stop Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vani Vihar Square"
                          value={stopForm.stopName}
                          onChange={(e) => setStopForm({ ...stopForm, stopName: e.target.value })}
                          className="w-full px-3 py-1.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                        />
                      </div>

                      <div>
                        <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Stop Order *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={stopForm.stopOrder}
                          onChange={(e) => setStopForm({ ...stopForm, stopOrder: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Landmark / Specific Location (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Near Overbridge / Bus Shelter"
                        value={stopForm.location}
                        onChange={(e) => setStopForm({ ...stopForm, location: e.target.value })}
                        className="w-full px-3 py-1.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Morning Pickup Time *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 07:45 AM"
                          value={stopForm.pickupTime}
                          onChange={(e) => setStopForm({ ...stopForm, pickupTime: e.target.value })}
                          className="w-full px-3 py-1.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Evening Drop Time (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 05:30 PM"
                          value={stopForm.dropTime}
                          onChange={(e) => setStopForm({ ...stopForm, dropTime: e.target.value })}
                          className="w-full px-3 py-1.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary px-4 py-2 rounded-xl font-bold flex items-center gap-1.5"
                      >
                        {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{editingStop ? "Update Stop" : "Add Stop to Route"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* E. DELAY / LIVE NOTICE BROADCAST MODAL */}
          {delayModalOpen && delayRoute && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="campus-panel rounded-2xl max-w-md w-full p-6 space-y-4 border border-[var(--border-subtle)] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Broadcast Route Status</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{delayRoute.routeNumber}: {delayRoute.routeName}</p>
                  </div>
                  <button onClick={() => setDelayModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveDelayStatus} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Live Operational Status *</label>
                    <select
                      value={delayStatus}
                      onChange={(e) => setDelayStatus(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] font-mono font-semibold"
                    >
                      <option value="ON_TIME">ON_TIME (Normal Service)</option>
                      <option value="DELAYED">DELAYED (Traffic / Mechanical Hold)</option>
                      <option value="CANCELLED">CANCELLED (Suspended)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-mono uppercase text-[10px]">Live Announcement / Delay Note</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Running 20 mins late due to Khandagiri bypass traffic congestion."
                      value={delayNotice}
                      onChange={(e) => setDelayNotice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setDelayModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save & Broadcast</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransportPage;
