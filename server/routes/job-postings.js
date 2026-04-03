const express = require("express");
const router = express.Router();
const JobPosting = require("../models/JobPosting");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret_change_me", (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

/**
 * @route   POST /api/job-postings
 * @desc    Create a new job posting
 * @access  Private (Elderly users)
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { jobTitle, description, careType, hoursPerWeek, hourlyRate, startDate, specialRequirements, location, agePreference, experienceRequired, status, userId, userName } = req.body;

    // Validation
    if (!jobTitle || !description || !careType || !hoursPerWeek || hourlyRate === undefined || !startDate || !location) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify user owns this posting
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to create job posting",
      });
    }

    // Create job posting
    const jobPosting = new JobPosting({
      userId,
      userName,
      jobTitle,
      description,
      careType,
      hoursPerWeek,
      hourlyRate,
      startDate: new Date(startDate),
      specialRequirements,
      location,
      agePreference,
      experienceRequired,
      status: "open",
      applications: [],
      applicantCount: 0,
    });

    await jobPosting.save();

    res.status(201).json({
      success: true,
      message: "Job posting created successfully",
      job: jobPosting,
    });
  } catch (error) {
    console.error("Error creating job posting:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create job posting",
    });
  }
});

/**
 * @route   GET /api/job-postings/user/:userId
 * @desc    Get all job postings for a specific user
 * @access  Private
 */
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own postings
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view these postings",
      });
    }

    const jobPostings = await JobPosting.find({ userId })
      .sort({ createdAt: -1 })
      .populate("acceptedCompanion", "name email profilePicture rating");

    res.status(200).json({
      success: true,
      jobs: jobPostings,
    });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job postings",
    });
  }
});

/**
 * @route   GET /api/job-postings/:jobId
 * @desc    Get a specific job posting
 * @access  Public
 */
router.get("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobPosting = await JobPosting.findById(jobId)
      .populate("userId", "name email profilePicture rating")
      .populate("acceptedCompanion", "name email profilePicture rating");

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    res.status(200).json({
      success: true,
      job: jobPosting,
    });
  } catch (error) {
    console.error("Error fetching job posting:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job posting",
    });
  }
});

/**
 * @route   PATCH /api/job-postings/:jobId
 * @desc    Update job posting status
 * @access  Private (Owner only)
 */
router.patch("/:jobId", verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["open", "closed", "filled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'open', 'closed', or 'filled'",
      });
    }

    const jobPosting = await JobPosting.findById(jobId);

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    // Verify user owns this posting
    if (jobPosting.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this posting",
      });
    }

    jobPosting.status = status;
    await jobPosting.save();

    res.status(200).json({
      success: true,
      message: `Job posting status updated to ${status}`,
      job: jobPosting,
    });
  } catch (error) {
    console.error("Error updating job posting:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update job posting",
    });
  }
});

/**
 * @route   POST /api/job-postings/:jobId/apply
 * @desc    Apply for a job posting as a companion
 * @access  Private (Companion users)
 */
router.post("/:jobId/apply", verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobPosting = await JobPosting.findById(jobId);

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    // Check if already applied
    const alreadyApplied = jobPosting.applications.some(
      (app) => app.companionId.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this position",
      });
    }

    // Add application
    jobPosting.applications.push({
      companionId: req.user.id,
      companionName: req.user.name || "Unknown",
      appliedAt: new Date(),
      status: "pending",
    });

    jobPosting.applicantCount = jobPosting.applications.length;
    await jobPosting.save();

    // Create notification for job owner
    const notification = new Notification({
      userId: jobPosting.userId,
      type: "job_application",
      title: "New Job Application",
      message: `${req.user.name} has applied for: ${jobPosting.jobTitle}`,
      relatedId: jobId,
      relatedModel: "JobPosting",
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      job: jobPosting,
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit application",
    });
  }
});

/**
 * @route   PUT /api/job-postings/:jobId/application/:companionId
 * @desc    Update application status (accept/reject)
 * @access  Private (Job owner only)
 */
router.put("/:jobId/application/:companionId", verifyToken, async (req, res) => {
  try {
    const { jobId, companionId } = req.params;
    const { status } = req.body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pending', 'accepted', or 'rejected'",
      });
    }

    const jobPosting = await JobPosting.findById(jobId);

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    // Verify user owns this posting
    if (jobPosting.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this application",
      });
    }

    // Find and update application
    const application = jobPosting.applications.find(
      (app) => app.companionId.toString() === companionId
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;

    if (status === "accepted") {
      jobPosting.acceptedCompanion = companionId;
      jobPosting.status = "filled";
    }

    await jobPosting.save();

    // Create notification for companion
    const notificationMessage = status === "accepted"
      ? `Your application for "${jobPosting.jobTitle}" has been accepted!`
      : `Your application for "${jobPosting.jobTitle}" was not accepted at this time.`;

    const notification = new Notification({
      userId: companionId,
      type: status === "accepted" ? "application_accepted" : "application_rejected",
      title: status === "accepted" ? "Application Accepted" : "Application Update",
      message: notificationMessage,
      relatedId: jobId,
      relatedModel: "JobPosting",
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: `Application ${status}`,
      job: jobPosting,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update application",
    });
  }
});

/**
 * @route   GET /api/job-postings
 * @desc    Get all open job postings (with optional filtering)
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { careType, location, minRate, maxRate, page = 1, limit = 10 } = req.query;

    let filter = { status: "open" };

    if (careType) filter.careType = careType;
    if (location) filter.location = new RegExp(location, "i");
    if (minRate) filter.hourlyRate = { $gte: parseInt(minRate) };
    if (maxRate) {
      filter.hourlyRate = { ...filter.hourlyRate, $lte: parseInt(maxRate) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobPostings = await JobPosting.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email profilePicture rating");

    const total = await JobPosting.countDocuments(filter);

    res.status(200).json({
      success: true,
      jobs: jobPostings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job postings",
    });
  }
});

module.exports = router;
