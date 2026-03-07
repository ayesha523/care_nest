import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import MainPage from "./pages/MainPage";
import CompanionLogin from "./pages/CompanionLogin";
import ElderlyLogin from "./pages/ElderlyLogin";
import CompanionSignup from "./pages/CompanionSignup";
import ElderlySignup from "./pages/ElderlySignup";
import Home from "./pages/Home";
import CompanionLanding from "./pages/CompanionLanding";
import ElderlyDashboard from "./pages/ElderlyDashboard";
import CompanionDashboard from "./pages/CompanionDashboard";
import "./styles/main.css";

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/companion-login" element={<CompanionLogin />} />
        <Route path="/elderly-login" element={<ElderlyLogin />} />
        <Route path="/companion-signup" element={<CompanionSignup />} />
        <Route path="/elderly-signup" element={<ElderlySignup />} />
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
