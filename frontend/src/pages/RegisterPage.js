// src/pages/RegisterPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Backend should implement: POST /auth/register { email, password, role }
      await api.post("/auth/register", { email, password, role });
      navigate(`/login?role=${role}`, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err.message ||
        "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-5" style={{ minHeight: "70vh", background: "#f8f9fa" }}>
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card p-4" style={{ borderRadius: 14 }}>
          <h2 className="text-center mb-2">Create your account</h2>
          <p className="text-center text-muted mb-4">
            Register to start using EduMate.
          </p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
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
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm password</label>
              <input
                className="form-control"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button className="btn-get-started w-100" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>

            <div className="text-center mt-3">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
