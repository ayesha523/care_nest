import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getJobRequests, acceptJobRequest } from "../services/marketplaceService";
import "../styles/dashboard.css";

function CompanionDashboard() {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    const response = await getJobRequests({ status: statusFilter });
    if (response.success) {
      setRequests(response.data || []);
      setFilteredRequests(response.data || []);
    }
    setLoading(false);
  };

  const handleAcceptRequest = async (requestId) => {
    setAcceptingId(requestId);
    const response = await acceptJobRequest(requestId);

    if (response.success) {
      alert("Request accepted! Contact the elderly member to confirm details.");
      fetchRequests();
    } else {
      alert(response.error || "Failed to accept request");
    }
    setAcceptingId(null);
  };

  return (
    <div className="dashboard companion-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name || "Companion"}</h1>
        <p className="dashboard-subtitle">
          Review job requests and manage your care assignments
        </p>
      </header>

      <section className="dashboard-content">
        <div className="status-filter">
          <label>Filter by status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="open">Open Requests</option>
            <option value="accepted">Accepted Jobs</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <p className="loading">Loading job requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="no-results">
            No {statusFilter} requests available right now.
          </p>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.elderlyName}</h3>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status}
                  </span>
                </div>

                <div className="request-details">
                  <p>
                    <strong>Needed Skills:</strong>{" "}
                    {request.specializations.join(", ")}
                  </p>
                  <p>
                    <strong>Hours/Week:</strong> {request.hoursPerWeek} hours
                  </p>
                  <p>
                    <strong>Rate:</strong> ${request.hourlyRate}/hour
                  </p>
                  <p>
                    <strong>Start Date:</strong>{" "}
                    {new Date(request.startDate).toLocaleDateString()}
                  </p>
                  <p className="request-description">
                    <strong>Care Details:</strong> {request.description}
                  </p>
                </div>

                <div className="request-actions">
                  {request.status === "open" && (
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={acceptingId === request.id}
                    >
                      {acceptingId === request.id ? "Accepting..." : "Accept Request"}
                    </button>
                  )}
                  <button
                    className="btn-view-details"
                    onClick={() => setSelectedRequest(request)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedRequest.elderlyName}</h2>
            <div className="modal-details">
              <p>
                <strong>Specializations Needed:</strong>{" "}
                {selectedRequest.specializations.join(", ")}
              </p>
              <p>
                <strong>Hours Per Week:</strong> {selectedRequest.hoursPerWeek}
              </p>
              <p>
                <strong>Hourly Rate:</strong> ${selectedRequest.hourlyRate}
              </p>
              <p>
                <strong>Start Date:</strong>{" "}
                {new Date(selectedRequest.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Care Description:</strong>
              </p>
              <p className="description-text">{selectedRequest.description}</p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
              {selectedRequest.status === "open" && (
                <button
                  className="btn-submit"
                  onClick={() => {
                    handleAcceptRequest(selectedRequest.id);
                    setSelectedRequest(null);
                  }}
                >
                  Accept This Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanionDashboard;
