import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getCompanions, requestCompanion } from "../services/marketplaceService";
import "../styles/dashboard.css";

function ElderlyDashboard() {
  const { user } = useUser();
  const [companions, setCompanions] = useState([]);
  const [filteredCompanions, setFilteredCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(12);
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    fetchCompanions();
  }, []);

  const fetchCompanions = async () => {
    setLoading(true);
    const response = await getCompanions();
    if (response.success) {
      setCompanions(response.data || []);
      setFilteredCompanions(response.data || []);
    }
    setLoading(false);
  };

  const handleFilter = (e) => {
    const query = e.target.value.toLowerCase();
    setFilter(query);

    const filtered = companions.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.specializations.some((s) => s.toLowerCase().includes(query))
    );
    setFilteredCompanions(filtered);
  };

  const handleRequestCompanion = async () => {
    if (!selectedCompanion || !requestMessage.trim() || !startDate) {
      alert("Please fill in all required fields");
      return;
    }

    const response = await requestCompanion(selectedCompanion.id, {
      specializations: selectedCompanion.specializations?.length
        ? [selectedCompanion.specializations[0]]
        : ["general care"],
      hoursPerWeek: Number(hoursPerWeek),
      hourlyRate: Number(selectedCompanion.hourlyRate || 0),
      startDate,
      description: requestMessage,
      message: requestMessage,
    });

    if (response.success) {
      alert("Request sent successfully!");
      setSelectedCompanion(null);
      setRequestMessage("");
      setHoursPerWeek(12);
      setStartDate("");
    } else {
      alert(response.error || "Failed to send request");
    }
  };

  return (
    <div className="dashboard elderly-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name || "Elderly Member"}</h1>
        <p className="dashboard-subtitle">
          Browse and hire compassionate companions for care and support
        </p>
      </header>

      <section className="dashboard-content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, specialization (e.g., dementia care, cooking)..."
            value={filter}
            onChange={handleFilter}
          />
        </div>

        {loading ? (
          <p className="loading">Loading companions...</p>
        ) : filteredCompanions.length === 0 ? (
          <p className="no-results">
            No companions found. Try adjusting your search.
          </p>
        ) : (
          <div className="companions-grid">
            {filteredCompanions.map((companion) => (
              <div key={companion.id} className="companion-card">
                <div className="companion-header">
                  <h3>{companion.name}</h3>
                  {companion.verified && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                </div>

                <div className="companion-rating">
                  <span className="stars">
                    {"★".repeat(Math.floor(companion.rating))}
                  </span>
                  <span className="rating-text">
                    {companion.rating} ({companion.reviews} reviews)
                  </span>
                </div>

                <p className="companion-bio">{companion.bio}</p>

                <div className="companion-details">
                  <p>
                    <strong>Specializations:</strong>{" "}
                    {companion.specializations.join(", ")}
                  </p>
                  <p>
                    <strong>Hourly Rate:</strong> ${companion.hourlyRate}/hour
                  </p>
                  <p>
                    <strong>Availability:</strong> {companion.availability}
                  </p>
                </div>

                <button
                  className="btn-hire"
                  onClick={() => setSelectedCompanion(companion)}
                >
                  Hire This Companion
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedCompanion && (
        <div className="modal-overlay" onClick={() => setSelectedCompanion(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Request {selectedCompanion.name}</h2>
            <p>Let them know more about your needs:</p>
            <label>
              Preferred Start Date
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              Hours Per Week
              <input
                type="number"
                min="1"
                max="80"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
              />
            </label>
            <textarea
              placeholder="Describe your care requirements and preferences..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows="5"
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSelectedCompanion(null)}
              >
                Cancel
              </button>
              <button className="btn-submit" onClick={handleRequestCompanion}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ElderlyDashboard;
