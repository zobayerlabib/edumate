// src/App.js
import React from "react";
import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import HomePage from "./pages/HomePage";
import RoleSelectPage from "./pages/RoleSelectPage";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// NEW auth pages
import AuthLoginPage from "./pages/AuthLoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

function App() {
  return (
    <Router>
      <div className="edumate-page">
        <Navbar />

        <main id="main">
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* Role selection (kept at /login) */}
            <Route path="/login" element={<RoleSelectPage />} />

            {/* New auth routes */}
            <Route path="/auth/login" element={<AuthLoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Dashboards */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
