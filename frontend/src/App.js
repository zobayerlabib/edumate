// src/App.js
import React from "react";
import "./App.css";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import HomePage from "./pages/HomePage";
import RoleSelectPage from "./pages/RoleSelectPage";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import AuthLoginPage from "./pages/AuthLoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="edumate-page">
          <Navbar />

          <main id="main">
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* Role select */}
              <Route path="/login/role-select" element={<RoleSelectPage />} />

              {/* Auth */}
              <Route path="/login" element={<AuthLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected dashboards */}
              <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
                <Route path="/student" element={<StudentDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
                <Route path="/teacher" element={<TeacherDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
