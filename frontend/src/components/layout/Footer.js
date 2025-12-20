import React from "react";

function Footer() {
  return (
    <footer className="py-4 bg-white border-top mt-auto">
      <div className="container text-center">
        <small>© {new Date().getFullYear()} EduMate. All rights reserved.</small>
      </div>
    </footer>
  );
}

export default Footer;
