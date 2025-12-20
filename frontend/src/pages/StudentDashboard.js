// src/pages/StudentDashboard.js
import React from "react";

function StudentDashboard() {
  return (
    <section
      className="py-5"
      style={{ minHeight: "70vh", background: "#f8f9fa" }}
    >
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Student Dashboard</h2>
            <p className="text-muted mb-0">
              View your learning plan, upcoming activities, and progress in one place.
            </p>
          </div>
          <span className="badge rounded-pill text-bg-primary">
            <i className="bi bi-person-circle me-1" />
            Student
          </span>
        </div>

        <div className="row g-4">
          {/* Left column: learning path + activities */}
          <div className="col-lg-8">
            <div className="feature-box mb-3">
              <h5 className="mb-3">
                <i className="bi bi-list-check me-2" />
                Current Learning Path
              </h5>
              <ul className="mb-0">
                <li>Introduction to Programming – In progress</li>
                <li>Data Structures Basics – Not started</li>
                <li>Quiz: Week 3 Knowledge Check – Due in 2 days</li>
              </ul>
            </div>

            <div className="feature-box">
              <h5 className="mb-3">
                <i className="bi bi-calendar-event me-2" />
                Upcoming Activities
              </h5>
              <ul className="mb-0">
                <li>Quiz: Python Fundamentals – Tomorrow</li>
                <li>Assignment: Personalized Study Plan – Next week</li>
                <li>Group Discussion: AI in Education – Next Wednesday</li>
              </ul>
            </div>
          </div>

          {/* Right column: progress + AI assistant */}
          <div className="col-lg-4">
            <div className="feature-box mb-3">
              <h5 className="mb-3">
                <i className="bi bi-graph-up-arrow me-2" />
                Progress Overview
              </h5>

              <div className="mb-2">
                <small className="d-flex justify-content-between text-muted">
                  <span>Overall completion</span>
                  <span>65%</span>
                </small>
                <div className="progress" style={{ height: "6px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: "65%" }}
                    aria-valuenow="65"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>

              <div className="mb-2">
                <small className="d-flex justify-content-between text-muted">
                  <span>Average quiz score</span>
                  <span>78%</span>
                </small>
                <div className="progress" style={{ height: "6px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: "78%" }}
                    aria-valuenow="78"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>

              <div>
                <small className="d-flex justify-content-between text-muted">
                  <span>Weekly activity</span>
                  <span>4 / 5 days</span>
                </small>
                <div className="progress" style={{ height: "6px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: "80%" }}
                    aria-valuenow="80"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
            </div>

            <div className="feature-box">
              <h5 className="mb-2">
                <i className="bi bi-robot me-2" />
                AI Study Assistant
              </h5>
              <p className="mb-3">
                Ask questions, get hints, and receive suggestions on what to
                focus on next based on your recent activity.
              </p>
              <button type="button" className="btn-get-started btn-sm">
                Open AI Assistant
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudentDashboard;
