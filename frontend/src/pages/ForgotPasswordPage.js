import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [demoOtp, setDemoOtp] = useState(""); // backend returns OTP for demo
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });

      // backend returns: { message, otp } in your implementation
      setDemoOtp(res.data?.otp || "");
      setOtpSent(true);
      setMsg("OTP generated. Please check below (demo) and reset your password.");
    } catch (err) {
      const m = err?.response?.data?.detail || "Failed to generate OTP";
      setError(m);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email,
        otp,
        new_password: newPassword,
      });

      setMsg("Password reset successful. You can login now.");
    } catch (err) {
      const m = err?.response?.data?.detail || "Failed to reset password";
      setError(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-5" style={{ minHeight: "70vh", background: "#f8f9fa" }}>
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card p-4" style={{ borderRadius: 14 }}>
          <h2 className="text-center mb-2">Forgot Password</h2>
          <p className="text-center text-muted mb-4">
            Enter your email to receive an OTP, then set a new password.
          </p>

          {error && <div className="alert alert-danger">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          {!otpSent ? (
            <form onSubmit={sendOtp}>
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

              <button className="btn-get-started w-100" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <div className="text-center mt-3">
                <Link to="/login">Back to login</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={resetPassword}>
              {demoOtp && (
                <div className="alert alert-warning">
                  Demo OTP: <b>{demoOtp}</b>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">OTP</label>
                <input
                  className="form-control"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  required
                />
              </div>

              <button className="btn-get-started w-100" type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-center mt-3">
                <Link to="/login">Back to login</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
