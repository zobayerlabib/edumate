// src/sections/StatsSection.js
import React from "react";

function StatsSection() {
  return (
    <section id="stats" className="section stats">
      <div className="container">
        <header className="section-header text-center mb-4">
          <h2>EduMate in Numbers</h2>
          <p>Illustrating the impact a platform like EduMate aims to deliver.</p>
        </header>

        <div className="row gy-4">
          <div className="col-md-3 col-6">
            <div className="stat-box text-center">
              <h3>430+</h3>
              <p className="mb-0">Students supported</p>
            </div>
          </div>

          <div className="col-md-3 col-6">
            <div className="stat-box text-center">
              <h3>38</h3>
              <p className="mb-0">Teachers using EduMate</p>
            </div>
          </div>

          <div className="col-md-3 col-6">
            <div className="stat-box text-center">
              <h3>1200+</h3>
              <p className="mb-0">AI feedback responses</p>
            </div>
          </div>

          <div className="col-md-3 col-6">
            <div className="stat-box text-center">
              <h3>95%</h3>
              <p className="mb-0">Improved learning outcomes (target)</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
