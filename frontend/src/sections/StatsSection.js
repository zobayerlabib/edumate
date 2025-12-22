// src/sections/StatsSection.js
import React from "react";

function StatsSection() {
  const stats = [
    { value: "430+", label: "Students supported" },
    { value: "38", label: "Teachers using EduMate" },
    { value: "1200+", label: "AI feedback responses" },
    { value: "95%", label: "Improved learning outcomes (target)" },
  ];

  return (
    <section id="stats" className="section stats">
      <div className="container">
        <header className="section-header text-center mb-4">
          <h2>EduMate in Numbers</h2>
          <p>Illustrating the impact a platform like EduMate aims to deliver.</p>
        </header>

        <div className="row gy-4">
          {stats.map((s, idx) => (
            <div className="col-md-3 col-6" key={idx}>
              <div className="stat-box text-center h-100">
                <h3 className="stat-value">{s.value}</h3>
                <p className="mb-0">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
