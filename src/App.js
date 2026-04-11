import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

// Existing Pages
import MainPage from "./pages/MainPage";
import CompanionLogin from "./pages/CompanionLogin";
import ElderlyLogin from "./pages/ElderlyLogin";
import CompanionSignup from "./pages/CompanionSignup";
import ElderlySignup from "./pages/ElderlySignup";
import Home from "./pages/Home";
import CompanionLanding from "./pages/CompanionLanding";
import ElderlyDashboard from "./pages/ElderlyDashboard";
import CompanionDashboard from "./pages/CompanionDashboard";

// New Pages
import SearchCompanions from "./pages/SearchCompanions";
import ProfileView from "./pages/ProfileView";
import ProfileEdit from "./pages/ProfileEdit";
import BookingPage from "./pages/BookingPage";
import ChatPage from "./pages/ChatPage";
import MoodTracker from "./pages/MoodTracker";
import AvailabilityManagement from "./pages/AvailabilityManagement";
import ReviewPage from "./pages/ReviewPage";
import DailyCheckIn from "./pages/DailyCheckIn";
import NotificationsPage from "./pages/NotificationsPage";
import EmergencyContacts from "./pages/EmergencyContacts";
import AdminPanel from "./pages/AdminPanel";
import BookingHistoryTransactions from "./pages/BookingHistoryTransactions";
import PaymentGatewayCheckout from "./pages/PaymentGatewayCheckout";
import PaymentGatewayResult from "./pages/PaymentGatewayResult";

// Competitor-Inspired Features
import JobPostings from "./pages/JobPostings";
import CareAssessment from "./pages/CareAssessment";

import "./styles/main.css";

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/companion-login" element={<GuestRoute><CompanionLogin /></GuestRoute>} />
        <Route path="/elderly-login" element={<GuestRoute><ElderlyLogin /></GuestRoute>} />
        <Route path="/companion-signup" element={<GuestRoute><CompanionSignup /></GuestRoute>} />
        <Route path="/elderly-signup" element={<GuestRoute><ElderlySignup /></GuestRoute>} />
        <Route
          path="/home"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <Home />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companion-landing"
          element={
            <ProtectedRoute roles={["companion"]}>
              <CompanionLanding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/elderly-dashboard"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <ElderlyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companion-dashboard"
          element={
            <ProtectedRoute roles={["companion"]}>
              <CompanionDashboard />
            </ProtectedRoute>
          }
        />

        {/* New Routes for Companion Matching System */}
        
        {/* Search & Browse */}
        <Route
          path="/search-companions"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <SearchCompanions />
              </>
            </ProtectedRoute>
          }
        />

        {/* Profile Pages */}
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute roles={["elderly", "companion"]}>
              <>
                <Navbar />
                <ProfileView />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile-edit"
          element={
            <ProtectedRoute roles={["elderly", "companion"]}>
              <>
                <Navbar />
                <ProfileEdit />
              </>
            </ProtectedRoute>
          }
        />

        {/* Booking System */}
        <Route
          path="/booking/:companionId"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <BookingPage />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking-history"
          element={
            <ProtectedRoute roles={["elderly", "companion"]}>
              <>
                <Navbar />
                <BookingHistoryTransactions />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-gateway/checkout/:tranId"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <PaymentGatewayCheckout />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-gateway/success"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <PaymentGatewayResult type="success" />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-gateway/fail"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <PaymentGatewayResult type="fail" />
              </>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-gateway/cancel"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <PaymentGatewayResult type="cancel" />
              </>
            </ProtectedRoute>
          }
        />

        {/* Chat/Messages */}
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute roles={["elderly", "companion"]}>
              <>
                <Navbar />
                <ChatPage />
              </>
            </ProtectedRoute>
          }
        />

        {/* Reviews */}
        <Route
          path="/review/:companionId"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <ReviewPage />
              </>
            </ProtectedRoute>
          }
        />

        {/* Availability Management (Companions) */}
        <Route
          path="/availability"
          element={
            <ProtectedRoute roles={["companion"]}>
              <>
                <Navbar />
                <AvailabilityManagement />
              </>
            </ProtectedRoute>
          }
        />

        {/* Mood Tracking (Elderly) */}
        <Route
          path="/mood-tracker"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <MoodTracker />
              </>
            </ProtectedRoute>
          }
        />

        {/* Daily Check-in (Elderly) */}
        <Route
          path="/daily-checkin"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <DailyCheckIn />
              </>
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute roles={["elderly", "companion"]}>
              <>
                <Navbar />
                <NotificationsPage />
              </>
            </ProtectedRoute>
          }
        />

        {/* Emergency Contacts (Elderly) */}
        <Route
          path="/emergency-contacts"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <EmergencyContacts />
              </>
            </ProtectedRoute>
          }
        />

        {/* Admin Panel */}
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute roles={["admin"]}>
              <>
                <Navbar />
                <AdminPanel />
              </>
            </ProtectedRoute>
          }
        />

        {/* Job Postings (Care.com inspired) */}
        <Route
          path="/job-postings"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <JobPostings />
              </>
            </ProtectedRoute>
          }
        />

        {/* Care Assessment Quiz (Caring.com inspired) */}
        <Route
          path="/care-assessment"
          element={
            <ProtectedRoute roles={["elderly"]}>
              <>
                <Navbar />
                <CareAssessment />
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
