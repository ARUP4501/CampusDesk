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

  // Delay / Status broadcast modal
  const [delayModalOpen, setDelayModalOpen] = useState<boolean>(false);
  const [delayRoute, setDelayRoute] = useState<BusRouteItem | null>(null);
  const [delayStatus, setDelayStatus] = useState<string>("ON_TIME");
  const [delayNotice, setDelayNotice] = useState<string>("");

  // Form submitting state
  const [submitting, setSubmitting] = useState<boolean>(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Fetch all transport data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [overviewRes, routesRes, busesRes, parkingRes] = await Promise.all([
        apiRequest<{ overview: TransportOverview }>("/api/transport/overview").catch(() => null),
        apiRequest<{ routes: BusRouteItem[] }>("/api/transport/routes?includeInactive=true").catch(() => ({ routes: [] })),
        apiRequest<{ buses: BusItem[] }>("/api/transport/buses").catch(() => ({ buses: [] })),
        apiRequest<{ zones: ParkingZone[] }>("/api/parking/zones").catch(() => ({ zones: [] }))
      ]);

      if (overviewRes?.overview) setOverview(overviewRes.overview);
      const fetchedRoutes = routesRes?.routes || [];
      setRoutes(fetchedRoutes);
      setBuses(busesRes?.buses || []);
      setParkingLots(parkingRes?.zones || []);

      // Auto-select first route if none selected
      if (fetchedRoutes.length > 0) {
        setSelectedRouteId((prev) => (prev && fetchedRoutes.some((r) => r.id === prev) ? prev : fetchedRoutes[0].id));
      }
    } catch (err: any) {
      console.error("Transport data load error:", err);
      showToast(err.message || "Failed to load transport data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered routes based on search query
  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return routes;
    return routes.filter((r) => {
      const matchNumber = r.routeNumber.toLowerCase().includes(q);
      const matchName = r.routeName.toLowerCase().includes(q);
      const matchStart = r.startPoint?.toLowerCase().includes(q);
      const matchDest = r.destination?.toLowerCase().includes(q);
      const matchBus = r.bus?.busNumber?.toLowerCase().includes(q) || r.bus?.vehicleNumber?.toLowerCase().includes(q);
      const matchStops = r.stops?.some(
        (s) => s.stopName.toLowerCase().includes(q) || (s.location && s.location.toLowerCase().includes(q))
      );
      return matchNumber || matchName || matchStart || matchDest || matchBus || matchStops;
    });
  }, [routes, searchQuery]);

  // Filtered buses for Fleet view
  const filteredBuses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return buses;
    return buses.filter((b) => {
      const matchNumber = b.busNumber.toLowerCase().includes(q);
      const matchPlate = b.vehicleNumber.toLowerCase().includes(q);
      const matchDriver = b.driverName.toLowerCase().includes(q);
      return matchNumber || matchPlate || matchDriver;
    });
  }, [buses, searchQuery]);

  // Currently viewed route in detail
  const currentRouteDetail = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0] || null;
  }, [routes, selectedRouteId]);

  // --- ADMIN HANDLERS ---

  // Open Bus Modal for create/edit
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
        showToast(`Bus ${busForm.busNumber} updated successfully!`);
      } else {
        await apiRequest("/api/transport/buses", {
          method: "POST",
          body: JSON.stringify(busForm)
        });
        showToast(`Bus ${busForm.busNumber} registered successfully!`);
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
    if (!window.confirm(`Are you sure you want to delete bus "${bus.busNumber}" (${bus.vehicleNumber})? Routes assigned to this bus will be unlinked safely.`)) {
      return;
    }
    try {
      await apiRequest(`/api/transport/buses/${bus.id}`, { method: "DELETE" });
      showToast(`Bus ${bus.busNumber} deleted safely.`);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete bus", "error");
    }
  };

  // Open Route Modal for create/edit
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
        startPoint: "Campus Main Gate",
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
      const payload = {
        ...routeForm,
        busId: routeForm.busId ? routeForm.busId : null
      };

      if (editingRoute) {
        await apiRequest(`/api/transport/routes/${editingRoute.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showToast(`Route ${routeForm.routeNumber} updated successfully!`);
      } else {
        await apiRequest("/api/transport/routes", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast(`Route ${routeForm.routeNumber} created successfully!`);
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
    if (!window.confirm(`Delete route "${route.routeNumber}: ${route.routeName}"? All associated stops will be removed.`)) {
      return;
    }
    try {
      await apiRequest(`/api/transport/routes/${route.id}`, { method: "DELETE" });
      showToast(`Route ${route.routeNumber} deleted.`);
      fetchAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete route", "error");
    }
  };

  // Assign Bus to Route
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
      // Refresh current stops list
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
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-3 sm:px-6 overflow-x-hidden">
      {/* 1. Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-campus-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/80 text-campus-accent border border-campus-border flex items-center gap-1.5 shadow-sm">
                <Navigation className="w-3.5 h-3.5 text-campus-accent" />
                Day Scholar Transit & Mobility
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Tracking Active
              </span>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Transport Console
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-campus-text">
              Campus Transport & Fleet Management
            </h1>
            <p className="text-xs sm:text-sm text-campus-secondary max-w-2xl leading-relaxed">
              Official university shuttle routes, scheduled bus stops, morning pickup & drop timings, live traffic notices, and parking bay occupancy.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 shrink-0">
            <div className="p-3.5 bg-white/70 rounded-2xl border border-campus-border text-center shadow-sm">
              <span className="text-[10px] font-mono text-campus-muted uppercase tracking-wider block">
                {isAdmin ? "Total Buses" : "Active Buses"}
              </span>
              <span className="text-xl font-black text-campus-accent font-mono">
                {isAdmin ? overview?.totalBuses ?? buses.length : overview?.activeBuses ?? buses.filter((b) => b.status === "ACTIVE").length}
              </span>
            </div>

            <div className="p-3.5 bg-white/70 rounded-2xl border border-campus-border text-center shadow-sm">
              <span className="text-[10px] font-mono text-campus-muted uppercase tracking-wider block">
                {isAdmin ? "Total Routes" : "Active Routes"}
              </span>
              <span className="text-xl font-black text-campus-accent font-mono">
                {isAdmin ? overview?.totalRoutes ?? routes.length : overview?.activeRoutes ?? routes.filter((r) => r.status === "ACTIVE").length}
              </span>
            </div>

            <div className="p-3.5 bg-white/70 rounded-2xl border border-campus-border text-center shadow-sm">
              <span className="text-[10px] font-mono text-campus-muted uppercase tracking-wider block">Total Stops</span>
              <span className="text-xl font-black text-campus-accent font-mono">
                {overview?.totalStops ?? routes.reduce((acc, r) => acc + (r.stops?.length || 0), 0)}
              </span>
            </div>

            <div className="p-3.5 bg-white/70 rounded-2xl border border-campus-border text-center shadow-sm">
              <span className="text-[10px] font-mono text-campus-muted uppercase tracking-wider block">Parking Lots</span>
              <span className="text-xl font-black text-campus-accent font-mono">{parkingLots.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toast / Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-md ${
            statusMsg.type === "success" ? "status-badge-success" : "status-badge-error"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 3. Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-campus-border pb-4">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "routes"
                ? "bg-campus-btnPrimary text-campus-text shadow-sm border border-campus-border"
                : "text-campus-secondary hover:bg-white/40"
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Bus Routes & Schedules ({routes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("buses")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "buses"
                ? "bg-campus-btnPrimary text-campus-text shadow-sm border border-campus-border"
                : "text-campus-secondary hover:bg-white/40"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAdmin ? "Manage Fleet" : "Active Fleet"} ({buses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("parking")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "parking"
                ? "bg-campus-btnPrimary text-campus-text shadow-sm border border-campus-border"
                : "text-campus-secondary hover:bg-white/40"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Parking Zones ({parkingLots.length})</span>
          </button>
        </div>

        {/* Action Controls & Search Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-campus-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                activeTab === "buses"
                  ? "Search bus #, vehicle #, driver..."
                  : "Search route, stop, terminal..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-xs text-campus-text placeholder:text-campus-muted focus:outline-none focus:border-campus-accent shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-campus-muted hover:text-campus-text p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ADMIN ONLY Action Buttons */}
          {isAdmin && activeTab === "routes" && (
            <button
              onClick={() => handleOpenRouteModal()}
              className="btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Route</span>
            </button>
          )}

          {isAdmin && activeTab === "buses" && (
            <button
              onClick={() => handleOpenBusModal()}
              className="btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Bus</span>
            </button>
          )}

          <button
            onClick={fetchAllData}
            title="Refresh transport data"
            className="p-2 rounded-xl border border-campus-border bg-white/70 hover:bg-white text-campus-secondary hover:text-campus-text transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-campus-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-campus-muted font-mono">Syncing campus transit coordinates & fleet data...</p>
        </div>
      ) : activeTab === "routes" ? (
        /* ======================================================== */
        /* ROUTES TAB: Route List -> Detailed Route Stop Timeline   */
        /* ======================================================== */
        filteredRoutes.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-3xl border border-campus-border space-y-3">
            <Bus className="w-10 h-10 text-campus-muted mx-auto" />
            <h3 className="text-base font-bold text-campus-text">No Bus Routes Found</h3>
            <p className="text-xs text-campus-secondary max-w-sm mx-auto">
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
              <div className="flex items-center justify-between text-xs text-campus-secondary px-1">
                <span className="font-semibold uppercase tracking-wider font-mono text-[11px]">
                  Available Routes ({filteredRoutes.length})
                </span>
                <span className="text-[11px] font-mono text-campus-muted">Select route to view stops</span>
              </div>

              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                {filteredRoutes.map((route) => {
                  const isSelected = route.id === currentRouteDetail?.id;
                  const isDelayed = route.delayStatus === "DELAYED";
                  const isCancelled = route.delayStatus === "CANCELLED";

                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`p-4 rounded-2xl glass-card cursor-pointer transition-all border relative text-left ${
                        isSelected
                          ? "border-campus-accent ring-2 ring-campus-accent/20 bg-white/95 shadow-md"
                          : "border-campus-border hover:border-campus-accent/40 bg-white/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-xl border ${isSelected ? "bg-campus-accent text-white border-campus-accent" : "bg-white/80 border-campus-border text-campus-accent"}`}>
                            <Bus className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono font-bold text-campus-accent">{route.routeNumber}</span>
                              {route.status === "INACTIVE" && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold">
                                  INACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-sm text-campus-text leading-tight">{route.routeName}</h3>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                            isCancelled
                              ? "status-badge-error"
                              : isDelayed
                              ? "status-badge-warning"
                              : "status-badge-success"
                          }`}
                        >
                          {route.delayStatus || "ON_TIME"}
                        </span>
                      </div>

                      {/* Origin -> Destination summary */}
                      <div className="mt-3 flex items-center text-xs text-campus-secondary gap-1.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-campus-muted shrink-0" />
                        <span className="truncate max-w-[120px] font-medium">{route.startPoint}</span>
                        <ArrowRight className="w-3 h-3 text-campus-muted shrink-0" />
                        <span className="truncate max-w-[120px] font-medium text-campus-text">{route.destination}</span>
                      </div>

                      {/* Assigned Bus & Stops count badge */}
                      <div className="mt-3 pt-2.5 border-t border-campus-border/70 flex items-center justify-between text-[11px] font-mono text-campus-secondary">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-campus-muted">Bus:</span>
                          <span className="font-bold text-campus-text">
                            {route.bus ? route.bus.busNumber : "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-campus-accent">{route.stops?.length || 0}</span>
                          <span className="text-campus-muted">Stops</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-campus-accent translate-x-0.5" : "text-campus-muted"}`} />
                        </div>
                      </div>

                      {/* Live Notice indicator */}
                      {route.delayNotice && (
                        <div className="mt-2 status-badge-warning px-2.5 py-1 rounded-xl text-[10px] flex items-center space-x-1 font-medium truncate">
                          <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate">{route.delayNotice}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Route Full Details & Stops Timeline (7 cols on lg) */}
            <div className="lg:col-span-7">
              {currentRouteDetail ? (
                <div className="glass-card rounded-3xl p-5 sm:p-7 border border-campus-border space-y-6 shadow-sm">
                  {/* Detail Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-campus-border pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-white/80 text-campus-accent border border-campus-border">
                          {currentRouteDetail.routeNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            currentRouteDetail.delayStatus === "DELAYED"
                              ? "status-badge-warning"
                              : currentRouteDetail.delayStatus === "CANCELLED"
                              ? "status-badge-error"
                              : "status-badge-success"
                          }`}
                        >
                          {currentRouteDetail.delayStatus || "ON_TIME"}
                        </span>
                        {currentRouteDetail.status === "INACTIVE" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold status-badge-error">
                            INACTIVE ROUTE
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-campus-text mt-1.5">
                        {currentRouteDetail.routeName}
                      </h2>
                      {currentRouteDetail.description && (
                        <p className="text-xs text-campus-secondary mt-1">{currentRouteDetail.description}</p>
                      )}
                    </div>

                    {/* ADMIN ONLY management buttons for this route */}
                    {isAdmin && (
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenStopsModal(currentRouteDetail)}
                          title="Manage route stops"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Stops</span>
                        </button>

                        <button
                          onClick={() => handleOpenAssignModal(currentRouteDetail)}
                          title="Assign bus to route"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <Bus className="w-3.5 h-3.5" />
                          <span>Bus</span>
                        </button>

                        <button
                          onClick={() => handleOpenDelayModal(currentRouteDetail)}
                          title="Broadcast delay or live notice"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Status</span>
                        </button>

                        <button
                          onClick={() => handleOpenRouteModal(currentRouteDetail)}
                          title="Edit route metadata"
                          className="p-1.5 rounded-xl border border-campus-border hover:bg-white text-campus-secondary hover:text-campus-text"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteRoute(currentRouteDetail)}
                          title="Delete route safely"
                          className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Delay / Live Notice Alert */}
                  {currentRouteDetail.delayNotice && (
                    <div className="status-badge-warning p-4 rounded-2xl text-xs flex items-start space-x-2.5 font-medium border border-amber-300">
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="block text-amber-900 font-bold uppercase text-[11px] font-mono tracking-wider">
                          Transit Operational Update:
                        </strong>
                        <span className="text-amber-950 text-xs sm:text-sm leading-relaxed">
                          {currentRouteDetail.delayNotice}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Route Key Details Grid: Origin/Destination & Bus/Driver */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Origin & Destination Card */}
                    <div className="p-4 rounded-2xl bg-white/80 border border-campus-border space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-campus-muted uppercase">
                        <Compass className="w-4 h-4 text-campus-accent" />
                        <span>Transit Corridor</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-start space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                          <div>
                            <span className="text-campus-muted text-[10px] block font-mono">START POINT</span>
                            <strong className="text-campus-text text-xs sm:text-sm font-semibold">
                              {currentRouteDetail.startPoint}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2 pt-1 border-t border-campus-border/50">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                          <div>
                            <span className="text-campus-muted text-[10px] block font-mono">DESTINATION</span>
                            <strong className="text-campus-text text-xs sm:text-sm font-semibold">
                              {currentRouteDetail.destination}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Bus & Driver Card */}
                    <div className="p-4 rounded-2xl bg-white/80 border border-campus-border space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-campus-muted uppercase">
                        <Bus className="w-4 h-4 text-campus-accent" />
                        <span>Assigned Vehicle & Crew</span>
                      </div>

                      {currentRouteDetail.bus ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-campus-muted font-mono text-[11px]">Bus ID:</span>
                            <span className="font-bold text-campus-text font-mono text-sm">
                              {currentRouteDetail.bus.busNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-campus-muted font-mono text-[11px]">Plate / Reg #:</span>
                            <span className="font-mono text-campus-secondary font-semibold">
                              {currentRouteDetail.bus.vehicleNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-campus-muted font-mono text-[11px]">Capacity:</span>
                            <span className="font-mono text-campus-secondary">
                              {currentRouteDetail.bus.capacity} seats
                            </span>
                          </div>

                          <div className="pt-2 border-t border-campus-border/60 flex items-center justify-between">
                            <div>
                              <span className="text-campus-muted text-[10px] block font-mono">DRIVER</span>
                              <strong className="text-campus-text font-semibold">
                                {currentRouteDetail.bus.driverName}
                              </strong>
                            </div>
                            {currentRouteDetail.bus.driverPhone && (
                              <a
                                href={`tel:${currentRouteDetail.bus.driverPhone}`}
                                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white text-campus-accent border border-campus-border hover:border-campus-accent flex items-center space-x-1 shadow-sm transition-all"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{currentRouteDetail.bus.driverPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-campus-muted space-y-1">
                          <p>No bus currently assigned to this route.</p>
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenAssignModal(currentRouteDetail)}
                              className="text-campus-accent hover:underline text-xs font-semibold font-mono"
                            >
                              + Assign Vehicle Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route Stops Timeline */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-campus-accent" />
                        <h3 className="font-bold text-sm sm:text-base text-campus-text">
                          Scheduled Route Stops ({currentRouteDetail.stops?.length || 0})
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-campus-muted">Ordered sequential transit</span>
                    </div>

                    {!currentRouteDetail.stops || currentRouteDetail.stops.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-campus-border text-xs text-campus-muted space-y-2">
                        <MapPin className="w-8 h-8 text-campus-muted mx-auto" />
                        <p>No scheduled stops listed for this route yet.</p>
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
                      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-campus-border">
                        {currentRouteDetail.stops.map((stop, idx) => (
                          <div key={stop.id || idx} className="relative group">
                            {/* Bullet circle */}
                            <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-campus-accent flex items-center justify-center text-[10px] font-bold font-mono text-campus-accent shadow-sm">
                              {stop.stopOrder || idx + 1}
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white/70 border border-campus-border hover:border-campus-accent/40 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-campus-text">
                                  {stop.stopName}
                                </h4>
                                {stop.location && (
                                  <p className="text-[11px] text-campus-secondary mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-campus-muted shrink-0" />
                                    <span>{stop.location}</span>
                                  </p>
                                )}
                              </div>

                              {/* Timings Badges */}
                              <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                                <div className="px-2.5 py-1 rounded-xl bg-white/90 border border-campus-border text-campus-text flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  <span className="text-[10px] text-campus-muted">Pickup:</span>
                                  <strong className="font-bold">{stop.pickupTime}</strong>
                                </div>

                                {stop.dropTime && (
                                  <div className="px-2.5 py-1 rounded-xl bg-white/90 border border-campus-border text-campus-text flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-blue-600" />
                                    <span className="text-[10px] text-campus-muted">Drop:</span>
                                    <strong className="font-bold">{stop.dropTime}</strong>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center glass-card rounded-3xl border border-campus-border text-xs text-campus-muted">
                  Select a route from the list to view its complete timetable and stop itinerary.
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
            <span className="text-xs font-mono font-semibold text-campus-secondary uppercase tracking-wider">
              {isAdmin ? "University Fleet Vehicle Management" : "Campus Transit Buses"} ({filteredBuses.length})
            </span>
            <span className="text-xs font-mono text-campus-muted">
              {isAdmin ? "Admin authority: Add, edit driver info, assign routes, or retire bus" : "Active verified campus shuttles"}
            </span>
          </div>

          {filteredBuses.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-3xl border border-campus-border space-y-3">
              <Bus className="w-10 h-10 text-campus-muted mx-auto" />
              <h3 className="text-base font-bold text-campus-text">No Buses Found</h3>
              <p className="text-xs text-campus-secondary">
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
                  className="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-4 border border-campus-border hover:border-campus-accent/30 transition-all shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2.5 rounded-2xl bg-white/80 border border-campus-border text-campus-accent">
                          <Bus className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-campus-accent">{bus.busNumber}</span>
                          </div>
                          <h3 className="font-mono font-bold text-xs text-campus-text">{bus.vehicleNumber}</h3>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          bus.status === "ACTIVE" ? "status-badge-success" : "status-badge-error"
                        }`}
                      >
                        {bus.status}
                      </span>
                    </div>

                    {/* Bus Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="p-2 rounded-xl bg-white/60 border border-campus-border/60">
                        <span className="text-[10px] text-campus-muted block uppercase">Seating Capacity</span>
                        <strong className="text-campus-text text-sm">{bus.capacity} seats</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white/60 border border-campus-border/60">
                        <span className="text-[10px] text-campus-muted block uppercase">Assigned Routes</span>
                        <strong className="text-campus-text text-sm">
                          {bus.routes ? bus.routes.length : 0}
                        </strong>
                      </div>
                    </div>

                    {/* Driver details */}
                    <div className="p-3 rounded-2xl bg-white/80 border border-campus-border space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-campus-muted text-[10px] font-mono uppercase">Assigned Driver</span>
                        <span className="font-bold text-campus-text">{bus.driverName}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-campus-border/50">
                        <span className="text-campus-muted text-[10px] font-mono uppercase">Emergency Contact</span>
                        {bus.driverPhone ? (
                          <a
                            href={`tel:${bus.driverPhone}`}
                            className="font-mono text-campus-accent hover:underline flex items-center gap-1 font-bold text-xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{bus.driverPhone}</span>
                          </a>
                        ) : (
                          <span className="text-campus-muted font-mono text-[11px]">N/A</span>
                        )}
                      </div>
                    </div>

                    {/* Assigned route names if any */}
                    {bus.routes && bus.routes.length > 0 && (
                      <div className="space-y-1 text-[11px] font-mono">
                        <span className="text-campus-muted block text-[10px] uppercase">Service Routes:</span>
                        <div className="flex flex-wrap gap-1">
                          {bus.routes.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded-lg bg-white border border-campus-border text-campus-secondary"
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
                    <div className="pt-3 border-t border-campus-border flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenBusModal(bus)}
                        className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBus(bus)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                className="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-4 border border-campus-border hover:border-campus-accent/30 transition-all shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/80 text-campus-accent border border-campus-border">
                      {lot.category || lot.vehicleType || "VEHICLE PARKING"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isFull ? "status-badge-error" : "status-badge-success"
                      }`}
                    >
                      {isFull ? "FULL" : "SPOTS AVAILABLE"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-campus-text">{lot.name}</h3>
                    <p className="text-xs text-campus-secondary mt-1">{lot.notes || lot.notice || "Designated campus parking bay."}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-campus-muted">Occupancy ({occupancyPct}%)</span>
                      <span className="font-bold text-campus-text font-mono">{occupied} / {total}</span>
                    </div>
                    <div className="w-full bg-black/10 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occupancyPct > 90 ? "bg-rose-500" : occupancyPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-campus-border flex items-center justify-between text-xs font-mono">
                  <span className="text-campus-muted">Vacant Spots:</span>
                  <span className="font-bold text-campus-accent text-sm">{available} Bays</span>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="glass-modal rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-elevated max-h-[90vh] overflow-y-auto border border-campus-border">
                <div className="flex items-center justify-between border-b border-campus-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-campus-text">
                      {editingBus ? "Edit Fleet Vehicle" : "Add New Fleet Bus"}
                    </h3>
                    <p className="text-xs text-campus-secondary">Configure bus identification, vehicle number, driver contact, and status.</p>
                  </div>
                  <button onClick={() => setBusModalOpen(false)} className="text-campus-muted hover:text-campus-text p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveBus} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Bus Identifier *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BUS-04"
                        value={busForm.busNumber}
                        onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Vehicle Number (Plate) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. OD-02-AX-8899"
                        value={busForm.vehicleNumber}
                        onChange={(e) => setBusForm({ ...busForm, vehicleNumber: e.target.value })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Passenger Capacity *</label>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        required
                        value={busForm.capacity}
                        onChange={(e) => setBusForm({ ...busForm, capacity: parseInt(e.target.value) || 50 })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Operational Status *</label>
                      <select
                        value={busForm.status}
                        onChange={(e) => setBusForm({ ...busForm, status: e.target.value as any })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE (In Service)</option>
                        <option value="INACTIVE">INACTIVE (Maintenance / Standby)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Driver Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Nayak"
                        value={busForm.driverName}
                        onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Driver Contact *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={busForm.driverPhone}
                        onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-campus-border">
                    <button
                      type="button"
                      onClick={() => setBusModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl font-semibold"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="glass-modal rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-elevated max-h-[90vh] overflow-y-auto border border-campus-border">
                <div className="flex items-center justify-between border-b border-campus-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-campus-text">
                      {editingRoute ? "Edit Bus Route" : "Create New Bus Route"}
                    </h3>
                    <p className="text-xs text-campus-secondary">Define route number, start point, destination corridor, and assigned bus.</p>
                  </div>
                  <button onClick={() => setRouteModalOpen(false)} className="text-campus-muted hover:text-campus-text p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveRoute} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Route Code / Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Route 4"
                        value={routeForm.routeNumber}
                        onChange={(e) => setRouteForm({ ...routeForm, routeNumber: e.target.value })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Status *</label>
                      <select
                        value={routeForm.status}
                        onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value as any })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-campus-text mb-1 font-semibold">Route Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master Canteen - Rasulgarh - Campus"
                      value={routeForm.routeName}
                      onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                      className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Starting Point *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master Canteen Square"
                        value={routeForm.startPoint}
                        onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Destination *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Campus Main Gate"
                        value={routeForm.destination}
                        onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                        className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-campus-text mb-1 font-semibold">Assigned Fleet Bus (Optional)</label>
                    <select
                      value={routeForm.busId}
                      onChange={(e) => setRouteForm({ ...routeForm, busId: e.target.value })}
                      className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono"
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
                    <label className="block text-campus-text mb-1 font-semibold">Description / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Covers major residential areas along NH-16."
                      value={routeForm.description}
                      onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-campus-border">
                    <button
                      type="button"
                      onClick={() => setRouteModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl font-semibold"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 shadow-elevated border border-campus-border">
                <div className="flex items-center justify-between border-b border-campus-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-campus-text">Assign Bus to Route</h3>
                    <p className="text-xs text-campus-secondary">{assigningRoute.routeNumber}: {assigningRoute.routeName}</p>
                  </div>
                  <button onClick={() => setAssignBusModalOpen(false)} className="text-campus-muted hover:text-campus-text p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAssignBus} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-campus-text mb-1 font-semibold">Select Fleet Vehicle</label>
                    <select
                      value={selectedBusIdForAssign}
                      onChange={(e) => setSelectedBusIdForAssign(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                    >
                      <option value="">-- No Bus Assigned (Unlink) --</option>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.busNumber} ({b.vehicleNumber}) - Driver: {b.driverName} ({b.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-campus-border">
                    <button
                      type="button"
                      onClick={() => setAssignBusModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl font-semibold"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="glass-modal rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-elevated max-h-[92vh] overflow-y-auto border border-campus-border">
                <div className="flex items-center justify-between border-b border-campus-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-campus-text">
                      Manage Route Stops: {stopsRoute.routeNumber}
                    </h3>
                    <p className="text-xs text-campus-secondary">{stopsRoute.routeName} ({stopsRoute.startPoint} → {stopsRoute.destination})</p>
                  </div>
                  <button onClick={() => setStopsModalOpen(false)} className="text-campus-muted hover:text-campus-text p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Existing stops table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-campus-muted uppercase block">
                    Current Stops List ({stopsRoute.stops?.length || 0})
                  </span>

                  {!stopsRoute.stops || stopsRoute.stops.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-white/40 border border-dashed border-campus-border text-xs text-campus-muted">
                      No stops added yet. Use the form below to add the first stop.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {stopsRoute.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className="p-3 rounded-xl bg-white/80 border border-campus-border flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-6 h-6 rounded-full bg-campus-accent text-white flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                              {stop.stopOrder}
                            </span>
                            <div>
                              <strong className="text-campus-text">{stop.stopName}</strong>
                              {stop.location && (
                                <span className="text-[11px] text-campus-muted block">{stop.location}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="text-right font-mono text-[11px]">
                              <span className="text-emerald-700 font-semibold block">{stop.pickupTime}</span>
                              {stop.dropTime && <span className="text-blue-700">{stop.dropTime}</span>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleStartEditStop(stop)}
                                title="Edit stop"
                                className="p-1 rounded-lg border border-campus-border hover:bg-white text-campus-secondary hover:text-campus-text"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStop(stop.id, stop.stopName)}
                                title="Delete stop"
                                className="p-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add/Edit Stop Sub-form */}
                <div className="pt-3 border-t border-campus-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-campus-text font-mono uppercase">
                      {editingStop ? `Editing Stop: ${editingStop.stopName}` : "Add New Sequential Stop"}
                    </span>
                    {editingStop && (
                      <button
                        onClick={handleCancelEditStop}
                        className="text-campus-accent hover:underline text-xs font-semibold"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveStop} className="space-y-3 text-xs bg-white/60 p-4 rounded-2xl border border-campus-border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-campus-text mb-1 font-semibold">Stop Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Vani Vihar Square"
                          value={stopForm.stopName}
                          onChange={(e) => setStopForm({ ...stopForm, stopName: e.target.value })}
                          className="w-full px-3 py-1.5 border border-campus-border rounded-xl bg-white text-campus-text focus:outline-none focus:border-campus-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-campus-text mb-1 font-semibold">Stop Order *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={stopForm.stopOrder}
                          onChange={(e) => setStopForm({ ...stopForm, stopOrder: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 border border-campus-border rounded-xl bg-white text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-campus-text mb-1 font-semibold">Landmark / Specific Location (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Near Overbridge / Bus Shelter"
                        value={stopForm.location}
                        onChange={(e) => setStopForm({ ...stopForm, location: e.target.value })}
                        className="w-full px-3 py-1.5 border border-campus-border rounded-xl bg-white text-campus-text focus:outline-none focus:border-campus-accent"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-campus-text mb-1 font-semibold">Morning Pickup Time *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 07:45 AM"
                          value={stopForm.pickupTime}
                          onChange={(e) => setStopForm({ ...stopForm, pickupTime: e.target.value })}
                          className="w-full px-3 py-1.5 border border-campus-border rounded-xl bg-white text-campus-text focus:outline-none focus:border-campus-accent font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-campus-text mb-1 font-semibold">Evening Drop Time (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 05:30 PM"
                          value={stopForm.dropTime}
                          onChange={(e) => setStopForm({ ...stopForm, dropTime: e.target.value })}
                          className="w-full px-3 py-1.5 border border-campus-border rounded-xl bg-white text-campus-text focus:outline-none focus:border-campus-accent font-mono"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 shadow-elevated border border-campus-border">
                <div className="flex items-center justify-between border-b border-campus-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-campus-text">Broadcast Route Status</h3>
                    <p className="text-xs text-campus-secondary">{delayRoute.routeNumber}: {delayRoute.routeName}</p>
                  </div>
                  <button onClick={() => setDelayModalOpen(false)} className="text-campus-muted hover:text-campus-text p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveDelayStatus} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-campus-text mb-1 font-semibold">Live Operational Status *</label>
                    <select
                      value={delayStatus}
                      onChange={(e) => setDelayStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent font-semibold"
                    >
                      <option value="ON_TIME">ON_TIME (Normal Service)</option>
                      <option value="DELAYED">DELAYED (Traffic / Mechanical Hold)</option>
                      <option value="CANCELLED">CANCELLED (Suspended)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-campus-text mb-1 font-semibold">Live Announcement / Delay Note</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Running 20 mins late due to Khandagiri bypass traffic congestion."
                      value={delayNotice}
                      onChange={(e) => setDelayNotice(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-campus-text focus:outline-none focus:border-campus-accent resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-campus-border">
                    <button
                      type="button"
                      onClick={() => setDelayModalOpen(false)}
                      className="btn-secondary px-4 py-2 rounded-xl font-semibold"
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
