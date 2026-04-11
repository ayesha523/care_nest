import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../styles/job-postings.css";

/**
 * JobPostings Component
 * Allows elderly users to post care job requests and manage applications
 * Inspired by Care.com's job posting system
 * Companions can browse and apply to jobs
 * 
 * Features:
 * - Create new job postings
 * - Manage active/closed postings
 * - View applications from companions
 * - Set hourly rates and schedules
 * - Describe care needs in detail
 * 
 * @returns {React.ReactNode} Job posting management interface
 */
function JobPostings() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [jobListings, setJobListings] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    jobTitle: "",
    description: "",
    careType: "companionship",
    hoursPerWeek: 10,
    hourlyRate: 25,
    startDate: "",
    specialRequirements: "",
    location: "",
    agePreference: "",
    experience: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("carenest_token") || localStorage.getItem("token");

  // Fetch job listings
  useEffect(() => {
    const fetchJobListings = async () => {
      if (!user || user.role !== "elderly") {
        navigate("/elderly-dashboard");
        return;
      }

      try {
        const response = await fetch(`/api/job-postings/user/${user.id || user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setJobListings(data.jobs || []);
          setError("");
        } else if (response.status === 401) {
          setError("Session expired. Please log in again.");
        }
      } catch (err) {
        console.error("Error fetching job listings:", err);
        setError("Failed to load job postings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobListings();
  }, [user, token, navigate]);

  /**
   * Handles form input changes
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "hoursPerWeek" || name === "hourlyRate" ? parseFloat(value) : value
    }));
  };

  /**
   * Creates new job posting
   * @param {Event} e - Form submit event
   */
  const handleCreateJob = async (e) => {
    e.preventDefault();

    if (!formData.jobTitle || !formData.description || !formData.startDate) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/job-postings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id || user._id,
          userName: user.name || user.fullName,
          status: "open"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobListings([...jobListings, data.job]);
        setFormData({
          jobTitle: "",
          description: "",
          careType: "companionship",
          hoursPerWeek: 10,
          hourlyRate: 25,
          startDate: "",
          specialRequirements: "",
          location: "",
          agePreference: "",
          experience: ""
        });
        setShowCreateForm(false);
        setSuccess("Job posting created successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Failed to create job posting. Please try again.");
      }
    } catch (err) {
      console.error("Error creating job:", err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Closes/archives job posting
   * @param {string} jobId - Job posting ID to close
   */
  const handleCloseJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to close this job posting?")) {
      return;
    }

    try {
      const response = await fetch(`/api/job-postings/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "closed" }),
      });

      if (response.ok) {
        setJobListings(jobListings.map(job =>
          job.id === jobId ? { ...job, status: "closed" } : job
        ));
        setSuccess("Job posting closed.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to close job posting.");
      }
    } catch (err) {
      console.error("Error closing job:", err);
      setError("Network error. Please try again.");
    }
  };

  const careTypeOptions = [
    "companionship",
    "mobility assistance",
    "dementia care",
    "meal preparation",
    "light housekeeping",
    "medication reminders",
    "transportation",
    "physical therapy support"
  ];

  if (loading) {
    return <div className="loading-container">Loading job postings...</div>;
  }

  return (
    <div className="job-postings-container">
      <div className="job-header">
        <h1>📋 Post Care Jobs</h1>
        <p className="subtitle">
          Share your care needs and let experienced companions apply directly
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!showCreateForm && (
        <button className="create-job-btn" onClick={() => setShowCreateForm(true)}>
          + Create New Job Posting
        </button>
      )}

      {showCreateForm && (
        <div className="create-job-form-container">
          <h2>Create a New Job Posting</h2>
          <form onSubmit={handleCreateJob} className="job-form">
            
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                placeholder="e.g., Daily Companion Care Needed"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Care Type *</label>
                <select
                  name="careType"
                  value={formData.careType}
                  onChange={handleInputChange}
                >
                  {careTypeOptions.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Hours per Week *</label>
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleInputChange}
                  min="1"
                  max="168"
                  required
                />
              </div>

              <div className="form-group">
                <label>Hourly Rate ($) *</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  min="10"
                  max="100"
                  step="0.50"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what you need help with, your schedule, preferences, etc."
                rows="5"
                required
              />
            </div>

            <div className="form-group">
              <label>Special Requirements or Preferences</label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                placeholder="Any specific needs, allergies, routines, or preferences?"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Preferred Experience Level</label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">1-3 Years</option>
                  <option value="experienced">3+ Years</option>
                  <option value="certified">Certified Professional</option>
                </select>
              </div>

              <div className="form-group">
                <label>Age Preference</label>
                <input
                  type="text"
                  name="agePreference"
                  value={formData.agePreference}
                  onChange={handleInputChange}
                  placeholder="e.g., 25-40, No preference, etc."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Creating..." : "Post This Job"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job Listings */}
      <div className="job-listings">
        <h2>Your Job Postings</h2>
        
        {jobListings.length === 0 && !showCreateForm && (
          <div className="empty-state">
            <p>📝 No job postings yet</p>
            <p>Create your first posting to connect with experienced companions</p>
          </div>
        )}

        {jobListings.map(job => (
          <div key={job.id || job._id} className={`job-card ${job.status}`}>
            <div className="job-card-header">
              <h3>{job.jobTitle}</h3>
              <span className={`status-badge ${job.status}`}>
                {job.status === "open" ? "🟢 Open" : "🔴 Closed"}
              </span>
            </div>

            <div className="job-info-row">
              <div className="info-item">
                <span className="label">Care Type:</span>
                <span className="value">{job.careType}</span>
              </div>
              <div className="info-item">
                <span className="label">Hours/Week:</span>
                <span className="value">{job.hoursPerWeek} hours</span>
              </div>
              <div className="info-item">
                <span className="label">Rate:</span>
                <span className="value">${job.hourlyRate}/hr</span>
              </div>
              <div className="info-item">
                <span className="label">Start Date:</span>
                <span className="value">{new Date(job.startDate).toLocaleDateString()}</span>
              </div>
            </div>

            <p className="job-description">{job.description}</p>

            {job.specialRequirements && (
              <p className="special-requirements">
                <strong>Special Requirements:</strong> {job.specialRequirements}
              </p>
            )}

            <div className="job-card-footer">
              <button
                className="view-applications-btn"
                onClick={() => setSelectedJob(job)}
              >
                👥 View Applications ({job.applicationCount || 0})
              </button>
              
              {job.status === "open" && (
                <button
                  className="close-job-btn"
                  onClick={() => handleCloseJob(job.id || job._id)}
                >
                  Close Job
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Applications Detail Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedJob(null)}>×</button>
            <h2>Applications for: {selectedJob.jobTitle}</h2>
            <div className="applications-list">
              {selectedJob.applications && selectedJob.applications.length > 0 ? (
                selectedJob.applications.map(app => (
                  <div key={app.id || app._id} className="application-item">
                    <div className="applicant-info">
                      <h4>{app.companionName}</h4>
                      <p>⭐ Rating: {app.rating}/5.0 ({app.reviews} reviews)</p>
                      <p>📝 Experience: {app.experience}</p>
                      <p className="message">"{app.message}"</p>
                    </div>
                    <div className="application-actions">
                      <button className="accept-btn">✓ Accept</button>
                      <button className="message-btn">💬 Message</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-applications">No applications yet. Share this job to get started!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobPostings;
