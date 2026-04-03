import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/review-page.css";

const ReviewPage = () => {
  const { companionId } = useParams();
  const [companion, setCompanion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    categories: {
      communication: 5,
      reliability: 5,
      skills: 5,
      empathy: 5,
    },
  });

  const token = localStorage.getItem("token");

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
    }
  };

  const handleCategoryChange = (category, value) => {
    setReviewData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: parseInt(value),
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reviewData.comment.trim() || reviewData.comment.length < 10) {
      alert("Please write a review (at least 10 characters)");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          companionId,
          ...reviewData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Review submitted successfully!");
        setReviewData({
          rating: 5,
          comment: "",
          categories: {
            communication: 5,
            reliability: 5,
            skills: 5,
            empathy: 5,
          },
        });
        // Redirect back after 2 seconds
        setTimeout(() => {
          window.history.back();
        }, 2000);
      } else {
        alert("Error submitting review: " + data.message);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!companion) return <div className="review-loading">Loading...</div>;

  return (
    <div className="review-page-container">
      <h1>⭐ Leave a Review</h1>

      {/* Companion Info */}
      <div className="review-companion-card">
        <img
          src={companion.profilePicture || "https://via.placeholder.com/100"}
          alt={companion.name}
        />
        <h2>{companion.name}</h2>
        <p>{companion.role === "companion" ? "Companion" : "Elderly User"}</p>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="review-form">
        {/* Overall Rating */}
        <div className="form-group">
          <label>Overall Rating ({reviewData.rating}/5) ⭐</label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star ${star <= reviewData.rating ? "active" : ""}`}
                onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Category Ratings */}
        <div className="categories-section">
          <h3>Rate Different Aspects</h3>

          {Object.entries(reviewData.categories).map(([category, rating]) => (
            <div key={category} className="category-rating">
              <label>{category.charAt(0).toUpperCase() + category.slice(1)}</label>
              <div className="rating-input">
                <select
                  value={rating}
                  onChange={(e) => handleCategoryChange(category, e.target.value)}
                >
                  {[1, 2, 3, 4, 5].map(val => (
                    <option key={val} value={val}>
                      {val} - {"⭐".repeat(val)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Review Comment */}
        <div className="form-group">
          <label>Your Review (minimum 10 characters) *</label>
          <textarea
            value={reviewData.comment}
            onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your honest feedback about your experience..."
            rows="6"
            required
          ></textarea>
          <p className="char-count">
            {reviewData.comment.length} characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-review-btn"
          disabled={submitting || reviewData.comment.length < 10}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      {/* Tips */}
      <div className="review-tips">
        <h3>💡 Tips for a Great Review</h3>
        <ul>
          <li>Be honest and specific</li>
          <li>Focus on your actual experience</li>
          <li>Consider various aspects of the service</li>
          <li>Help other users make informed decisions</li>
        </ul>
      </div>
    </div>
  );
};

export default ReviewPage;
