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
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", { email, password, role });

      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        navigate(`/login?role=${role}`, { replace: true });
      }, 700);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
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
          {success && <div className="alert alert-success">{success}</div>}

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
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>

                {/* Recommended: don't allow self-register as admin */}
                <option value="admin">Admin</option>
              </select>
              <small className="text-muted">
                Tip: Usually only Student/Teacher are allowed for self-registration.
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
