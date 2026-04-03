import React, { useState, useEffect } from "react";
import "../styles/search-companions.css";

const SearchCompanions = () => {
  const [companions, setCompanions] = useState([]);
  const [filteredCompanions, setFilteredCompanions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    location: "",
    skills: [],
    minRating: 0,
    maxRate: 100,
    volunteersOnly: false,
  });

  useEffect(() => {
    fetchCompanions();
  }, []);

  const fetchCompanions = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.location) query.append("location", params.location);
      if (params.skills?.length) params.skills.forEach(s => query.append("skills", s));
      if (params.minRating) query.append("minRating", params.minRating);
      if (params.maxRate) query.append("maxRate", params.maxRate);
      if (params.volunteersOnly) query.append("volunteersOnly", true);

      const response = await fetch(`/api/search/companions?${query}`);
      const data = await response.json();

      if (data.success) {
        setCompanions(data.companions);
        setFilteredCompanions(data.companions);
      }
    } catch (error) {
      console.error("Error fetching companions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newParams = {
      ...searchParams,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) : value,
    };

    setSearchParams(newParams);
    fetchCompanions(newParams);
  };

  const handleSkillToggle = (skill) => {
    const newSkills = searchParams.skills.includes(skill)
      ? searchParams.skills.filter(s => s !== skill)
      : [...searchParams.skills, skill];

    const newParams = { ...searchParams, skills: newSkills };
    setSearchParams(newParams);
    fetchCompanions(newParams);
  };

  const availableSkills = ["reading", "talking", "walking", "tech-help", "cooking", "gardening"];

  return (
    <div className="search-companions-container">
      <div className="search-header">
        <h1>Find Your Perfect Companion</h1>
        <p>Browse and filter companions based on skills, availability, and ratings</p>
      </div>

      <div className="search-layout">
        {/* Filter Sidebar */}
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          {/* Location Filter */}
          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="City or Area"
              value={searchParams.location}
              onChange={handleFilterChange}
            />
          </div>

          {/* Skills Filter */}
          <div className="filter-group">
            <label>Skills</label>
            <div className="skills-checkboxes">
              {availableSkills.map(skill => (
                <label key={skill} className="skill-checkbox">
                  <input
                    type="checkbox"
                    checked={searchParams.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                  />
                  <span className="capitalize">{skill.replace("-", " ")}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="filter-group">
            <label>Minimum Rating</label>
            <select
              name="minRating"
              value={searchParams.minRating}
              onChange={handleFilterChange}
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
              <option value={5}>5 Stars</option>
            </select>
          </div>

          {/* Hourly Rate Filter */}
          <div className="filter-group">
            <label>Max Hourly Rate: ${searchParams.maxRate}</label>
            <input
              type="range"
              name="maxRate"
              min="0"
              max="100"
              value={searchParams.maxRate}
              onChange={handleFilterChange}
            />
          </div>

          {/* Volunteers Only */}
          <div className="filter-group">
            <label className="volunteer-checkbox">
              <input
                type="checkbox"
                name="volunteersOnly"
                checked={searchParams.volunteersOnly}
                onChange={handleFilterChange}
              />
              <span>Show Volunteers Only</span>
            </label>
          </div>
        </aside>

        {/* Companions Grid */}
        <main className="companions-grid">
          {loading ? (
            <div className="loading">Loading companions...</div>
          ) : filteredCompanions.length === 0 ? (
            <div className="no-results">
              <p>No companions found matching your criteria</p>
            </div>
          ) : (
            <div className="grid">
              {filteredCompanions.map(companion => (
                <div key={companion._id} className="companion-card">
                  <div className="card-image">
                    <img
                      src={companion.profilePicture || "https://via.placeholder.com/200"}
                      alt={companion.name}
                    />
                    {companion.identityVerified && (
                      <badge className="verified-badge">✓ Verified</badge>
                    )}
                  </div>

                  <div className="card-content">
                    <h3>{companion.name}</h3>
                    {companion.age && <p className="age">{companion.age} years old</p>}
                    {companion.location?.city && (
                      <p className="location">📍 {companion.location.city}</p>
                    )}

                    {/* Rating */}
                    <div className="rating-section">
                      <span className="stars">
                        {"⭐".repeat(Math.round(companion.rating || 0))}
                      </span>
                      <span className="rating-value">
                        {companion.rating ? companion.rating.toFixed(1) : "No ratings"}
                      </span>
                      <span className="review-count">
                        ({companion.reviewCount || 0} reviews)
                      </span>
                    </div>

                    {/* Skills */}
                    <div className="skills">
                      {companion.skills?.slice(0, 3).map(skill => (
                        <span key={skill} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Rates */}
                    {!companion.volunteeerMode ? (
                      <p className="rate">${companion.hourlyRate}/hour</p>
                    ) : (
                      <p className="volunteer-badge">🎓 Volunteer</p>
                    )}

                    {/* CTA Button */}
                    <button className="book-btn" onClick={() => {
                      // Navigate to booking page with companion ID
                      window.location.href = `/booking/${companion._id}`;
                    }}>
                      Book Now
                    </button>

                    {/* View Profile Link */}
                    <a href={`/profile/${companion._id}`} className="view-profile">
                      View Full Profile
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchCompanions;
