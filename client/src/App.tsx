import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { apiRequest, UserProfile, clearAuthToken, subscribeAuthEvents, broadcastAuthEvent } from "./api/client.js";
import { Navbar } from "./components/Navbar.js";
import { Sidebar } from "./components/Sidebar.js";
import { Topbar } from "./components/Topbar.js";
import { Footer } from "./components/Footer.js";
import { OfflineBanner } from "./components/OfflineBanner.js";
import { StudentProfileModal } from "./components/StudentProfileModal.js";

// Pages
import { LandingPage } from "./pages/LandingPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { TicketsPage } from "./pages/TicketsPage.js";
import { NewTicketPage } from "./pages/NewTicketPage.js";
import { TicketDetailPage } from "./pages/TicketDetailPage.js";
import { GatePassPage } from "./pages/GatePassPage.js";
import { GateLogPage } from "./pages/GateLogPage.js";
import { NoticesPage } from "./pages/NoticesPage.js";
import { NoticeDetailPage } from "./pages/NoticeDetailPage.js";
import { TimetableAttendancePage } from "./pages/TimetableAttendancePage.js";
import { MessPage } from "./pages/MessPage.js";
import { DocumentRequestsPage } from "./pages/DocumentRequestsPage.js";
import { FeeStatusPage } from "./pages/FeeStatusPage.js";
import { FaqAssistantPage } from "./pages/FaqAssistantPage.js";
import { CommandConsolePage } from "./pages/CommandConsolePage.js";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.js";
import { DataImportPage } from "./pages/DataImportPage.js";
import { ClubsPage } from "./pages/ClubsPage.js";
import { TransportPage } from "./pages/TransportPage.js";
import { ParcelsPage } from "./pages/ParcelsPage.js";
import { CampusHelpPage } from "./pages/CampusHelpPage.js";
import { PrivacyPage } from "./pages/PrivacyPage.js";
import { TermsPage } from "./pages/TermsPage.js";
import { AdoptionPage } from "./pages/AdoptionPage.js";
import { FacultyDashboardPage } from "./pages/FacultyDashboardPage.js";
import { StudentResultsPage } from "./pages/StudentResultsPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileModalStudentId, setProfileModalStudentId] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ user: UserProfile }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
      clearAuthToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Multi-tab auth synchronization
    const unsubscribe = subscribeAuthEvents((msg) => {
      if (msg.type === "LOGOUT" || msg.type === "SESSION_EXPIRED") {
        setUser(null);
        clearAuthToken();
      } else if (msg.type === "LOGIN") {
        setUser(msg.user);
      }
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      clearAuthToken();
      setUser(null);
      broadcastAuthEvent({ type: "LOGOUT" });
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-campus-bg text-campus-secondary">
        <div className="w-10 h-10 border-2 border-campus-accent/30 border-t-campus-accent rounded-full animate-spin mb-4"></div>
        <div className="text-xs font-mono uppercase tracking-widest text-campus-accent">
          CampusDesk
        </div>
        <div className="text-[11px] text-campus-muted mt-1">Initializing secure campus session...</div>
      </div>
    );
  }

  const isWardenOrAdmin = user?.role === "ADMIN" || user?.role === "WARDEN";

  const appRoutes = (
    <Routes>
      {/* Home Landing Page (Default Public Entry Point) */}
      <Route
        path="/"
        element={
          <LandingPage user={user} onLoginSuccess={(u) => setUser(u)} />
        }
      />

      {/* Login / Registration */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLoginSuccess={(u) => setUser(u)} />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage onLoginSuccess={(u) => setUser(u)} />
          )
        }
      />

      {/* Authenticated Application Routes (Fresh key on user switch) */}
      <Route
        path="/dashboard"
        element={
          user ? (
            user.role === "FACULTY" ? (
              <Navigate to="/faculty" replace />
            ) : user.role === "WARDEN" ? (
              <Navigate to="/admin" replace />
            ) : user.role === "ADMIN" ? (
              <Navigate to="/admin" replace />
            ) : user.role === "SECURITY" || user.department?.toLowerCase().includes("security") ? (
              <Navigate to="/gate-log" replace />
            ) : (
              <DashboardPage key={user.id} user={user} />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/faculty"
        element={
          user ? (
            user.role === "FACULTY" || user.role === "ADMIN" ? (
              <FacultyDashboardPage key={user.id} user={user} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/results"
        element={
          user ? (
            <StudentResultsPage key={user.id} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/tickets"
        element={user ? <TicketsPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tickets/new"
        element={user ? <NewTicketPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tickets/:id"
        element={user ? <TicketDetailPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/gatepass"
        element={user ? <GatePassPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/gate-log"
        element={
          user ? (
            user.role !== "STUDENT" ? (
              <GateLogPage key={user.id} user={user} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/notices"
        element={user ? <NoticesPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/notices/:id"
        element={user ? <NoticeDetailPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/academics"
        element={
          user ? (
            user.role === "STUDENT" || user.role === "FACULTY" || user.role === "ADMIN" ? (
              <TimetableAttendancePage key={user.id} user={user} />
            ) : (
              <Navigate to={user.role === "WARDEN" ? "/admin" : (user.role === "SECURITY" || user.department?.toLowerCase().includes("security") ? "/gate-log" : "/dashboard")} replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/attendance"
        element={<Navigate to="/academics" replace />}
      />
      <Route
        path="/timetable"
        element={<Navigate to="/academics" replace />}
      />
      <Route
        path="/mess"
        element={user ? <MessPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/clubs"
        element={user ? <ClubsPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/transport"
        element={user ? <TransportPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/parcels"
        element={user ? <ParcelsPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/help"
        element={user ? <CampusHelpPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/documents"
        element={user ? <DocumentRequestsPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/fees"
        element={user ? <FeeStatusPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/faq"
        element={user ? <FaqAssistantPage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/console"
        element={user ? <CommandConsolePage key={user.id} user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/admin"
        element={
          user ? (
            isWardenOrAdmin ? (
              <AdminDashboardPage key={user.id} user={user} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/import"
        element={
          user ? (
            user.role === "ADMIN" ? (
              <DataImportPage key={user.id} user={user} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Policies & Guides */}
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/adoption" element={<AdoptionPage />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );

  return (
    <BrowserRouter>
      {user ? (
        <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] selection:bg-[#FF6D1F]/30 selection:text-[var(--text-primary)]">
          <OfflineBanner />

          {/* Desktop Left Rail Navigation */}
          <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-40">
            <Sidebar
              user={user}
              onLogout={handleLogout}
              onOpenDigitalId={() => setProfileModalStudentId(user.id)}
            />
          </div>

          {/* Mobile Sliding Drawer */}
          {mobileDrawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setMobileDrawerOpen(false)}
              />
              <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
                <Sidebar
                  user={user}
                  onLogout={handleLogout}
                  onOpenDigitalId={() => {
                    setMobileDrawerOpen(false);
                    setProfileModalStudentId(user.id);
                  }}
                  onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Right Main Shell */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Topbar
              user={user}
              onToggleMobileDrawer={() => setMobileDrawerOpen((prev) => !prev)}
              onOpenDigitalId={() => setProfileModalStudentId(user.id)}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 page-fade-in">
              {appRoutes}
            </main>

            <Footer />
          </div>

          {/* Global Student Digital Dossier Modal */}
          {profileModalStudentId && (
            <StudentProfileModal
              studentId={profileModalStudentId}
              onClose={() => setProfileModalStudentId(null)}
              currentUserRole={user?.role}
            />
          )}
        </div>
      ) : (
        <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] selection:bg-[#FF6D1F]/30 selection:text-[var(--text-primary)]">
          <OfflineBanner />
          <Navbar user={null} onLogout={handleLogout} />

          <div className="flex-1 flex flex-col">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 page-fade-in">
              {appRoutes}
            </main>

            <Footer />
          </div>
        </div>
      )}
    </BrowserRouter>
  );
};

export default App;
