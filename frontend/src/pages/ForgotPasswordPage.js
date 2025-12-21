// src/pages/ForgotPasswordPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Later: call backend endpoint to send reset email
    setSent(true);
  };

  return (
    <section className="py-5" style={{ minHeight: "70vh", background: "#f8f9fa" }}>
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card p-4" style={{ borderRadius: 14 }}>
          <h2 className="text-center mb-2">Reset your password</h2>
          <p className="text-center text-muted mb-4">
            Enter your email and we’ll send a reset link.
          </p>

          {sent ? (
            <div className="alert alert-success">
              If an account exists for <b>{email}</b>, a reset link will be sent.
            </div>
          ) : (
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

              <button className="btn-get-started w-100" type="submit">
                Send reset link
              </button>
            </form>
          )}

          <div className="text-center mt-3">
            <Link to="/login">Back to login</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
