// src/components/auth/ProtectedRoute.js
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && user?.role && !allowedRoles.includes(user.role)) {
    const role = user.role;
    const fallback = role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
