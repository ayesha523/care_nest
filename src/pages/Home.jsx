import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import { getCompanions } from "../services/marketplaceService";
import { useUser } from "../context/UserContext";

function Home() {
  const { user } = useUser();
  const [companions, setCompanions] = useState([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const [companionsError, setCompanionsError] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCompanions = async () => {
      setLoadingCompanions(true);
      const response = await getCompanions();

      if (!isMounted) {
        return;
      }

      if (response.success) {
        const data = Array.isArray(response.data) ? response.data : [];
        setCompanions(data);
        setCompanionsError("");
      } else {
        setCompanions([]);
        setCompanionsError(response.error || "Unable to load companions right now.");
      }

      setLoadingCompanions(false);
    };

    loadCompanions();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredCompanions = useMemo(() => {
    const base = specializationFilter
      ? companions.filter((companion) =>
          companion.specializations?.some(
            (item) => item.toLowerCase() === specializationFilter.toLowerCase()
          )
        )
      : companions;

    return [...base]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [companions, specializationFilter]);

  const availableSpecializations = useMemo(() => {
    const allSpecializations = companions.flatMap(
      (companion) => companion.specializations || []
    );
    return [...new Set(allSpecializations)].sort();
  }, [companions]);

  const faqItems = [
    {
      question: "How do I choose the right companion?",
      answer:
        "You can filter by specialization, rating, and availability, then compare profiles before sending a request.",
    },
    {
      question: "Are companions verified?",
      answer:
        "Yes, CareNest verifies profiles before listing and provides transparent ratings and reviews.",
    },
    {
      question: "How quickly can care start?",
      answer:
        "Most families receive responses within 24 hours depending on companion availability and location.",
    },
    {
      question: "Can I change or cancel a request?",
      answer:
        "Yes, requests are manageable from your dashboard and you can coordinate directly with your selected companion.",
    },
  ];

  const handleContactSubmit = (event) => {
    event.preventDefault();
    setContactError("");
    setContactSuccess("");

    const trimmedName = contactForm.name.trim();
    const trimmedEmail = contactForm.email.trim();
    const trimmedMessage = contactForm.message.trim();

    if (trimmedName.length < 2) {
      setContactError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setContactError("Please enter a valid email address.");
      return;
    }

    if (trimmedMessage.length < 10) {
      setContactError("Please write a message with at least 10 characters.");
      return;
    }

    setContactSuccess("Thanks! Your message has been received. We'll contact you shortly.");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="home-page" id="home">
      <section className="hero">
        <h1 className="brand">CareNest</h1>

        <h2 className="hero-tagline">Compassionate Care at Your Doorstep</h2>

        <p className="hero-desc">
          Connecting caring companions with families in need — safe, reliable,
          and personalized support for elderly.
        </p>

        <div className="hero-actions">
          <Link to="/elderly-signup" className="hero-btn hero-btn--primary">
            Find a Companion
          </Link>
          <Link to="/companion-signup" className="hero-btn hero-btn--secondary">
            Join as Companion
          </Link>
          {user?.role === "elderly" && (
            <Link to="/elderly-dashboard" className="hero-btn hero-btn--secondary">
              Open Dashboard
            </Link>
          )}
        </div>
      </section>

      <section className="trust-strip">
        <div className="trust-item">
          <h3>2,500+</h3>
          <p>Elderly users supported</p>
        </div>
        <div className="trust-item">
          <h3>900+</h3>
          <p>Verified companions</p>
        </div>
        <div className="trust-item">
          <h3>4.9/5</h3>
          <p>Average rating</p>
        </div>
        <div className="trust-item">
          <h3>24/7</h3>
          <p>Support team</p>
        </div>
      </section>

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
            Hire verified caregivers quickly, safely, and with complete peace
            of mind through one structured flow.
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

        <div className="info-card">
          <h3>Contact Us</h3>
          <p>
            Reach out to our support team for assistance, care consultations,
            or partnership inquiries.
          </p>
          <p className="contact-details">
            Email: support@carenest.com <br />
            Phone: 017xxxxxxxx
          </p>
        </div>
      </section>

      <section className="companions-preview" id="info">
        <div className="section-header-row">
          <h2>Featured Companions</h2>
          <div className="companions-filter">
            <label htmlFor="specialization">Filter:</label>
            <select
              id="specialization"
              value={specializationFilter}
              onChange={(event) => setSpecializationFilter(event.target.value)}
            >
              <option value="">All Skills</option>
              {availableSpecializations.map((specialization) => (
                <option key={specialization} value={specialization}>
                  {specialization}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingCompanions ? (
          <p className="section-state">Loading companions...</p>
        ) : companionsError ? (
          <p className="section-state section-error">{companionsError}</p>
        ) : featuredCompanions.length === 0 ? (
          <p className="section-state">No companions matched this filter.</p>
        ) : (
          <div className="featured-companions-grid">
            {featuredCompanions.map((companion) => (
              <div className="featured-companion-card" key={companion.id}>
                <div className="featured-companion-head">
                  <h4>{companion.name}</h4>
                  <span className="featured-rating">★ {companion.rating || 0}</span>
                </div>
                <p className="featured-bio">{companion.bio || "Companion profile"}</p>
                <p>
                  <strong>Skills:</strong>{" "}
                  {(companion.specializations || []).join(", ") || "Not specified"}
                </p>
                <p>
                  <strong>Rate:</strong> ${companion.hourlyRate || 0}/hour
                </p>
                <p>
                  <strong>Availability:</strong>{" "}
                  {companion.availability || "Not specified"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="services-section">
        <h2>Popular Care Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <h4>Daily Companionship</h4>
            <p>Social support, conversation, and safe supervision at home.</p>
          </div>
          <div className="service-card">
            <h4>Mobility Assistance</h4>
            <p>Support for walking, movement, and daily routine activities.</p>
          </div>
          <div className="service-card">
            <h4>Meal & Medication Reminders</h4>
            <p>Timely reminders to help maintain healthy daily habits.</p>
          </div>
        </div>
      </section>

      <section className="process-section">
        <h2>How CareNest Works</h2>
        <div className="process-steps">
          <div className="process-step">
            <span className="process-number">1</span>
            <h4>Create Your Account</h4>
            <p>Sign up as an elderly member or companion in minutes.</p>
          </div>
          <div className="process-step">
            <span className="process-number">2</span>
            <h4>Get Matched</h4>
            <p>Browse or receive personalized matches based on care needs.</p>
          </div>
          <div className="process-step">
            <span className="process-number">3</span>
            <h4>Start Care</h4>
            <p>Connect, schedule, and begin compassionate support.</p>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <button
              key={item.question}
              className="faq-item"
              onClick={() => setExpandedFaq(index === expandedFaq ? -1 : index)}
              type="button"
            >
              <div className="faq-question-row">
                <h4>{item.question}</h4>
                <span>{expandedFaq === index ? "−" : "+"}</span>
              </div>
              {expandedFaq === index && <p>{item.answer}</p>}
            </button>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <h2>Contact CareNest</h2>
        <p>Need help with onboarding or matching? Send us a message.</p>
        <form className="contact-form" onSubmit={handleContactSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={contactForm.name}
            onChange={(event) =>
              setContactForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <input
            type="email"
            placeholder="Your email"
            value={contactForm.email}
            onChange={(event) =>
              setContactForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
          <textarea
            rows="4"
            placeholder="How can we help you?"
            value={contactForm.message}
            onChange={(event) =>
              setContactForm((prev) => ({ ...prev, message: event.target.value }))
            }
          />
          <button type="submit">Send Message</button>
          {contactError && <p className="form-feedback form-feedback--error">{contactError}</p>}
          {contactSuccess && (
            <p className="form-feedback form-feedback--success">{contactSuccess}</p>
          )}
        </form>
      </section>

      <ChatBox />
    </div>
  );
}

export default Home;