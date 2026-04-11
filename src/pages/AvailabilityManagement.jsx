import React, { useState, useEffect } from "react";
import "../styles/availability-management.css";

const AvailabilityManagement = () => {
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: "09:00",
    endTime: "17:00",
    isRecurring: true,
    specificDate: "",
    isAvailable: true,
  });

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/availability/me/all", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setAvailabilitySlots(data.availability);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Availability added successfully!");
        setFormData({
          dayOfWeek: 0,
          startTime: "09:00",
          endTime: "17:00",
          isRecurring: true,
          specificDate: "",
          isAvailable: true,
        });
        setShowForm(false);
        fetchAvailability();
      } else {
        alert("Error adding availability: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding availability");
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm("Delete this availability slot?")) return;

    try {
      const response = await fetch(`/api/availability/${slotId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        fetchAvailability();
      } else {
        alert("Error deleting slot: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting slot");
    }
  };

  // Group slots by day
  const slotsByDay = {};
  days.forEach((_, i) => {
    slotsByDay[i] = availabilitySlots.filter(slot => slot.dayOfWeek === i);
  });

  if (loading) return <div className="availability-loading">Loading...</div>;

  return (
    <div className="availability-management-container">
      <h1>⏰ Manage Your Availability</h1>
      <p className="subtitle">Companions: Set your availability schedule</p>

      {!showForm && (
        <button className="add-slot-btn" onClick={() => setShowForm(true)}>
          + Add Availability Slot
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="availability-form">
          <h2>Add Availability</h2>

          <div className="form-group">
            <label>Day of Week *</label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
              required
            >
              {days.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              />
              <span>Repeat every week</span>
            </label>
          </div>

          {!formData.isRecurring && (
            <div className="form-group">
              <label>Specific Date</label>
              <input
                type="date"
                value={formData.specificDate}
                onChange={(e) => setFormData(prev => ({ ...prev, specificDate: e.target.value }))}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="submit-btn">Add Availability</button>
            <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Availability Schedule */}
      <div className="availability-schedule">
        <h2>📅 Your Schedule</h2>

        {availabilitySlots.length === 0 ? (
          <p className="no-slots">No availability slots set yet</p>
        ) : (
          <div className="weekly-view">
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="day-column">
                <h3>{day}</h3>

                {slotsByDay[dayIndex].length === 0 ? (
                  <p className="no-availability">Not available</p>
                ) : (
                  <div className="slots-list">
                    {slotsByDay[dayIndex].map(slot => (
                      <div key={slot._id} className="slot-item">
                        <div className="slot-time">
                          <p>{slot.startTime} - {slot.endTime}</p>
                          {slot.isRecurring && <p className="recurring">Recurring</p>}
                        </div>
                        <button
                          className="delete-btn"
                          onClick={() => deleteSlot(slot._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManagement;
