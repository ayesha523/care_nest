import React, { useState } from "react";
import Drawer from "./Drawer";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="navbar">
        <div className="logo">
          <div className="logo-icon">CN</div>
          <h1>CareNest</h1>
        </div>

        <nav className="top-menu">
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <a href="#hire">Hire</a>
          <a href="#info">Information</a>
          <a href="#contact">Contact Us</a>
        </nav>

        {/* ✅ TOGGLE OPEN/CLOSE */}
        <button className="hamburger" onClick={() => setOpen((prev) => !prev)}>
          ☰
        </button>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default Navbar;
