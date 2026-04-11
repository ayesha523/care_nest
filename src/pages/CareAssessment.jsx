import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/care-assessment.css";

/**
 * CareAssessment Component
 * Interactive quiz to help elderly users understand their care needs
 * Inspired by Caring.com's needs assessment questionnaire
 * 
 * Features:
 * - Multi-step wizard for care assessment
 * - Category-based questions
 * - Personalized recommendations
 * - Estimated care type matching
 * - Budget guidance
 * 
 * @returns {React.ReactNode} Care assessment wizard interface
 */
function CareAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({
    independenceLevel: "",
    healthConditions: [],
    activitiesNeeded: [],
    livingArrangement: "",
    budget: "",
    timeline: ""
  });
  const [showResults, setShowResults] = useState(false);

  // Assessment questions
  const questions = [
    {
      id: "independence",
      title: "What's Your Current Independence Level?",
      subtitle: "How much help do you need with daily activities?",
      type: "radio",
      options: [
        {
          value: "fully-independent",
          label: "Very Independent",
          description: "I can manage everything myself, just need occasional help"
        },
        {
          value: "semi-independent",
          label: "Somewhat Independent",
          description: "I need reminders or help with some daily tasks"
        },
        {
          value: "dependent",
          label: "Dependent",
          description: "I need hands-on help with most tasks"
        },
        {
          value: "highly-dependent",
          label: "Highly Dependent",
          description: "I need 24/7 support and care"
        }
      ]
    },
    {
      id: "health-conditions",
      title: "What Health Conditions Do You Have?",
      subtitle: "Select any that apply",
      type: "checkbox",
      options: [
        { value: "arthritis", label: "Arthritis" },
        { value: "diabetes", label: "Diabetes" },
        { value: "heart", label: "Heart Disease" },
        { value: "dementia", label: "Dementia/Memory Loss" },
        { value: "stroke", label: "Stroke History" },
        { value: "mobility", label: "Mobility Issues" },
        { value: "vision", label: "Vision Problems" },
        { value: "hearing", label: "Hearing Loss" },
        { value: "none", label: "No Major Conditions" }
      ]
    },
    {
      id: "activities",
      title: "What Activities Do You Need Help With?",
      subtitle: "We can help you find the right companion",
      type: "checkbox",
      options: [
        { value: "bathing", label: "Bathing/Personal Hygiene" },
        { value: "dressing", label: "Getting Dressed" },
        { value: "meals", label: "Meal Preparation" },
        { value: "medication", label: "Medication Reminders" },
        { value: "housekeeping", label: "Light Housekeeping" },
        { value: "transportation", label: "Transportation/Errands" },
        { value: "mobility", label: "Mobility/Walking Support" },
        { value: "companionship", label: "Companionship/Conversation" },
        { value: "physical-therapy", label: "Physical Therapy Support" },
        { value: "none", label: "Just Companionship" }
      ]
    },
    {
      id: "living",
      title: "Where Do You Live?",
      type: "radio",
      options: [
        { value: "alone", label: "Alone" },
        { value: "family", label: "With Family" },
        { value: "facility", label: "In a Care Facility" },
        { value: "assisted-living", label: "In Assisted Living" }
      ]
    },
    {
      id: "budget",
      title: "What's Your Monthly Budget?",
      subtitle: "This helps us recommend appropriate care levels",
      type: "radio",
      options: [
        { value: "under-1000", label: "Under $1,000/month" },
        { value: "1000-2000", label: "$1,000 - $2,000/month" },
        { value: "2000-3000", label: "$2,000 - $3,000/month" },
        { value: "3000-5000", label: "$3,000 - $5,000/month" },
        { value: "5000-plus", label: "$5,000+/month" },
        { value: "unsure", label: "Not sure" }
      ]
    },
    {
      id: "timeline",
      title: "When Do You Need Care?",
      type: "radio",
      options: [
        { value: "immediate", label: "Immediately" },
        { value: "soon", label: "Within 1-2 weeks" },
        { value: "month", label: "Within a month" },
        { value: "flexible", label: "Flexible timeline" }
      ]
    }
  ];

  /**
   * Handles radio button selection
   */
  const handleRadioChange = (key, value) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Handles checkbox selection
   */
  const handleCheckboxChange = (key, value) => {
    setResponses(prev => {
      const currentArray = prev[key] || [];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  /**
   * Advances to next step
   */
  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  /**
   * Goes to previous step
   */
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  /**
   * Generates personalized care recommendations
   */
  const generateRecommendations = () => {
    const careTypes = {
      "fully-independent": "Companionship & Social Activities",
      "semi-independent": "Assisted Living with Support Services",
      "dependent": "In-Home Care with Daily Support",
      "highly-dependent": "24/7 Skilled Nursing Care"
    };

    const costEstimates = {
      "companionship": "$20-30/hour",
      "assisted-living": "$3,000-5,000/month",
      "in-home-care": "$50,000-75,000/year",
      "24-7-care": "$8,000-15,000/month"
    };

    return {
      primaryNeed: careTypes[responses.independenceLevel] || "Personalized Care",
      estimatedCost: costEstimates["companionship"],
      recommendations: [
        "Start with 10-15 hours per week of companion care",
        "Schedule consistent days and times for better routine",
        "Consider backup care options",
        "Regular health and wellness check-ins"
      ]
    };
  };

  const currentQuestion = questions[step];
  const recommendations = generateRecommendations();

  if (showResults) {
    return (
      <div className="care-assessment-container">
        <div className="results-container">
          <div className="results-header">
            <h1>✓ Your Care Assessment Results</h1>
            <p className="subtitle">Based on your profile, here are recommendations</p>
          </div>

          <div className="recommendation-card primary">
            <h2>Your Primary Care Need</h2>
            <p className="recommendation-title">{recommendations.primaryNeed}</p>
          </div>

          <div className="recommendation-card">
            <h3>💰 Estimated Monthly Cost</h3>
            <p className="cost-estimate">{recommendations.estimatedCost}</p>
            <p className="note">*Actual costs vary based on location and specific needs</p>
          </div>

          <div className="recommendation-card">
            <h3>📋 Our Recommendations</h3>
            <ul className="recommendations-list">
              {recommendations.recommendations.map((rec, idx) => (
                <li key={idx}>
                  <span className="badge">{idx + 1}</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="next-steps">
            <h3>What's Next?</h3>
            <div className="steps-grid">
              <div className="step">
                <div className="step-icon">1️⃣</div>
                <h4>Create Your Profile</h4>
                <p>Add more details about yourself</p>
              </div>
              <div className="step">
                <div className="step-icon">2️⃣</div>
                <h4>Post a Job</h4>
                <p>Describe exactly what you need</p>
              </div>
              <div className="step">
                <div className="step-icon">3️⃣</div>
                <h4>Connect with Companions</h4>
                <p>Review profiles and hire</p>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="primary-btn"
              onClick={() => navigate("/job-postings")}
            >
              →Post a Job Based on Assessment
            </button>
             <button
              className="secondary-btn"
              onClick={() => navigate("/elderly-dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="care-assessment-container">
      <div className="assessment-wizard">
        {/* Progress Bar */}
        <div className="progress-section">
          <h1>Care Needs Assessment</h1>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            Step {step + 1} of {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <div className="question-card">
          <h2>{currentQuestion.title}</h2>
          {currentQuestion.subtitle && (
            <p className="question-subtitle">{currentQuestion.subtitle}</p>
          )}

          <div className="options">
            {currentQuestion.type === "radio" && (
              <div className="radio-options">
                {currentQuestion.options.map(option => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option.value}
                      checked={responses[currentQuestion.id.replace("-", "")] === option.value}
                      onChange={() =>
                        handleRadioChange(
                          currentQuestion.id.replace("-", ""),
                          option.value
                        )
                      }
                    />
                    <div className="option-content">
                      <span className="option-label">{option.label}</span>
                      {option.description && (
                        <span className="option-description">{option.description}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === "checkbox" && (
              <div className="checkbox-options">
                {currentQuestion.options.map(option => (
                  <label key={option.value} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={responses[currentQuestion.id.replace("-", "")].includes(option.value)}
                      onChange={() =>
                        handleCheckboxChange(
                          currentQuestion.id.replace("-", ""),
                          option.value
                        )
                      }
                    />
                    <span className="checkbox-label">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="navigation">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={step === 0}
          >
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
          >
            {step === questions.length - 1 ? "See Results →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CareAssessment;
