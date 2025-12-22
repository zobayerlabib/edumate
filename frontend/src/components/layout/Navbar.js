// src/components/layout/Navbar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header id="header" className="header d-flex align-items-center">
      <div className="container-fluid container-xl d-flex align-items-center justify-content-between">
        {/* Logo / Brand */}
        <Link to="/" className="logo d-flex align-items-center">
          <span className="logo-badge" aria-label="EduMate logo">
            <img
              src="/assets/img/edumate-logo.png"
              alt="EduMate Logo"
              className="logo-img"
            />
          </span>

          <span className="brand-text">EduMate</span>
        </Link>

        {/* Navigation */}
        <nav id="navbar" className="navbar">
          <ul>
            <li>
              <a className="nav-link" href="/#hero">Home</a>
            </li>
            <li>
              <a className="nav-link" href="/#about">About</a>
            </li>
            <li>
              <a className="nav-link" href="/#features">Features</a>
            </li>
            <li>
              <a className="nav-link" href="/#how-it-works">How It Works</a>
            </li>
            <li>
              <a className="nav-link" href="/#stats">Impact</a>
            </li>
          </ul>
        </nav>

        {/* CTA Button */}
        {isAuthenticated ? (
          <button
            className="btn-get-started"
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout ({user?.role})
          </button>
        ) : (
          <Link to="/login/role-select" className="btn-get-started">
            Login / Get Started
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
