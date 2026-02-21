import React from "react";
import ChatBox from "../components/ChatBox";

function Home() {
  return (
    <div className="home-page" id="home">
      {/* HERO */}
      <section className="hero">
        <h1 className="brand">CareNest</h1>

        <h2 className="hero-tagline">Compassionate Care at Your Doorstep</h2>

        <p className="hero-desc">
          Connecting caring companions with families in need — safe, reliable,
          and personalized support for elderly.
        </p>
      </section>

      {/* CARDS (About / Information / Contact) */}
      <section className="info-section">
        <div className="info-card" id="about">
          <h3>About Us</h3>
          <p>
            We provide trusted caregivers and compassionate companions for
            elderly individuals, ensuring respectful, personalized home support.
          </p>
        </div>

        <div className="info-card" id="hire">
          <h3>Hire</h3>
          <p>
            Hire nationally verified caregivers quickly, safely, and with
            complete peace of mind.
          </p>
        </div>

        <div className="info-card" id="info">
          <h3>Information</h3>
          <p>
            Review verified elderly profiles featuring medical background, care
            requirements, and lifestyle preferences — designed for safe and
            personalized companion matching.
          </p>
        </div>

        <div className="info-card" id="contact">
          <h3>Contact Us</h3>
          <p>
            Reach out to our support team for assistance, partnership inquiries,
            or personalized care consultations.
          </p>
          <p style={{ marginTop: "10px", fontWeight: "600" }}>
            Email: support@carenest.com <br />
            Phone: 017xxxxxxxx
          </p>
        </div>
      </section>

      {/* CHAT */}
      <ChatBox />
    </div>
  );
}

export default Home;