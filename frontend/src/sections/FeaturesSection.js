// src/sections/FeaturesSection.js
import React from "react";

function FeaturesSection() {
  const features = [
    {
      tag: "Personalization",
      title: "Personalized Learning Paths",
      desc: "Recommend topics and activities based on each student’s progress, strengths, and areas that need more practice.",
    },
    {
      tag: "Assessment",
      title: "Smart Assessments & Feedback",
      desc: "Manage quizzes and assignments while providing meaningful feedback that helps students understand their performance.",
    },
    {
      tag: "Analytics",
      title: "Progress Tracking & Analytics",
      desc: "Visualize completion rates, quiz scores, and engagement so teachers and admins can make informed decisions.",
    },
    {
      tag: "Dashboards",
      title: "Role-Based Dashboards",
      desc: "Separate views for students, teachers, and administrators, each tailored to their responsibilities.",
    },
    {
      tag: "AI Ready",
      title: "AI-Driven Insights",
      desc: "Planned integration with models like DistilBERT to support personalized recommendations and automated feedback.",
    },
    {
      tag: "Architecture",
      title: "Scalable Web Architecture",
      desc: "Modern React frontend ready to connect to FastAPI backend and cloud-hosted databases.",
    },
  ];

  return (
    <section id="features" className="section features">
      <div className="container">
        <header className="section-header text-center mb-4">
          <h2>Key Features</h2>
          <p>Designed for real classrooms and real learners.</p>
        </header>

        <div className="row gy-4">
          {features.map((f, idx) => (
            <div className="col-md-4" key={idx}>
              <div className="feature-box h-100 feature-card">
                <span className="pill">{f.tag}</span>
                <h5 className="mt-3">{f.title}</h5>
                <p className="mb-0">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
