// src/sections/HeroSection.js
import React from "react";
import heroImg from "../assets/online-education.jpeg";

function HeroSection() {
  return (
    <section id="hero" className="hero hero-v2 d-flex align-items-center">
      <div className="container">
        <div className="row gy-4 align-items-center">
          {/* LEFT: text */}
          <div className="col-lg-6">
            <span className="hero-badge">AI-Powered Tutoring Platform</span>

            <h1 className="hero-title mt-3">
              Personalized Learning for Every Student with{" "}
              <span className="text-primary">EduMate</span>
            </h1>

            <p className="hero-subtitle">
              EduMate helps students learn faster with personalized lessons, quizzes,
              and AI-assisted feedback — while teachers and admins track progress in one place.
            </p>

            <div className="mt-3">
              <a href="/login/role-select" className="btn-get-started">
                Get Started
              </a>
            </div>

            <div className="hero-trust mt-4">
              <div className="trust-item">
                <span className="trust-icon">🎯</span> Personalized paths
              </div>
              <div className="trust-item">
                <span className="trust-icon">🧠</span> Smart feedback
              </div>
              <div className="trust-item">
                <span className="trust-icon">📊</span> Progress analytics
              </div>
            </div>
          </div>

          {/* RIGHT: image (locked size so it won't go crazy) */}
          <div className="col-lg-6">
            <div className="hero-image-card">
              <img
                src={heroImg}
                alt="Online education system illustration"
                className="hero-image"
                loading="lazy"
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  height: "320px",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                  position: "static",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
