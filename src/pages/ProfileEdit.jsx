import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import "../styles/profile-edit.css";

const ProfileEdit = () => {
  const { user } = useUser();
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "",
    age: "",
    bio: "",
    profilePicture: "",
    location: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
    hourlyRate: 0,
    skills: [],
    specializations: [],
    certifications: [],
    interests: [],
    university: "",
    volunteeerMode: false,
    eldyDetails: {
      healthConditions: [],
      mobilityLevel: "",
      preferences: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const userId =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem("user") || "null")?.id ||
    JSON.parse(localStorage.getItem("user") || "null")?._id ||
    "";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/profile/${userId}`);
      const data = await response.json();

      if (data.success) {
        const fetched = data.user || {};
        setProfileData((prev) => ({
          ...prev,
          ...fetched,
          location: { ...prev.location, ...(fetched.location || {}) },
          skills: fetched.skills || [],
          specializations: fetched.specializations || [],
          certifications: fetched.certifications || [],
          interests: fetched.interests || [],
          eldyDetails: {
            ...prev.eldyDetails,
            ...(fetched.eldyDetails || {}),
            healthConditions: fetched.eldyDetails?.healthConditions || [],
            preferences: fetched.eldyDetails?.preferences || [],
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setProfileData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) : value
      }));
    }
  };

  const addSkill = () => {
    if (newSkill && !profileData.skills.includes(newSkill)) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill("");
    }
  };

  const addSpecialization = () => {
    const value = newSpecialization.trim();
    if (value && !profileData.specializations.includes(value)) {
      setProfileData((prev) => ({
        ...prev,
        specializations: [...prev.specializations, value],
      }));
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (specialization) => {
    setProfileData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((s) => s !== specialization),
    }));
  };

  const addCertification = () => {
    const value = newCertification.trim();
    if (value && !profileData.certifications.includes(value)) {
      setProfileData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, value],
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (certification) => {
    setProfileData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== certification),
    }));
  };

  const removeSkill = (skill) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addInterest = () => {
    if (newInterest && !profileData.interests.includes(newInterest)) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Profile updated successfully!");
        // Update user in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("carenest_user", JSON.stringify(data.user));
      } else {
        alert("Error updating profile: " + data.message);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="profile-edit-loading">Loading...</div>;

  return (
    <div className="profile-edit-container">
      <h1>Edit Your Profile</h1>

      <form onSubmit={handleSave} className="profile-form">
        {/* Basic Information */}
        <section className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={profileData.age}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              rows="4"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          <div className="form-group">
            <label>Profile Picture URL</label>
            <input
              type="url"
              name="profilePicture"
              value={profileData.profilePicture}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>
        </section>

        {/* Location Information */}
        <section className="form-section">
          <h2>Location</h2>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="location.address"
              value={profileData.location.address}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="location.city"
              value={profileData.location.city}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="location.state"
                value={profileData.location.state}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="location.zipCode"
                value={profileData.location.zipCode}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        {/* Companion-Specific Fields */}
        {profileData.role === "companion" && (
          <>
            <section className="form-section">
              <h2>Professional Information</h2>

              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={profileData.hourlyRate}
                  onChange={handleInputChange}
                  min="0"
                  step="5"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="volunteeerMode"
                    checked={profileData.volunteeerMode}
                    onChange={handleInputChange}
                  />
                  <span>I want to volunteer (no payment)</span>
                </label>
              </div>

              <div className="form-group">
                <label>University</label>
                <input
                  type="text"
                  name="university"
                  value={profileData.university}
                  onChange={handleInputChange}
                  placeholder="Your university name"
                />
              </div>
            </section>

            {/* Skills */}
            <section className="form-section">
              <h2>Skills</h2>
              <div className="skill-input-group">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <button type="button" onClick={addSkill}>Add</button>
              </div>

              <div className="tags-list">
                {profileData.skills.map(skill => (
                  <span key={skill} className="tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </section>

            <section className="form-section">
              <h2>Specializations</h2>
              <div className="skill-input-group">
                <input
                  type="text"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="Add a specialization..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
                />
                <button type="button" onClick={addSpecialization}>Add</button>
              </div>

              <div className="tags-list">
                {profileData.specializations.map((specialization) => (
                  <span key={specialization} className="tag">
                    {specialization}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(specialization)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </section>

            <section className="form-section">
              <h2>Certifications</h2>
              <div className="skill-input-group">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="Add a certification..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                />
                <button type="button" onClick={addCertification}>Add</button>
              </div>

              <div className="tags-list">
                {profileData.certifications.map((certification) => (
                  <span key={certification} className="tag">
                    {certification}
                    <button
                      type="button"
                      onClick={() => removeCertification(certification)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Interests */}
        <section className="form-section">
          <h2>Interests</h2>
          <div className="skill-input-group">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add an interest..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
            />
            <button type="button" onClick={addInterest}>Add</button>
          </div>

          <div className="tags-list">
            {profileData.interests.map(interest => (
              <span key={interest} className="tag interest-tag">
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="remove-btn"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          className="save-btn"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ProfileEdit;
