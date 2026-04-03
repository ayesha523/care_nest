import React, { useState, useEffect } from "react";
import "../styles/mood-tracker.css";

const MoodTracker = () => {
  const [moodLogs, setMoodLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newMood, setNewMood] = useState({
    mood: "neutral",
    moodScore: 3,
    notes: "",
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const moodEmojis = {
    very_happy: "😄",
    happy: "😊",
    neutral: "😐",
    sad: "😢",
    very_sad: "😭",
  };

  const availableActivities = [
    "Watched movie",
    "Went for walk",
    "Had visitor",
    "Read book",
    "Gardened",
    "Listened to music",
    "Had tea/coffee",
    "Played games",
  ];

  const token = localStorage.getItem("token");
  const userId = JSON.parse(localStorage.getItem("user"))?._id;

  useEffect(() => {
    fetchMoodLogs();
  }, [userId]);

  const fetchMoodLogs = async () => {
    try {
      const response = await fetch("/api/mood/me/all", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setMoodLogs(data.moodLogs);
        setStats(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching mood logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityToggle = (activity) => {
    setNewMood(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const handleSubmitMood = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newMood),
      });

      const data = await response.json();

      if (data.success) {
        alert("Mood logged successfully!");
        setNewMood({
          mood: "neutral",
          moodScore: 3,
          notes: "",
          activities: [],
        });
        setShowForm(false);
        fetchMoodLogs(); // Refresh the list
      } else {
        alert("Error logging mood: " + data.message);
      }
    } catch (error) {
      console.error("Error submitting mood:", error);
      alert("Error submitting mood");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mood-tracker-loading">Loading mood history...</div>;

  return (
    <div className="mood-tracker-container">
      <h1>🎭 Mood Tracker</h1>
      <p className="subtitle">Track your mood and daily activities</p>

      {/* Statistics */}
      {stats && (
        <div className="mood-stats">
          <div className="stat-card">
            <h3>Average Mood Score</h3>
            <p className="stat-value">{stats.averageMoodScore}/5</p>
          </div>

          <div className="stat-card">
            <h3>Total Entries</h3>
            <p className="stat-value">{stats.totalEntries}</p>
          </div>

          <div className="stat-card">
            <h3>Most Frequent Mood</h3>
            <p className="stat-value">
              {Object.entries(stats.moodDistribution).sort(([, a], [, b]) => b - a)[0]?.[0]?.replace(/_/g, " ") || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Quick Mood Log */}
      {!showForm && (
        <button className="log-mood-btn" onClick={() => setShowForm(true)}>
          + Log Your Mood Now
        </button>
      )}

      {/* Mood Log Form */}
      {showForm && (
        <form onSubmit={handleSubmitMood} className="mood-form">
          <h2>How are you feeling today?</h2>

          {/* Mood Selection */}
          <div className="mood-selector">
            {Object.entries(moodEmojis).map(([mood, emoji]) => (
              <label key={mood} className={`mood-option ${newMood.mood === mood ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="mood"
                  value={mood}
                  checked={newMood.mood === mood}
                  onChange={(e) => setNewMood(prev => ({ ...prev, mood: e.target.value }))}
                />
                <span className="emoji">{emoji}</span>
                <span className="label">{mood.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>

          {/* Mood Score */}
          <div className="form-group">
            <label>Mood Score: {newMood.moodScore}/5</label>
            <input
              type="range"
              min="1"
              max="5"
              value={newMood.moodScore}
              onChange={(e) => setNewMood(prev => ({ ...prev, moodScore: parseInt(e.target.value) }))}
            />
          </div>

          {/* Activities */}
          <div className="form-group">
            <label>What did you do today?</label>
            <div className="activities-grid">
              {availableActivities.map(activity => (
                <label key={activity} className="activity-checkbox">
                  <input
                    type="checkbox"
                    checked={newMood.activities.includes(activity)}
                    onChange={() => handleActivityToggle(activity)}
                  />
                  <span>{activity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              value={newMood.notes}
              onChange={(e) => setNewMood(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any thoughts or feelings you want to share?"
              rows="4"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Saving..." : "Save Mood"}
            </button>
            <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Mood History */}
      <div className="mood-history">
        <h2>📊 Your Mood History</h2>

        {moodLogs.length === 0 ? (
          <p className="no-logs">No mood logs yet. Start tracking today!</p>
        ) : (
          <div className="logs-timeline">
            {moodLogs.map(log => (
              <div key={log._id} className="mood-log-item">
                <div className="log-mood">
                  <span className="emoji">{moodEmojis[log.mood]}</span>
                  <div className="log-content">
                    <h4>{log.mood.replace(/_/g, " ")}</h4>
                    <p className="mood-score">Score: {log.moodScore}/5</p>

                    {log.activities?.length > 0 && (
                      <div className="log-activities">
                        {log.activities.map(activity => (
                          <span key={activity} className="activity-tag">{activity}</span>
                        ))}
                      </div>
                    )}

                    {log.notes && (
                      <p className="log-notes">"{log.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="log-date">
                  {new Date(log.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    time: "short",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;
