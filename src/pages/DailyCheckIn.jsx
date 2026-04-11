import React, { useState } from "react";
import "../styles/daily-checkin.css";

const DailyCheckIn = () => {
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const token = localStorage.getItem("token");

  const statusOptions = [
    { value: "good", label: "😊 I'm doing well", color: "green" },
    { value: "okay", label: "😐 I'm okay", color: "yellow" },
    { value: "needs_help", label: "😢 I need help", color: "orange" },
    { value: "emergency", label: "🚨 Emergency!", color: "red" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!status) {
      alert("Please select a status");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/daily-checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setStatus("");
        setNotes("");

        // Show success for 3 seconds, then reset
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } else {
        alert("Error submitting check-in: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting check-in");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="daily-checkin-success">
        <div className="success-message">
          <h1>✅ Check-in Recorded</h1>
          <p>Thank you for checking in. We're here for you!</p>
          {status === "emergency" && (
            <p className="emergency-note">
              ⚠️ Emergency alert has been recorded. Help is on the way if needed.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="daily-checkin-container">
      <div className="checkin-card">
        <h1>☀️ Daily Check-in</h1>
        <p className="subtitle">How are you feeling today?</p>

        <form onSubmit={handleSubmit} className="checkin-form">
          {/* Status Options */}
          <div className="status-options">
            {statusOptions.map(option => (
              <label key={option.value} className={`status-option ${option.color}`}>
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={status === option.value}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Additional Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us how you're feeling..."
              rows="4"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-checkin-btn"
            disabled={!status || submitting}
          >
            {submitting ? "Submitting..." : "Submit Check-in"}
          </button>
        </form>

        {status === "emergency" && (
          <div className="emergency-info">
            <h3>🚨 Emergency Detected</h3>
            <p>If this is a true emergency, please call 911 or your emergency contact immediately.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyCheckIn;
