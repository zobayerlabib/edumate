// src/components/layout/Navbar.js
import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header
      id="header"
      className="header d-flex align-items-center"
      style={{ background: "#fff" }}
    >
      <div className="container-fluid container-xl d-flex align-items-center justify-content-between">
        {/* Logo / Brand */}
        <Link to="/" className="logo d-flex align-items-center">
          <span className="brand-text">EDUMATE</span>
        </Link>

        {/* Navigation */}
        <nav id="navbar" className="navbar">
          <ul>
            <li>
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li>
              <a className="nav-link" href="/#about">
                About
              </a>
            </li>
            <li>
              <a className="nav-link" href="/#features">
                Features
              </a>
            </li>
            <li>
              <a className="nav-link" href="/#how-it-works">
                How It Works
              </a>
            </li>
            <li>
              <a className="nav-link" href="/#stats">
                Impact
              </a>
            </li>
          </ul>
        </nav>

        {/* Login / Get Started */}
        <Link to="/login" className="btn-get-started">
          Login / Get Started
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
