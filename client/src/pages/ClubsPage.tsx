import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  XCircle,
  Megaphone,
  Clock,
  MapPin,
  Filter,
  Search,
  ChevronRight,
  Award,
  BookOpen,
  Music,
  Code2,
  HeartHandshake,
  Dumbbell,
  Compass,
  X
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface Club {
  id: string;
  name: string;
  category: string;
  description: string;
  coordinatorName: string;
  coordinatorEmail?: string;
  meetingSchedule?: string;
  logoUrl?: string;
  isMember?: boolean;
  memberRole?: string;
  _count?: {
    members: number;
    events: number;
    announcements: number;
  };
}

interface ClubEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  capacity?: number;
  isRegistered?: boolean;
  registrationCount?: number;
  club?: {
    id: string;
    name: string;
    category: string;
  };
}

interface ClubAnnouncement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  club?: {
    id: string;
    name: string;
  };
}

export const ClubsPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "my_clubs" | "events" | "announcements">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [showCreateClubModal, setShowCreateClubModal] = useState<boolean>(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Forms
  const [clubForm, setClubForm] = useState({
    name: "",
    category: "TECHNICAL",
    description: "",
    coordinatorName: user?.fullName || "",
    meetingSchedule: "Weekly Fridays 4:00 PM"
  });

  const [eventForm, setEventForm] = useState({
    clubId: "",
    title: "",
    description: "",
    eventDate: "",
    location: "",
    capacity: 100
  });

  const categories = ["ALL", "TECHNICAL", "CULTURAL", "SPORTS", "SOCIAL", "LITERARY", "INNOVATION"];

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const [clubsRes, eventsRes, announcementsRes] = await Promise.all([
        apiRequest<{ clubs: Club[] }>("/api/clubs"),
        apiRequest<{ events: ClubEvent[] }>("/api/clubs/events"),
        apiRequest<{ announcements: ClubAnnouncement[] }>("/api/clubs/announcements")
      ]);
      setClubs(clubsRes.clubs || []);
      setEvents(eventsRes.events || []);
      setAnnouncements(announcementsRes.announcements || []);
      if (clubsRes.clubs?.length && !eventForm.clubId) {
        setEventForm((prev) => ({ ...prev, clubId: clubsRes.clubs[0].id }));
      }
    } catch (err) {
      console.error("Failed to load clubs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, []);

  const handleJoinLeave = async (clubId: string, isCurrentlyMember: boolean) => {
    try {
      if (isCurrentlyMember) {
        await apiRequest(`/api/clubs/${clubId}/leave`, { method: "POST" });
        setStatusMessage({ text: "You have left the club.", type: "success" });
      } else {
        await apiRequest(`/api/clubs/${clubId}/join`, { method: "POST" });
        setStatusMessage({ text: "Successfully joined the club!", type: "success" });
      }
      fetchClubData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Action failed", type: "error" });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleEventRegistration = async (eventId: string, isCurrentlyRegistered: boolean) => {
    try {
      if (isCurrentlyRegistered) {
        await apiRequest(`/api/clubs/events/${eventId}/register`, { method: "DELETE" });
        setStatusMessage({ text: "Event registration cancelled.", type: "success" });
      } else {
        await apiRequest(`/api/clubs/events/${eventId}/register`, { method: "POST" });
        setStatusMessage({ text: "Successfully registered for the event!", type: "success" });
      }
      fetchClubData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Registration failed", type: "error" });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/clubs", {
        method: "POST",
        body: JSON.stringify(clubForm)
      });
      setShowCreateClubModal(false);
      setStatusMessage({ text: "New club created successfully!", type: "success" });
      fetchClubData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to create club", type: "error" });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/api/clubs/${eventForm.clubId}/events`, {
        method: "POST",
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description,
          eventDate: eventForm.eventDate,
          location: eventForm.location,
          capacity: Number(eventForm.capacity)
        })
      });
      setShowCreateEventModal(false);
      setStatusMessage({ text: "Club event scheduled and published!", type: "success" });
      fetchClubData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to create event", type: "error" });
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredClubs = clubs.filter((c) => {
    const matchesCat = selectedCategory === "ALL" || c.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "my_clubs" ? c.isMember : true;
    return matchesCat && matchesSearch && matchesTab;
  });

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("code") || cat.includes("tech")) return <Code2 className="w-5 h-5 text-[#FF6D1F]" />;
    if (cat.includes("music") || cat.includes("sing") || cat.includes("cultur")) return <Music className="w-5 h-5 text-[#FF6D1F]" />;
    if (cat.includes("sport") || cat.includes("fitness")) return <Dumbbell className="w-5 h-5 text-[#FF6D1F]" />;
    if (cat.includes("social") || cat.includes("environment")) return <HeartHandshake className="w-5 h-5 text-[#FF6D1F]" />;
    if (cat.includes("literature") || cat.includes("debate")) return <BookOpen className="w-5 h-5 text-[#FF6D1F]" />;
    return <Sparkles className="w-5 h-5 text-[#FF6D1F]" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="campus-block p-6 sm:p-8 relative overflow-hidden border border-[var(--border-subtle)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30 uppercase tracking-wider">
                Student Engagement & Activities
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">2026 Academic Season</span>
            </div>
            <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)]">
              Campus Clubs & Societies
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Explore technical, cultural, sports, and social clubs. Connect with peers, participate in hackathons, workshops, and concerts, and expand your campus life.
            </p>
          </div>

          {(user?.role === "ADMIN" || user?.role === "WARDEN" || user?.role === "FACULTY") && (
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setShowCreateClubModal(true)}
                className="btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Club</span>
              </button>
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm"
              >
                <Calendar className="w-4 h-4 text-[#FF6D1F]" />
                <span>Host Event</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-mono font-semibold flex items-center space-x-2 animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[var(--border-subtle)] pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
            activeTab === "all"
              ? "bg-[#FF6D1F] text-black shadow-sm"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          All Clubs ({clubs.length})
        </button>
        <button
          onClick={() => setActiveTab("my_clubs")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
            activeTab === "my_clubs"
              ? "bg-[#FF6D1F] text-black shadow-sm"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          My Joined Clubs ({clubs.filter((c) => c.isMember).length})
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === "events"
              ? "bg-[#FF6D1F] text-black shadow-sm"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming Events ({events.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === "announcements"
              ? "bg-[#FF6D1F] text-black shadow-sm"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Announcements ({announcements.length})</span>
        </button>
      </div>

      {/* Search & Category Filter for Clubs View */}
      {(activeTab === "all" || activeTab === "my_clubs") && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clubs by name or keywords (e.g. Coding, Robotics, Dance)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                className="w-full !pl-11 pr-4 py-2.5 border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-input)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F] transition-colors"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-input)] text-xs font-mono font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="campus-block p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#FF6D1F]/30 border-t-[#FF6D1F] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-[var(--text-muted)]">Loading campus clubs & events...</p>
        </div>
      ) : activeTab === "events" ? (
        /* Events View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.length === 0 ? (
            <div className="col-span-2 campus-block p-12 text-center text-xs text-[var(--text-muted)] font-mono">
              No upcoming events scheduled right now.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="campus-block p-5 flex flex-col justify-between space-y-4 border border-[var(--border-subtle)] hover:border-[#FF6D1F]/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30">
                      {ev.club?.name || "Campus Club"}
                    </span>
                    {ev.capacity && (
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        {ev.registrationCount || 0} / {ev.capacity} Registered
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{ev.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{ev.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-mono">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-[#FF6D1F] shrink-0" />
                    <span>{new Date(ev.eventDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6D1F] shrink-0" />
                    <span>{ev.location}</span>
                  </div>

                  {user && (
                    <button
                      onClick={() => handleEventRegistration(ev.id, !!ev.isRegistered)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        ev.isRegistered
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                          : "btn-primary"
                      }`}
                    >
                      {ev.isRegistered ? "Registered ✓ (Click to Cancel)" : "Register for Event"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "announcements" ? (
        /* Announcements View */
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="campus-block p-12 text-center text-xs text-[var(--text-muted)] font-mono">
              No club announcements posted yet.
            </div>
          ) : (
            announcements.map((an) => (
              <div key={an.id} className="campus-block p-5 space-y-2 border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF6D1F]/15 text-[#FF6D1F] border border-[#FF6D1F]/30">
                    {an.club?.name || "Official Club Circular"}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {new Date(an.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">{an.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{an.content}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Clubs Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.length === 0 ? (
            <div className="col-span-3 campus-block p-12 text-center text-xs text-[var(--text-muted)] font-mono">
              No clubs found matching your criteria.
            </div>
          ) : (
            filteredClubs.map((club) => (
              <div
                key={club.id}
                className="campus-block p-5 flex flex-col justify-between space-y-4 border border-[var(--border-subtle)] hover:border-[#FF6D1F]/30 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                      {getCategoryIcon(club.category)}
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-surface)] text-[#FF6D1F] border border-[var(--border-subtle)] uppercase">
                      {club.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{club.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-3 leading-relaxed">
                      {club.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
                  <div className="flex items-center justify-between">
                    <span>Coordinator:</span>
                    <span className="font-bold text-[var(--text-primary)]">{club.coordinatorName}</span>
                  </div>
                  {club.meetingSchedule && (
                    <div className="flex items-center justify-between">
                      <span>Schedule:</span>
                      <span className="text-[var(--text-secondary)]">{club.meetingSchedule}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Members:</span>
                    <span className="font-bold text-[#FF6D1F]">{club._count?.members || 0} Students</span>
                  </div>

                  {user && (
                    <button
                      onClick={() => handleJoinLeave(club.id, !!club.isMember)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        club.isMember
                          ? "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[#FF6D1F] hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                          : "btn-primary"
                      }`}
                    >
                      {club.isMember ? "Joined ✓ (Click to Leave)" : "Join Club"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Club Modal */}
      {showCreateClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-elevated border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Register New Campus Club</h3>
              <button onClick={() => setShowCreateClubModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Club Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. ByteCraft Coding Society"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Category *</label>
                <select
                  value={clubForm.category}
                  onChange={(e) => setClubForm({ ...clubForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                >
                  {categories.filter((c) => c !== "ALL").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the club purpose, activities, and expectations..."
                  value={clubForm.description}
                  onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Lead Coordinator *</label>
                  <input
                    required
                    type="text"
                    value={clubForm.coordinatorName}
                    onChange={(e) => setClubForm({ ...clubForm, coordinatorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Meeting Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Every Friday 4 PM"
                    value={clubForm.meetingSchedule}
                    onChange={(e) => setClubForm({ ...clubForm, meetingSchedule: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowCreateClubModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 rounded-xl font-bold">
                  Create Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-panel rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-elevated border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Host Club Event</h3>
              <button onClick={() => setShowCreateEventModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Host Club *</label>
                <select
                  required
                  value={eventForm.clubId}
                  onChange={(e) => setEventForm({ ...eventForm, clubId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Event Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Web3 Hackathon 2026 / Classical Night"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Event details, agenda, speakers, rules, and benefits..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Location *</label>
                  <input
                    required
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-semibold">Capacity</label>
                  <input
                    type="number"
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[#FF6D1F]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 rounded-xl font-bold">
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubsPage;
