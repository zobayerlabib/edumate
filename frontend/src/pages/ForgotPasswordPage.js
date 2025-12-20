// src/pages/ForgotPasswordPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real system, a reset link would be sent.
    setSubmitted(true);
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
              <h2 className="mb-3 text-center">Reset Password</h2>
              <p className="text-muted text-center mb-4">
                Enter your email address and we will simulate sending a password
                reset link.
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-get-started w-100">
                    Send Reset Link
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <p className="mb-3">
                    If this were connected to a backend, a password reset link
                    would now be sent to <strong>{email}</strong>.
                  </p>
                </div>
              )}

              <p className="mt-3 mb-0 text-center">
                <Link to="/auth/login">Back to login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPasswordPage;
