import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LifeBuoy,
  Phone,
  Mail,
  MapPin,
  Clock,
  Search,
  Building,
  HeartPulse,
  Laptop,
  Shield,
  CreditCard,
  FileText,
  Bus,
  Wrench,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface DirectoryEntry {
  id: string;
  department: string;
  category: string;
  officeLocation: string;
  workingHours: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  actionType?: string;
  actionUrl?: string;
}

export const CampusHelpPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    const fetchDir = async () => {
      try {
        setLoading(true);
        const res = await apiRequest<{ directory: DirectoryEntry[] }>("/api/directory");
        setDirectory(res.directory || []);
      } catch (err) {
        console.error("Failed to load directory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDir();
  }, []);

  const categories = ["ALL", "ACADEMIC", "HOSTEL", "ADMIN", "MEDICAL", "IT", "TRANSPORT", "SECURITY"];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "MEDICAL":
        return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case "IT":
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case "SECURITY":
        return <Shield className="w-5 h-5 text-amber-700" />;
      case "TRANSPORT":
        return <Bus className="w-5 h-5 text-emerald-600" />;
      case "HOSTEL":
        return <Building className="w-5 h-5 text-purple-600" />;
      case "ADMIN":
        return <FileText className="w-5 h-5 text-indigo-600" />;
      default:
        return <LifeBuoy className="w-5 h-5 text-campus-accent" />;
    }
  };

  const filteredDirectory = directory.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-campus-border">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/80 text-campus-accent border border-campus-border">
              Campus Help & Service Directory
            </span>
            <span className="text-xs font-mono text-campus-secondary">24x7 Assistance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-campus-text">
            Campus Help & Department Directory
          </h1>
          <p className="text-xs sm:text-sm text-campus-secondary max-w-2xl leading-relaxed">
            Quickly locate university offices, working hours, official contact emails, and direct resolution pathways for academic, fee, hostel, technical, medical, and transport issues.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-campus-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search departments, services, or issues (e.g. Fees, Hostel Warden, Wi-Fi, Medical, Bus)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-campus-border rounded-xl bg-white/70 text-xs text-campus-text placeholder:text-campus-muted focus:outline-none focus:border-campus-accent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 border border-campus-border rounded-xl bg-white/70 text-xs font-semibold text-campus-text focus:outline-none focus:border-campus-accent"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "All Categories" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Directory Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-campus-muted">Loading campus help directory...</div>
      ) : filteredDirectory.length === 0 ? (
        <div className="p-12 text-center text-xs text-campus-muted glass-card rounded-2xl">
          No campus services found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-4 border border-campus-border hover:border-campus-accent/30 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white/80 border border-campus-border shadow-xs">
                    {getCategoryIcon(item.category)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/70 text-campus-accent border border-campus-border">
                    {item.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-campus-text">{item.department}</h3>
                  <p className="text-xs text-campus-secondary mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-campus-border text-xs text-campus-secondary font-mono">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-campus-accent shrink-0" />
                    <span>{item.officeLocation}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-campus-accent shrink-0" />
                    <span>{item.workingHours}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-campus-accent shrink-0" />
                    <span>{item.contactPerson}: {item.contactPhone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-campus-accent shrink-0" />
                    <a href={`mailto:${item.contactEmail}`} className="text-campus-accent hover:underline truncate">
                      {item.contactEmail}
                    </a>
                  </div>
                </div>
              </div>

              {item.actionUrl && (
                <div className="pt-3 border-t border-campus-border">
                  <Link
                    to={item.actionUrl}
                    className="w-full py-2.5 rounded-xl text-xs font-bold btn-primary flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <span>{item.actionType || "Open Service"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampusHelpPage;
