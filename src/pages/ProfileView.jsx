import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/profile-view.css";

const ProfileView = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [userRes, reviewsRes] = await Promise.all([
        fetch(`/api/profile/${userId}`),
        fetch(`/api/reviews/companion/${userId}`),
      ]);

      const userData = await userRes.json();
      const reviewsData = await reviewsRes.json();

      if (userData.success) setUser(userData.user);
      if (reviewsData.success) setReviews(reviewsData.reviews);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (!user) return <div className="profile-error">User not found</div>;

  return (
    <div className="profile-view-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-content">
          <div className="profile-picture">
            <img
              src={user.profilePicture || "https://via.placeholder.com/150"}
              alt={user.name}
            />
            {user.identityVerified && <span className="verified-badge">✓</span>}
          </div>

          <div className="header-info">
            <h1>{user.name}</h1>
            <p className="role-badge">{user.role === "companion" ? "🎓 Companion" : "👴 Elderly"}</p>
            {user.location?.city && <p>📍 {user.location.city}</p>}

            {user.role === "companion" && (
              <div className="header-stats">
                <div className="stat">
                  <span className="stat-value">
                    {"⭐".repeat(Math.round(user.rating || 0))}
                  </span>
                  <span className="stat-label">
                    {user.rating ? user.rating.toFixed(1) : "No rating"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-value">{user.reviewCount || 0}</span>
                  <span className="stat-label">Reviews</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{user.totalBookings || 0}</span>
                  <span className="stat-label">Bookings</span>
                </div>
              </div>
            )}
          </div>

          <button className="message-btn">💬 Send Message</button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        {user.role === "companion" && (
          <>
            <button
              className={`tab ${activeTab === "availability" ? "active" : ""}`}
              onClick={() => setActiveTab("availability")}
            >
              Availability
            </button>
            <button
              className={`tab ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews ({reviews.length})
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            {user.bio && (
              <section className="section">
                <h3>About</h3>
                <p>{user.bio}</p>
              </section>
            )}

            {user.role === "companion" && (
              <>
                {user.skills?.length > 0 && (
                  <section className="section">
                    <h3>Skills</h3>
                    <div className="skills-list">
                      {user.skills.map(skill => (
                        <span key={skill} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {user.interests?.length > 0 && (
                  <section className="section">
                    <h3>Interests</h3>
                    <div className="interests-list">
                      {user.interests.map(interest => (
                        <span key={interest} className="interest-tag">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {user.university && (
                  <section className="section">
                    <h3>Education</h3>
                    <p>{user.university}</p>
                  </section>
                )}

                <section className="section">
                  <h3>Rates</h3>
                  {user.volunteeerMode ? (
                    <p className="volunteer-info">🎓 This companion is volunteering</p>
                  ) : (
                    <p className="rate">${user.hourlyRate}/hour</p>
                  )}
                </section>

                <section className="section">
                  <h3>Statistics</h3>
                  <ul className="stats-list">
                    <li>Total Hours: {user.totalHours || 0} hours</li>
                    <li>Total Earnings: ${user.totalEarnings || 0}</li>
                    <li>Completed Bookings: {user.totalBookings || 0}</li>
                  </ul>
                </section>
              </>
            )}

            {user.badges?.length > 0 && (
              <section className="section">
                <h3>Badges</h3>
                <div className="badges-list">
                  {user.badges.map(badge => (
                    <span key={badge._id} className="badge">
                      {badge.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === "availability" && user.role === "companion" && (
          <div className="availability-tab">
            <p>Availability information would be displayed here</p>
          </div>
        )}

        {activeTab === "reviews" && user.role === "companion" && (
          <div className="reviews-tab">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet</p>
            ) : (
              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <img
                          src={review.reviewerId.profilePicture || "https://via.placeholder.com/40"}
                          alt={review.reviewerId.name}
                        />
                        <div>
                          <h4>{review.reviewerId.name}</h4>
                          <span className="rating">
                            {"⭐".repeat(review.rating)}
                          </span>
                        </div>
                      </div>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book Button */}
      <div className="profile-footer">
        <button className="book-now-btn" onClick={() => {
          window.location.href = `/booking/${userId}`;
        }}>
          Book This Companion
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
