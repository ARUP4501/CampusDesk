import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { apiRequest, UserProfile } from "./api/client.js";
import { Navbar } from "./components/Navbar.js";
import { Footer } from "./components/Footer.js";
import { OfflineBanner } from "./components/OfflineBanner.js";

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
import { PrivacyPage } from "./pages/PrivacyPage.js";
import { TermsPage } from "./pages/TermsPage.js";
import { AdoptionPage } from "./pages/AdoptionPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ user: UserProfile }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07090B] text-campus-secondary">
        <div className="w-9 h-9 border-2 border-campus-gold/30 border-t-campus-gold rounded-full animate-spin mb-4"></div>
        <div className="text-xs font-mono uppercase tracking-widest text-campus-gold">
          CampusDesk OS
        </div>
        <div className="text-[11px] text-campus-muted mt-1">Initializing secure kernel session...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#07090B] text-[#F3F4F6] selection:bg-[#D6A84F]/20 selection:text-[#F0C86A]">
        <OfflineBanner />
        <Navbar user={user} onLogout={handleLogout} />

        <div className={`flex-1 flex flex-col transition-all duration-200 ${user ? "lg:pl-60" : ""}`}>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    <DashboardPage user={user} />
                  ) : (
                    <LandingPage user={user} onLoginSuccess={(u) => setUser(u)} />
                  )
                }
              />
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <LoginPage onLoginSuccess={(u) => setUser(u)} />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <RegisterPage onLoginSuccess={(u) => setUser(u)} />
                  )
                }
              />

              {/* Authenticated Application Routes */}
              <Route
                path="/dashboard"
                element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/tickets"
                element={user ? <TicketsPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/tickets/new"
                element={user ? <NewTicketPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/tickets/:id"
                element={user ? <TicketDetailPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/gatepass"
                element={user ? <GatePassPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/gate-log"
                element={
                  user && user.role !== "STUDENT" ? (
                    <GateLogPage user={user} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/notices"
                element={user ? <NoticesPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/notices/:id"
                element={user ? <NoticeDetailPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/academics"
                element={user ? <TimetableAttendancePage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/mess"
                element={user ? <MessPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/documents"
                element={user ? <DocumentRequestsPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/fees"
                element={user ? <FeeStatusPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/faq"
                element={user ? <FaqAssistantPage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/console"
                element={user ? <CommandConsolePage user={user} /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/admin"
                element={
                  user && (user.role === "ADMIN" || user.role === "WARDEN") ? (
                    <AdminDashboardPage user={user} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/import"
                element={
                  user && user.role === "ADMIN" ? (
                    <DataImportPage user={user} />
                  ) : (
                    <Navigate to="/" replace />
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
          </main>

          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
