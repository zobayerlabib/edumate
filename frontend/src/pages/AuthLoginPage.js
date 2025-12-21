// src/pages/AuthLoginPage.js
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function AuthLoginPage() {
  const query = useQuery();
  const roleFromUrl = query.get("role"); // student/teacher/admin

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (roleFromUrl === "student" || roleFromUrl === "teacher" || roleFromUrl === "admin") {
      setRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  const goDashboard = (r) => {
    if (r === "admin") navigate("/admin", { replace: true });
    else if (r === "teacher") navigate("/teacher", { replace: true });
    else navigate("/student", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Backend should return: { access_token, token_type, user: { email, role } }
      const res = await api.post("/auth/login", { email, password, role });

      const token = res.data?.access_token;
      const userRole = res.data?.user?.role || role;
      const userEmail = res.data?.user?.email || email;

      if (!token) throw new Error("No token returned from server.");

      login({ token, email: userEmail, role: userRole });

      const redirectTo = location.state?.from;
      if (redirectTo) navigate(redirectTo, { replace: true });
      else goDashboard(userRole);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-5" style={{ minHeight: "70vh", background: "#f8f9fa" }}>
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card p-4" style={{ borderRadius: 14 }}>
          <h2 className="text-center mb-2">Login to EduMate</h2>
          <p className="text-center text-muted mb-4">
            Sign in to continue to your dashboard.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email address</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button className="btn-get-started w-100" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="d-flex justify-content-between mt-3">
              <Link to="/forgot-password">Forgot password?</Link>
              <Link to="/register">Create an account</Link>
            </div>

            <div className="text-center mt-3">
              <Link to="/login/role-select">Continue by choosing a role</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
