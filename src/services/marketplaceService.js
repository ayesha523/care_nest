/**
 * Marketplace Service Module
 * Handles all API calls related to companions, job requests, and marketplace operations
 * Supports both real API and mock data (for development/testing)
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === "true";

/**
 * Retrieves stored authentication token from localStorage
 * @returns {string} JWT token or empty string if not found
 */
const getStoredAuthToken = () => {
  try {
    const rawUser = localStorage.getItem("carenest_user");
    if (!rawUser) {
      return "";
    }
    const parsedUser = JSON.parse(rawUser);
    return parsedUser?.token || "";
  } catch (error) {
    console.warn("Failed to retrieve auth token:", error);
    return "";
  }
};

/**
 * Builds HTTP headers for API requests with authentication
 * @returns {Object} Headers object with Content-Type and Authorization
 */
const buildHeaders = () => {
  const token = getStoredAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Mock companion data for development
const MOCK_COMPANIONS = [
  {
    id: "comp-001",
    name: "Maria Garcia",
    role: "companion",
    email: "maria@carenest.com",
    specializations: ["dementia care", "mobility assistance", "cooking"],
    hourlyRate: 25,
    rating: 4.8,
    reviews: 42,
    availability: "Mon-Fri, 9am-5pm",
    bio: "10+ years experience caring for elderly. Patient, compassionate, and reliable.",
    verified: true,
  },
  {
    id: "comp-002",
    name: "James Wilson",
    role: "companion",
    email: "james@carenest.com",
    specializations: ["companionship", "light housekeeping", "errands"],
    hourlyRate: 22,
    rating: 4.6,
    reviews: 35,
    availability: "Flexible",
    bio: "Friendly and dependable companion. Love helping seniors stay active.",
    verified: true,
  },
  {
    id: "comp-003",
    name: "Amara Okafor",
    role: "companion",
    email: "amara@carenest.com",
    specializations: ["medical support", "physical therapy", "nutrition"],
    hourlyRate: 28,
    rating: 4.9,
    reviews: 51,
    availability: "Weekdays",
    bio: "Certified nurse assistant with passion for elderly care.",
    verified: true,
  },
];

// Mock job request data
const MOCK_JOB_REQUESTS = [
  {
    id: "req-001",
    elderlyName: "Margaret Johnson",
    elderlyId: "eld-001",
    status: "open",
    specializations: ["dementia care", "mobility assistance"],
    hoursPerWeek: 20,
    hourlyRate: 25,
    startDate: "2026-03-15",
    description: "Need morning care and light meals preparation",
  },
  {
    id: "req-002",
    elderlyName: "Robert Smith",
    elderlyId: "eld-002",
    status: "open",
    specializations: ["companionship", "errands"],
    hoursPerWeek: 15,
    hourlyRate: 22,
    startDate: "2026-03-20",
    description: "Companion for activities and grocery shopping",
  },
];

/**
 * Parses API response and normalizes the format
 * @param {Response} response - Fetch Response object
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} Normalized response object
 */
const parseApiResponse = async (response) => {
  try {
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const responseBody = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        typeof responseBody === "object" && responseBody?.message
          ? responseBody.message
          : `Request failed with status ${response.status}`;
      return { success: false, error: message };
    }

    // If backend already returns { success, data } format, return it directly
    if (typeof responseBody === "object" && "success" in responseBody && "data" in responseBody) {
      return responseBody;
    }

    // Otherwise wrap it
    return { success: true, data: responseBody };
  } catch (error) {
    console.error("Failed to parse API response:", error);
    return {
      success: false,
      error: "Invalid response format from server",
    };
  }
};

/**
 * Performs GET request to API
 * @param {string} path - API endpoint path
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} API response
 */
const apiGet = async (path) => {
  if (!path || typeof path !== "string") {
    return {
      success: false,
      error: "Invalid API path provided",
    };
  }

  if (USE_MOCK_DATA) {
    return { success: true, data: null };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: buildHeaders(),
    });

    return await parseApiResponse(response);
  } catch (error) {
    console.error("API GET request failed:", path, error);
    return {
      success: false,
      error: "Unable to connect to server. Please try again.",
    };
  }
};

/**
 * Fetches all available companions with optional filters
 * @param {Object} [filters={}] - Filter options
 * @param {string} [filters.specialization] - Filter by specialization
 * @param {number} [filters.maxRate] - Filter by maximum hourly rate
 * @returns {Promise<{success: boolean, data: Array, error?: string}>} Array of companion objects
 */
export const getCompanions = async (filters = {}) => {
  // Validate filters
  if (typeof filters !== "object") {
    return {
      success: false,
      error: "Invalid filters provided",
      data: [],
    };
  }

  if (USE_MOCK_DATA) {
    let results = [...MOCK_COMPANIONS];
    if (filters.specialization && typeof filters.specialization === "string") {
      results = results.filter((c) =>
        c.specializations.includes(filters.specialization.toLowerCase())
      );
    }
    if (filters.maxRate && typeof filters.maxRate === "number") {
      results = results.filter((c) => c.hourlyRate <= filters.maxRate);
    }
    return { success: true, data: results };
  }

  const queryParams = new URLSearchParams(filters);
  return apiGet(`/api/marketplace/companions?${queryParams}`);
};

/**
 * Fetches a single companion by ID
 * @param {string} id - Companion ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Companion object or error
 */
export const getCompanionById = async (id) => {
  // Input validation
  if (!id || typeof id !== "string") {
    return {
      success: false,
      error: "Invalid companion ID provided",
    };
  }

  if (USE_MOCK_DATA) {
    const companion = MOCK_COMPANIONS.find((c) => c.id === id);
    return {
      success: !!companion,
      data: companion,
      error: companion ? null : "Companion not found",
    };
  }

  return apiGet(`/api/marketplace/companions/${encodeURIComponent(id)}`);
};

/**
 * Fetches job requests with optional filters
 * @param {Object} [filters={}] - Filter options
 * @param {string} [filters.status] - Filter by status (open, accepted, completed)
 * @param {string} [filters.specialization] - Filter by required specialization
 * @returns {Promise<{success: boolean, data: Array, error?: string}>} Array of job request objects
 */
export const getJobRequests = async (filters = {}) => {
  // Validate filters
  if (typeof filters !== "object") {
    return {
      success: false,
      error: "Invalid filters provided",
      data: [],
    };
  }

  if (USE_MOCK_DATA) {
    let results = [...MOCK_JOB_REQUESTS];
    if (filters.status && typeof filters.status === "string") {
      results = results.filter((r) => r.status === filters.status.toLowerCase());
    }
    if (filters.specialization && typeof filters.specialization === "string") {
      results = results.filter((r) =>
        r.specializations.includes(filters.specialization.toLowerCase())
      );
    }
    return { success: true, data: results };
  }

  const queryParams = new URLSearchParams(filters);
  return apiGet(`/api/marketplace/requests?${queryParams}`);
};

/**
 * Submits a request to hire a companion
 * @param {string} companionId - ID of the companion to request
 * @param {Object} requestData - Request details (hoursPerWeek, startDate, specialRequirements, etc)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Created request object
 */
export const requestCompanion = async (companionId, requestData) => {
  // Input validation
  if (!companionId || typeof companionId !== "string") {
    return {
      success: false,
      error: "Invalid companion ID provided",
    };
  }

  if (!requestData || typeof requestData !== "object") {
    return {
      success: false,
      error: "Invalid request data provided",
    };
  }

  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: {
        id: `hire-${Date.now()}`,
        companionId,
        ...requestData,
      },
    };
  }

  try {
    const response = await fetch(`/api/marketplace/requests`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ companionId, ...requestData }),
    });

    return await parseApiResponse(response);
  } catch (error) {
    console.error("Failed to submit companion request:", error);
    return {
      success: false,
      error: "Unable to submit request. Please try again.",
    };
  }
};

/**
 * Accepts a job request (for companions)
 * @param {string} requestId - ID of the job request to accept
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Updated request object
 */
export const acceptJobRequest = async (requestId) => {
  // Input validation
  if (!requestId || typeof requestId !== "string") {
    return {
      success: false,
      error: "Invalid request ID provided",
    };
  }

  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: { requestId, status: "accepted" },
    };
  }

  try {
    const response = await fetch(`/api/marketplace/requests/${encodeURIComponent(requestId)}/accept`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({}),
    });

    return await parseApiResponse(response);
  } catch (error) {
    console.error("Failed to accept job request:", error);
    return {
      success: false,
      error: "Unable to accept request. Please try again.",
    };
  }
};
