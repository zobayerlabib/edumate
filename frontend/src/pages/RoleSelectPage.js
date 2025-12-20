// src/pages/RoleSelectPage.js
import React from "react";
import { useNavigate, Link } from "react-router-dom";

function RoleSelectPage() {
  const navigate = useNavigate();

  const handleStudent = () => navigate("/student");
  const handleTeacher = () => navigate("/teacher");
  const handleAdmin = () => navigate("/admin");

  return (
    <section
      className="py-5"
      style={{ minHeight: "70vh", background: "#f8f9fa" }}
    >
      <div className="container">
        <div className="text-center mb-4">
          <h2 className="mb-2">Sign in to EduMate</h2>
          <p className="text-muted mb-0">
            Choose your role to preview the corresponding dashboard.
          </p>
        </div>

        <div className="row gy-4 justify-content-center">
          {/* Student card */}
          <div className="col-md-4">
            <div className="feature-box h-100 d-flex flex-column">
              <div className="mb-3">
                <div className="mb-2">
                  <i
                    className="bi bi-mortarboard-fill"
                    style={{ fontSize: "1.6rem" }}
                  />
                </div>
                <h5>Student</h5>
                <p className="mb-0">
                  Access your learning path, upcoming quizzes, and progress overview.
                </p>
              </div>
              <button
                type="button"
                className="btn-get-started mt-auto"
                onClick={handleStudent}
              >
                Continue as Student
              </button>
            </div>
          </div>

          {/* Teacher card */}
          <div className="col-md-4">
            <div className="feature-box h-100 d-flex flex-column">
              <div className="mb-3">
                <div className="mb-2">
                  <i
                    className="bi bi-people-fill"
                    style={{ fontSize: "1.6rem" }}
                  />
                </div>
                <h5>Teacher</h5>
                <p className="mb-0">
                  Monitor class performance, review assessments, and support learners.
                </p>
              </div>
              <button
                type="button"
                className="btn-get-started mt-auto"
                onClick={handleTeacher}
              >
                Continue as Teacher
              </button>
            </div>
          </div>

          {/* Admin card */}
          <div className="col-md-4">
            <div className="feature-box h-100 d-flex flex-column">
              <div className="mb-3">
                <div className="mb-2">
                  <i
                    className="bi bi-shield-lock-fill"
                    style={{ fontSize: "1.6rem" }}
                  />
                </div>
                <h5>Admin</h5>
                <p className="mb-0">
                  View high-level usage, manage users, and oversee platform activity.
                </p>
              </div>
              <button
                type="button"
                className="btn-get-started mt-auto"
                onClick={handleAdmin}
              >
                Continue as Admin
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-muted" style={{ fontSize: "0.85rem" }}>
          Prefer to sign in with email and password?{" "}
          <Link to="/auth/login">Use the full login form</Link>.{" "}
          New to EduMate? <Link to="/auth/register">Create an account</Link>.
        </p>
      </div>
    </section>
  );
}

export default RoleSelectPage;
