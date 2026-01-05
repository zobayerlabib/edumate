import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoImg from "../../assets/edumate-logo.jpeg";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const sections = [
    { id: "hero", label: "Home" },
    { id: "about", label: "About" },
    { id: "features", label: "Features" },
    { id: "how-it-works", label: "Workflow" },
    { id: "stats", label: "Impact" },
  ];

  const [activeSection, setActiveSection] = useState("hero");

  const getHeaderOffset = () => {
    const header = document.getElementById("header");
    return (header?.offsetHeight || 0) + 10;
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const headerOffset = getHeaderOffset();
    const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
    const targetTop = elementTop - headerOffset;

    window.scrollTo({ top: targetTop, behavior: "smooth" });

    if (window.location.hash !== `#${id}`) {
      window.history.replaceState(null, "", `#${id}`);
    }
    setActiveSection(id);
  };

  const onNavClick = (e, id) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToId(id), 250);
      return;
    }

    scrollToId(id);
  };

  // Update active tab on scroll (reliable)
  useEffect(() => {
    if (location.pathname !== "/") return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const headerOffset = getHeaderOffset();
        const scrollPos = window.scrollY + headerOffset + 5;

        let current = "hero";
        for (const s of sections) {
          const el = document.getElementById(s.id);
          if (!el) continue;
          if (el.offsetTop <= scrollPos) current = s.id;
        }

        setActiveSection(current);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <header id="header" className="header d-flex align-items-center header-solid">
      <div className="container-fluid container-xl d-flex align-items-center justify-content-between">
        {/* Logo */}
        <Link to="/" className="logo d-flex align-items-center">
          <span className="logo-badge" aria-label="EduMate logo">
            <img src={logoImg} alt="EduMate Logo" className="logo-img logo-img--big" />
          </span>
          <span className="brand-text">EduMate</span>
        </Link>

        {/* Navigation */}
        <nav id="navbar" className="navbar">
          <ul>
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`nav-scroll-link ${location.pathname === "/" && activeSection === s.id ? "active-section" : ""}`}
                  onClick={(e) => onNavClick(e, s.id)}
                >
                  {s.label}
                </a>
              </li>
            ))}

            {/* Dashboard tabs */}
            {isAuthenticated && user?.role === "student" && (
              <li>
                <NavLink to="/student" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  Dashboard
                </NavLink>
              </li>
            )}

            {isAuthenticated && user?.role === "teacher" && (
              <li>
                <NavLink to="/teacher" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  Dashboard
                </NavLink>
              </li>
            )}

            {isAuthenticated && user?.role === "admin" && (
              <li>
                <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  Dashboard
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* CTA */}
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
