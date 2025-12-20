// src/sections/HeroSection.js
import React from "react";

function HeroSection() {
  return (
    <section id="hero" className="hero d-flex align-items-center">
      <div className="container">
        <div className="row gy-4 d-flex justify-content-between align-items-center">
          <div className="col-lg-6 d-flex flex-column justify-content-center">
            <h1>Personalized Learning for Every Student with <span className="text-primary">EduMate</span></h1>
            <p>
              EduMate combines structured course content with AI-driven recommendations
              to deliver tailored learning experiences and clear insights for educators.
            </p>

            <div className="d-flex">
              <a href="/login" className="btn-get-started me-2">
                Get Started
              </a>
              <a href="#about" className="btn btn-outline-secondary">
                Learn More
              </a>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="feature-box text-center">
              <h5>EduMate learning dashboard</h5>
              <p className="mb-0">
                A single place to view lessons, quizzes, feedback, and progress –
                tailored to each learner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
