// src/pages/AuthLoginPage.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function AuthLoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "student",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mock login: route based on selected role
    if (form.role === "student") {
      navigate("/student");
    } else if (form.role === "teacher") {
      navigate("/teacher");
    } else if (form.role === "admin") {
      navigate("/admin");
    }
  };

  return (
    <section
      className="py-5"
      style={{ minHeight: "70vh", background: "#f8f9fa" }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="feature-box">
              <h2 className="mb-3 text-center">Login to EduMate</h2>
              <p className="text-muted text-center mb-4">
                Use your email and select a role to continue. This is a mock login
                for demonstration purposes.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <Link to="/auth/forgot-password" className="small">
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" className="btn-get-started w-100">
                  Login
                </button>
              </form>

              <p className="mt-3 mb-1 text-center">
                <span className="text-muted">Don&apos;t have an account?</span>{" "}
                <Link to="/auth/register">Create an account</Link>
              </p>

              <p className="mb-0 text-center" style={{ fontSize: "0.85rem" }}>
                Or you can{" "}
                <Link to="/login">continue by choosing a role</Link> without
                entering credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthLoginPage;
