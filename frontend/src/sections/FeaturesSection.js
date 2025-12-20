// src/sections/FeaturesSection.js
import React from "react";

function FeaturesSection() {
  return (
    <section id="features" className="section features">
      <div className="container">
        <header className="section-header text-center mb-4">
          <h2>Key Features</h2>
          <p>Designed for real classrooms and real learners.</p>
        </header>

        <div className="row gy-4">
          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5>Personalized Learning Paths</h5>
              <p className="mb-0">
                Recommend topics and activities based on each student’s progress,
                strengths, and areas that need more practice.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5>Smart Assessments & Feedback</h5>
              <p className="mb-0">
                Manage quizzes and assignments while providing meaningful feedback
                that helps students understand their performance.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5>Progress Tracking & Analytics</h5>
              <p className="mb-0">
                Visualize completion rates, quiz scores, and engagement so teachers
                and admins can make informed decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="row gy-4 mt-3">
          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5>Role-Based Dashboards</h5>
              <p className="mb-0">
                Separate views for students, teachers, and administrators, each
                tailored to their responsibilities.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5>AI-Driven Insights</h5>
              <p className="mb-0">
                Planned integration with models like DistilBERT to support
                personalized recommendations and automated feedback.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="feature-box h-100">
              <h5>Scalable Web Architecture</h5>
              <p className="mb-0">
                Built as a modern React web application ready to connect to a
                FastAPI backend and cloud-hosted databases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
