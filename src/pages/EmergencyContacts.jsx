import React, { useState, useEffect } from "react";
import "../styles/emergency-contacts.css";

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Note: You'll need to add GET endpoint for emergency contacts
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert("Name and phone number are required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Emergency contact added successfully!");
        setFormData({
          name: "",
          phone: "",
          relationship: "",
          address: "",
          notes: "",
        });
        setShowForm(false);
        // Refresh list
        window.location.reload();
      } else {
        alert("Error adding contact: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding contact");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="emergency-loading">Loading...</div>;

  return (
    <div className="emergency-contacts-container">
      <h1>🚨 Emergency Contacts</h1>
      <p className="subtitle">Keep important contacts for emergencies</p>

      {!showForm && (
        <button className="add-contact-btn" onClick={() => setShowForm(true)}>
          + Add Emergency Contact
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="emergency-form">
          <h2>Add Emergency Contact</h2>

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Contact name"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(000) 000-0000"
              required
            />
          </div>

          <div className="form-group">
            <label>Relationship</label>
            <input
              type="text"
              name="relationship"
              value={formData.relationship}
              onChange={handleInputChange}
              placeholder="e.g., Son, Daughter, Friend"
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Address"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional information..."
              rows="3"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" class name="submit-btn" disabled={submitting}>
              {submitting ? "Adding..." : "Add Contact"}
            </button>
            <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      <div className="contacts-list">
        <h2>📋 Your Emergency Contacts</h2>

        {contacts.length === 0 ? (
          <p className="no-contacts">
            No emergency contacts added yet.
            <br />
            Add at least one emergency contact for quick access in emergencies.
          </p>
        ) : (
          <div className="contacts-grid">
            {contacts.map(contact => (
              <div key={contact._id} className="contact-card">
                <div className="contact-header">
                  <h3>{contact.name}</h3>
                  {contact.relationship && (
                    <span className="relationship">{contact.relationship}</span>
                  )}
                </div>

                <div className="contact-info">
                  <p>📞 <a href={`tel:${contact.phone}`}>{contact.phone}</a></p>
                  {contact.address && <p>📍 {contact.address}</p>}
                  {contact.notes && <p className="notes">{contact.notes}</p>}
                </div>

                <div className="contact-actions">
                  <button className="call-btn" onClick={() => window.location.href = `tel:${contact.phone}`}>
                    💬 Call
                  </button>
                  <button className="delete-btn">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyContacts;
