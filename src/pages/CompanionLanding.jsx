import React from "react";
import "../styles/companion-landing.css";

function CompanionLanding() {
  return (
    <div className="companion-landing">
      <section className="companion-landing__hero">
        <div className="companion-landing__hero-content">
          <h1>CareNest: Compassionate Care at Your Doorstep</h1>
          <p>
            Connecting caring companions with families in need. Safe, reliable,
            and personalized support for the elderly.
          </p>
          <button className="companion-landing__cta">Get Started</button>
        </div>
      </section>

      <section className="companion-landing__features">
        <h2>Why Choose CareNest?</h2>
        <div className="companion-landing__feature-cards">
          <div className="companion-landing__feature-card">
            <h3>Trusted Companions</h3>
            <p>
              Every companion is verified and trained to provide the best care
              for your loved ones.
            </p>
          </div>
          <div className="companion-landing__feature-card">
            <h3>Flexible Scheduling</h3>
            <p>
              Book care when you need it - daily, weekly, or on-demand. Your
              convenience comes first.
            </p>
          </div>
          <div className="companion-landing__feature-card">
            <h3>Transparent Payments</h3>
            <p>
              Track earnings and payments easily. No hidden fees, complete
              transparency.
            </p>
          </div>
        </div>
      </section>

      <section className="companion-landing__testimonials">
        <h2>What Families Say</h2>
        <div className="companion-landing__testimonial-cards">
          <div className="companion-landing__testimonial-card">
            <p>
              "CareNest matched us with a wonderful companion. My mother feels
              happier and safer!"
            </p>
            <h4>- Sarah M.</h4>
          </div>
          <div className="companion-landing__testimonial-card">
            <p>
              "Flexible and reliable service. I love how easy it is to schedule
              help whenever we need it."
            </p>
            <h4>- John D.</h4>
          </div>
        </div>
      </section>

      <footer className="companion-landing__footer">
        <p>© 2026 CareNest. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default CompanionLanding;
