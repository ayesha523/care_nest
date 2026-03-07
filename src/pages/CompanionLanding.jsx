import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getJobRequests } from "../services/marketplaceService";
import { useUser } from "../context/UserContext";
import "../styles/companion-landing.css";

function CompanionLanding() {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [inquiry, setInquiry] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    skill: "",
    note: "",
  });
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      setLoadingRequests(true);
      const response = await getJobRequests({ status: "open" });

      if (!isMounted) {
        return;
      }

      if (response.success) {
        setRequests(Array.isArray(response.data) ? response.data : []);
        setRequestsError("");
      } else {
        setRequests([]);
        setRequestsError(response.error || "Unable to load job requests.");
      }

      setLoadingRequests(false);
    };

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableSkills = useMemo(() => {
    const skills = requests.flatMap((request) => request.specializations || []);
    return [...new Set(skills)].sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (!skillFilter) {
      return requests.slice(0, 6);
    }

    return requests
      .filter((request) =>
        (request.specializations || []).some(
          (skill) => skill.toLowerCase() === skillFilter.toLowerCase()
        )
      )
      .slice(0, 6);
  }, [requests, skillFilter]);

  const handleInquirySubmit = (event) => {
    event.preventDefault();
    setInquiryError("");
    setInquirySuccess("");

    const name = inquiry.fullName.trim();
    const email = inquiry.email.trim();
    const note = inquiry.note.trim();

    if (name.length < 2) {
      setInquiryError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInquiryError("Please enter a valid email address.");
      return;
    }

    if (!inquiry.skill) {
      setInquiryError("Please choose at least one specialization.");
      return;
    }

    if (note.length < 10) {
      setInquiryError("Please add a short note (minimum 10 characters).");
      return;
    }

    setInquirySuccess(
      "Inquiry submitted successfully. Our team will contact you for onboarding details."
    );
    setInquiry((prev) => ({ ...prev, skill: "", note: "" }));
  };

  return (
    <div className="companion-landing">
      <section className="companion-landing__hero">
        <div className="companion-landing__hero-content">
          <h1>CareNest: Compassionate Care at Your Doorstep</h1>
          <p>
            Connecting caring companions with families in need. Safe, reliable,
            and personalized support for the elderly.
          </p>
          <div className="companion-landing__hero-actions">
            <Link className="companion-landing__cta" to="/companion-signup">
              Become a Companion
            </Link>
            <Link
              className="companion-landing__cta companion-landing__cta--secondary"
              to="/companion-login"
            >
              Companion Login
            </Link>
            {user?.role === "companion" && (
              <Link
                className="companion-landing__cta companion-landing__cta--secondary"
                to="/companion-dashboard"
              >
                Open Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="companion-landing__stats">
        <div className="companion-landing__stat-item">
          <h3>2,500+</h3>
          <p>Families supported</p>
        </div>
        <div className="companion-landing__stat-item">
          <h3>900+</h3>
          <p>Verified companions</p>
        </div>
        <div className="companion-landing__stat-item">
          <h3>4.9/5</h3>
          <p>Average family rating</p>
        </div>
        <div className="companion-landing__stat-item">
          <h3>24/7</h3>
          <p>Support availability</p>
        </div>
      </section>

      <section className="companion-landing__features">
        <h2>Why Choose CareNest?</h2>
        <div className="companion-landing__feature-cards">
          <div className="companion-landing__feature-card">
            <span className="companion-landing__feature-icon">🛡️</span>
            <h3>Trusted Companions</h3>
            <p>
              Every companion is verified and trained to provide the best care
              for your loved ones.
            </p>
          </div>
          <div className="companion-landing__feature-card">
            <span className="companion-landing__feature-icon">🕒</span>
            <h3>Flexible Scheduling</h3>
            <p>
              Book care when you need it - daily, weekly, or on-demand. Your
              convenience comes first.
            </p>
          </div>
          <div className="companion-landing__feature-card">
            <span className="companion-landing__feature-icon">💳</span>
            <h3>Transparent Payments</h3>
            <p>
              Track earnings and payments easily. No hidden fees, complete
              transparency.
            </p>
          </div>
        </div>
      </section>

      <section className="companion-landing__steps">
        <h2>How It Works</h2>
        <div className="companion-landing__step-cards">
          <div className="companion-landing__step-card">
            <div className="companion-landing__step-number">1</div>
            <h3>Create Your Profile</h3>
            <p>
              Add your skills, availability, and care preferences to stand out
              to families.
            </p>
          </div>
          <div className="companion-landing__step-card">
            <div className="companion-landing__step-number">2</div>
            <h3>Receive Job Requests</h3>
            <p>
              Get matched with elderly members nearby and review requests in one
              dashboard.
            </p>
          </div>
          <div className="companion-landing__step-card">
            <div className="companion-landing__step-number">3</div>
            <h3>Provide Quality Care</h3>
            <p>
              Accept jobs, coordinate schedules, and build long-term trusted
              relationships.
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

      <section className="companion-landing__tools">
        <h2>Built for Professional Companions</h2>
        <div className="companion-landing__tool-list">
          <div className="companion-landing__tool-item">
            <h3>Request Management</h3>
            <p>Track open, accepted, and completed jobs in one place.</p>
          </div>
          <div className="companion-landing__tool-item">
            <h3>Smart Matching</h3>
            <p>Get care requests aligned with your specialization.</p>
          </div>
          <div className="companion-landing__tool-item">
            <h3>Secure Messaging</h3>
            <p>Communicate safely with families before and after accepting.</p>
          </div>
        </div>
      </section>

      <section className="companion-landing__requests">
        <div className="companion-landing__requests-header">
          <h2>Live Open Requests</h2>
          <div className="companion-landing__requests-filter">
            <label htmlFor="skill-filter">Skill:</label>
            <select
              id="skill-filter"
              value={skillFilter}
              onChange={(event) => setSkillFilter(event.target.value)}
            >
              <option value="">All skills</option>
              {availableSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingRequests ? (
          <p className="companion-landing__state">Loading requests...</p>
        ) : requestsError ? (
          <p className="companion-landing__state companion-landing__state--error">
            {requestsError}
          </p>
        ) : filteredRequests.length === 0 ? (
          <p className="companion-landing__state">
            No open requests matched this skill.
          </p>
        ) : (
          <div className="companion-landing__requests-grid">
            {filteredRequests.map((request) => (
              <article className="companion-landing__request-card" key={request.id}>
                <div className="companion-landing__request-head">
                  <h3>{request.elderlyName || "Family Request"}</h3>
                  <span>${request.hourlyRate || 0}/hr</span>
                </div>
                <p>
                  <strong>Skills:</strong>{" "}
                  {(request.specializations || []).join(", ") || "Not specified"}
                </p>
                <p>
                  <strong>Hours/week:</strong> {request.hoursPerWeek || 0}
                </p>
                <p className="companion-landing__request-desc">
                  {request.description || "No description provided."}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="companion-landing__inquiry">
        <h2>Start Your Companion Journey</h2>
        <p>
          Submit your details and specialization to get onboarding guidance from
          CareNest.
        </p>
        <form className="companion-landing__inquiry-form" onSubmit={handleInquirySubmit}>
          <input
            type="text"
            placeholder="Full name"
            value={inquiry.fullName}
            onChange={(event) =>
              setInquiry((prev) => ({ ...prev, fullName: event.target.value }))
            }
          />
          <input
            type="email"
            placeholder="Email address"
            value={inquiry.email}
            onChange={(event) =>
              setInquiry((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <select
            value={inquiry.skill}
            onChange={(event) =>
              setInquiry((prev) => ({ ...prev, skill: event.target.value }))
            }
          >
            <option value="">Select specialization</option>
            {availableSkills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
          <textarea
            rows="4"
            placeholder="Tell us about your care experience"
            value={inquiry.note}
            onChange={(event) =>
              setInquiry((prev) => ({ ...prev, note: event.target.value }))
            }
          />
          <button type="submit">Submit Inquiry</button>
          {inquiryError && (
            <p className="companion-landing__form-feedback companion-landing__form-feedback--error">
              {inquiryError}
            </p>
          )}
          {inquirySuccess && (
            <p className="companion-landing__form-feedback companion-landing__form-feedback--success">
              {inquirySuccess}
            </p>
          )}
        </form>
      </section>

      <footer className="companion-landing__footer">
        <p>© 2026 CareNest. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default CompanionLanding;
