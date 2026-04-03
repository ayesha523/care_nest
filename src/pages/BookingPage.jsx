import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/booking-page.css";

const BookingPage = () => {
  const { companionId } = useParams();
  const navigate = useNavigate();
  const [companion, setCompanion] = useState(null);
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    services: [],
    location: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const availableServices = ["reading", "talking", "walking", "tech-help", "cooking", "gardening"];

  useEffect(() => {
    fetchCompanion();
  }, [companionId]);

  const fetchCompanion = async () => {
    try {
      const response = await fetch(`/api/profile/${companionId}`);
      const data = await response.json();

      if (data.success) {
        setCompanion(data.user);
      }
    } catch (error) {
      console.error("Error fetching companion:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;

    const start = new Date(`${bookingData.startDate} ${bookingData.startTime || "00:00"}`);
    const end = new Date(`${bookingData.endDate} ${bookingData.endTime || "00:00"}`);

    const hours = (end - start) / (1000 * 60 * 60);
    return Math.ceil(Math.max(0, hours));
  };

  const handleServiceToggle = (service) => {
    setBookingData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bookingData.startDate || !bookingData.endDate || !bookingData.services.length) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          companionId,
          ...bookingData,
          duration: calculateDuration(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Booking created successfully!");
        navigate("/dashboard");
      } else {
        alert("Error creating booking: " + data.message);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Error creating booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="booking-loading">Loading...</div>;
  if (!companion) return <div className="booking-error">Companion not found</div>;

  const totalCost = calculateDuration() * (companion.hourlyRate || 0);

  return (
    <div className="booking-page-container">
      <h1>Book a Companion</h1>

      <div className="booking-layout">
        {/* Companion Summary */}
        <aside className="companion-summary">
          <div className="summary-card">
            <img
              src={companion.profilePicture || "https://via.placeholder.com/150"}
              alt={companion.name}
            />
            <h3>{companion.name}</h3>
            <p className="rating">
              ⭐ {companion.rating ? companion.rating.toFixed(1) : "No rating"}
            </p>

            {companion.volunteeerMode ? (
              <p className="volunteer-text">🎓 Volunteer</p>
            ) : (
              <p className="hourly-rate">${companion.hourlyRate}/hour</p>
            )}

            {companion.skills?.length > 0 && (
              <div className="skills-preview">
                <p className="label">Skills:</p>
                {companion.skills.slice(0, 3).map(skill => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="price-breakdown">
            <h4>Booking Summary</h4>
            <div className="price-row">
              <span>Duration:</span>
              <strong>{calculateDuration()} hours</strong>
            </div>
            <div className="price-row">
              <span>Hourly Rate:</span>
              <strong>${companion.hourlyRate || 0}/hr</strong>
            </div>
            <div className="price-divider"></div>
            <div className="price-row total">
              <span>Total Cost:</span>
              <strong>${totalCost.toFixed(2)}</strong>
            </div>
          </div>
        </aside>

        {/* Booking Form */}
        <main className="booking-form-section">
          <form onSubmit={handleSubmit} className="booking-form">
            {/* Date Selection */}
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={bookingData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={bookingData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={bookingData.endDate}
                onChange={handleInputChange}
                min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>
              <input
                type="time"
                name="endTime"
                value={bookingData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Services Selection */}
            <div className="form-group">
              <label>Services Needed *</label>
              <div className="services-checkboxes">
                {availableServices.map(service => (
                  <label key={service} className="service-checkbox">
                    <input
                      type="checkbox"
                      checked={bookingData.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                    />
                    <span>{service.replace(/-/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="Address or location description"
                value={bookingData.location}
                onChange={handleInputChange}
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                name="notes"
                placeholder="Any special requests or important information..."
                rows="5"
                value={bookingData.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? "Creating Booking..." : "Request Booking"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default BookingPage;
