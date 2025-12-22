// src/sections/CallToAction.js
import React from "react";

function CallToAction() {
  return (
    <section id="cta" className="section cta">
      <div className="container text-center">
        <h2 className="mb-3">Ready to Build with EduMate?</h2>
        <p className="mb-4">
          Use EduMate as the foundation for a modern, AI-aware learning environment where students receive support
          that matches their needs.
        </p>
        <a href="/login" className="btn-get-started">
          Get Started with EduMate
        </a>
      </div>
    </section>
  );
}

export default CallToAction;
