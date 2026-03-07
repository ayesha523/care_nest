import React from "react";

function Drawer({ open, onClose }) {
  return (
    <div className={`drawer ${open ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        ✕
      </button>

      <nav>
        <a href="#home" onClick={onClose}>Home</a>
        <a href="#about" onClick={onClose}>About Us</a>
        <a href="#hire" onClick={onClose}>Hire</a>
        <a href="#info" onClick={onClose}>Information</a>
        <a href="#contact" onClick={onClose}>Contact Us</a>
      </nav>
    </div>
  );
}

export default Drawer;
