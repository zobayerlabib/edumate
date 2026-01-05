// src/sections/AboutSection.js
import React from "react";
import ainaImg from "../assets/female_student.png";
import haziqImg from "../assets/male_student.png";
import lecturerImg from "../assets/female_teacher.png";

function Stars({ count = 5 }) {
  return (
    <div className="stars" aria-label={`${count} star rating`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="star">
          ★
        </span>
      ))}
    </div>
  );
}

function AboutSection() {
  const testimonials = [
    {
      name: "Aina Farah",
      role: "Student",
      rating: 5,
      quote:
        "EduMate explains topics step-by-step and the feedback tells me exactly what to improve.",
      image: ainaImg,
    },
    {
      name: "Haziq Rahman",
      role: "Foundation Student",
      rating: 5,
      quote:
        "After quizzes, it recommends the right lesson. It feels personal, not random.",
      image: haziqImg, 
    },
    {
      name: "Prof. Dr. Slama Ibrahim",
      role: "Lecturer",
      rating: 4,
      quote:
        "The progress tracking is clear. I can quickly identify who needs support early.",
      image: lecturerImg,
    },
  ];

  return (
    <section id="about" className="about section">
      <div className="container">
        {/* Existing About content */}
        <div className="row gy-4 align-items-center">
          <div className="col-lg-6">
            <h2>About EduMate</h2>
            <p>
              EduMate is an AI-powered learning and tutoring platform designed to
              support students, teachers, and administrators in one place.
            </p>
            <p className="mb-0">
              Students receive personalized content and feedback, teachers monitor
              class performance and assessments, and admins gain a clear view of
              overall platform usage and outcomes.
            </p>
          </div>

          <div className="col-lg-6">
            <div className="info-card">
              <h6 className="mb-3">What makes EduMate different</h6>
              <ul className="mb-0">
                <li>
                  Personalized study paths built from learner performance and
                  activity.
                </li>
                <li>Role-based dashboards for students, teachers, and admins.</li>
                <li>
                  Central access to lessons, quizzes, feedback, and progress
                  reports.
                </li>
                <li>
                  Built to integrate with FastAPI backend, AI models, and
                  databases.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Testimonials INSIDE About section */}
        <div className="mt-5">
          <div className="text-center mb-4">
            <h3 className="mb-2">What Users Say</h3>
            <p className="text-muted mb-0">
              Short feedback from students and educators using EduMate.
            </p>
          </div>

          <div className="row gy-4">
            {testimonials.map((t, idx) => (
              <div className="col-md-4" key={idx}>
                <div className="testimonial-card h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="avatar"
                      loading="lazy"
                    />
                    <div>
                      <div className="fw-semibold">{t.name}</div>
                      <div className="text-muted small">{t.role}</div>
                    </div>
                  </div>

                  <Stars count={t.rating} />
                  <p className="mb-0 mt-2">“{t.quote}”</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
