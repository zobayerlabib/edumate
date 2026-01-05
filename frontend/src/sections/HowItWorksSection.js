// src/sections/HowItWorksSection.js
import React from "react";

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <header className="section-header text-center mb-4">
          <h2>How It Works</h2>
          <p>Simple steps from onboarding to insight.</p>
        </header>

        <div className="row gy-4">
          <div className="col-md-4">
            <div className="step-card h-100">
              <span className="step-number">1</span>
              <h5 className="mt-3">Sign Up & Choose Role</h5>
              <p className="mb-0">
                Users access EduMate as students, teachers, or admins, each with a dedicated dashboard and permissions.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="step-card h-100">
              <span className="step-number">2</span>
              <h5 className="mt-3">Learn with Personalized Content</h5>
              <p className="mb-0">
                Students complete lessons and quizzes while EduMate tailors next activities based on performance.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="step-card h-100">
              <span className="step-number">3</span>
              <h5 className="mt-3">Track Progress & Take Action</h5>
              <p className="mb-0">
                Teachers and admins monitor dashboards, identify trends, and support learners using insights.
              </p>
            </div>
          </div>
        </div>

        <div className="tip-bar mt-4">
          <strong>Tip:</strong> Start with quizzes → get feedback → improve faster with recommended lessons.
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
