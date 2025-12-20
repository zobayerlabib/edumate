// src/pages/TeacherDashboard.js
import React from "react";

function TeacherDashboard() {
  return (
    <section
      className="py-5"
      style={{ minHeight: "70vh", background: "#f8f9fa" }}
    >
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Teacher Dashboard</h2>
            <p className="text-muted mb-0">
              Monitor class performance, recent assessments, and student engagement.
            </p>
          </div>
          <span className="badge rounded-pill text-bg-primary">
            <i className="bi bi-person-video3 me-1" />
            Teacher
          </span>
        </div>

        <div className="row g-4">
          {/* Left: class overview + actions */}
          <div className="col-lg-4">
            <div className="feature-box mb-3">
              <h5 className="mb-3">
                <i className="bi bi-people-fill me-2" />
                Class Overview
              </h5>
              <p className="mb-1">Active students: 30</p>
              <p className="mb-1">Students needing support: 4</p>
              <p className="mb-0">Average completion rate: 72%</p>
            </div>

            <div className="feature-box">
              <h5 className="mb-3">
                <i className="bi bi-lightbulb me-2" />
                Quick Actions
              </h5>
              <ul className="mb-0">
                <li>Create a new quiz or assignment</li>
                <li>Review AI recommendations for at-risk students</li>
                <li>Export a summary report for this course</li>
              </ul>
            </div>
          </div>

          {/* Right: recent quizzes table */}
          <div className="col-lg-8">
            <div className="feature-box h-100">
              <h5 className="mb-3">
                <i className="bi bi-card-checklist me-2" />
                Recent Quizzes
              </h5>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Course</th>
                      <th>Average Score</th>
                      <th>Responses</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Quiz 3 – Arrays</td>
                      <td>Programming Fundamentals</td>
                      <td>76%</td>
                      <td>28</td>
                    </tr>
                    <tr>
                      <td>Quiz 2 – Intro to AI</td>
                      <td>AI Basics</td>
                      <td>82%</td>
                      <td>31</td>
                    </tr>
                    <tr>
                      <td>Quiz 1 – Getting Started</td>
                      <td>Foundation Course</td>
                      <td>88%</td>
                      <td>34</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 mb-0 text-muted" style={{ fontSize: "0.85rem" }}>
                Use these results to identify topics that may require revision or
                additional support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeacherDashboard;
