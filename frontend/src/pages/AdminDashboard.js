// src/pages/AdminDashboard.js
import React from "react";

function AdminDashboard() {
  return (
    <section
      className="py-5"
      style={{ minHeight: "70vh", background: "#f8f9fa" }}
    >
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Admin Dashboard</h2>
            <p className="text-muted mb-0">
              High-level overview of users, content, and overall platform usage.
            </p>
          </div>
          <span className="badge rounded-pill text-bg-primary">
            <i className="bi bi-shield-lock me-1" />
            Admin
          </span>
        </div>

        <div className="row g-4 mb-3">
          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5 className="mb-2">
                <i className="bi bi-people me-2" />
                User Summary
              </h5>
              <p className="mb-1">Students: 430</p>
              <p className="mb-1">Teachers: 38</p>
              <p className="mb-0">Admins: 3</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5 className="mb-2">
                <i className="bi bi-journal-text me-2" />
                Content Summary
              </h5>
              <p className="mb-1">Courses: 12</p>
              <p className="mb-1">Quizzes: 45</p>
              <p className="mb-0">Learning paths: 20</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5 className="mb-2">
                <i className="bi bi-activity me-2" />
                Platform Activity
              </h5>
              <p className="mb-1">Monthly active users: 310</p>
              <p className="mb-1">Average session length: 18 minutes</p>
              <p className="mb-0">System status: Online</p>
            </div>
          </div>
        </div>

        <div className="feature-box">
          <h5 className="mb-3">
            <i className="bi bi-bar-chart-line me-2" />
            Notes for Administrators
          </h5>
          <ul className="mb-0">
            <li>Monitor user growth and course adoption over time.</li>
            <li>
              Coordinate with academic teams to refine courses based on usage
              patterns.
            </li>
            <li>
              Plan future integration with institutional systems and reporting
              tools.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
