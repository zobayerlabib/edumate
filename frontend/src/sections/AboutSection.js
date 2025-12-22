// src/sections/AboutSection.js
import React from "react";

function AboutSection() {
  return (
    <section id="about" className="about section">
      <div className="container">
        <div className="row gy-4 align-items-center">
          <div className="col-lg-6">
            <h2>About EduMate</h2>
            <p>
              EduMate is an AI-powered learning and tutoring platform designed to support
              students, teachers, and administrators in one place.
            </p>
            <p className="mb-0">
              Students receive personalized content and feedback, teachers monitor class performance
              and assessments, and admins gain a clear view of overall platform usage and outcomes.
            </p>
          </div>

          <div className="col-lg-6">
            <div className="info-card">
              <h6 className="mb-3">What makes EduMate different</h6>
              <ul className="mb-0">
                <li>Personalized study paths built from learner performance and activity.</li>
                <li>Role-based dashboards for students, teachers, and admins.</li>
                <li>Central access to lessons, quizzes, feedback, and progress reports.</li>
                <li>Built to integrate with FastAPI backend, AI models, and databases.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
