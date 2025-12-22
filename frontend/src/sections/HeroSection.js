// src/sections/HeroSection.js
import React from "react";

function HeroSection() {
  return (
    <section id="hero" className="hero d-flex align-items-center">
      <div className="container">
        <div className="row gy-4 align-items-center">
          {/* Left */}
          <div className="col-lg-7">
            <span className="hero-badge">AI-Powered Tutoring Platform</span>

            <h1 className="hero-title">
              Personalized Learning for Every Student with{" "}
              <span className="text-primary">EduMate</span>
            </h1>

            <p className="hero-subtitle">
              EduMate helps students learn faster with personalized lessons, quizzes,
              and AI-assisted feedback — while teachers and admins track progress in one place.
            </p>

            <div className="d-flex gap-2 flex-wrap mt-3">
              <a href="/login/role-select" className="btn-get-started">
                Get Started
              </a>

              <a href="#features" className="btn btn-outline-secondary btn-outline-pill">
                Explore Features
              </a>
            </div>

            {/* small trust points */}
            <div className="hero-trust mt-4">
              <div className="trust-item">
                <span className="dot" /> Personalized paths
              </div>
              <div className="trust-item">
                <span className="dot" /> Smart feedback
              </div>
              <div className="trust-item">
                <span className="dot" /> Progress analytics
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="col-lg-5">
            <div className="hero-card">
              <h5 className="mb-2">Built for Students & Educators</h5>
              <p className="mb-3">
                A simple platform where students practice, get feedback, and improve —
                while teachers monitor performance with clear dashboards.
              </p>

              <div className="mini-stats">
                <div className="mini-stat">
                  <div className="mini-value">3</div>
                  <div className="mini-label">User Roles</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-value">AI</div>
                  <div className="mini-label">Feedback</div>
                </div>
                <div className="mini-stat">
                  <div className="mini-value">24/7</div>
                  <div className="mini-label">Access</div>
                </div>
              </div>

              <a href="#how-it-works" className="hero-link mt-3">
                See how it works →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
