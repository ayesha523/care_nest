/**
 * Authentication Service Module
 * Handles user login and signup operations with fallback server discovery
 * Supports both real API and mock authentication for development
 */

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").trim();
const USE_MOCK_AUTH = process.env.REACT_APP_USE_MOCK_AUTH === "true";

/**
 * Generates list of candidate API endpoints to try
 * Includes configured base URL, relative path (for proxy), and localhost fallback
 * 
 * @returns {Array<string>} Array of API base URL candidates
 */
const getApiBaseCandidates = () => {
  const candidates = [];

  if (API_BASE_URL) {
    candidates.push(API_BASE_URL.replace(/\/$/, ""));
  }

  // Relative path supports CRA proxy in development.
  candidates.push("");

  // Direct local backend fallback when app is served without proxy.
  if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
    candidates.push("http://localhost:5000");
    candidates.push("http://127.0.0.1:5000");
  }

  return [...new Set(candidates)];
};

/**
 * Normalizes authentication payload for consistent formatting
 * Trims whitespace, lowercases email, ensures all required fields present
 * 
 * @param {Object} data - Authentication data
 * @param {string} [data.name] - User's full name (optional, for signup)
 * @param {string} data.email - User's email address
 * @param {string} data.password - User's password
 * @param {string} data.role - User role ('elderly' or 'companion')
 * @returns {Object} Normalized authentication payload
 */
const normalizeAuthPayload = ({ name, email, password, role }) => ({
  ...(name ? { name: name.trim() } : {}),
  email: email.trim().toLowerCase(),
  password,
  role,
});

/**
 * Parses API response and normalizes the format
 * Handles various response formats and error scenarios
 * 
 * @param {Response} response - Fetch Response object
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Normalized response
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
          : `Authentication failed with status ${response.status}`;
      return { success: false, error: message };
    }

    if (
      typeof responseBody === "object" &&
      responseBody !== null &&
      "success" in responseBody &&
      "data" in responseBody
    ) {
      return responseBody;
    }

    return { success: true, data: responseBody };
  } catch (error) {
    console.error("Failed to parse auth response:", error);
    return {
      success: false,
      error: "Invalid response format from server",
    };
  }
};

/**
 * Performs POST request to authentication endpoint with fallback discovery
 * Tries multiple API base candidates to handle different deployment configurations
 * 
 * @param {string} path - API endpoint path
 * @param {Object} payload - Request payload
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Auth response with token and user data
 */
const postAuth = async (path, payload) => {
  // Validate inputs
  if (!path || typeof path !== "string") {
    return {
      success: false,
      error: "Invalid API path provided",
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      success: false,
      error: "Invalid payload provided",
    };
  }

  if (USE_MOCK_AUTH) {
    return {
      success: true,
      data: {
        token: "mock-auth-token",
        user: { email: payload.email, role: payload.role, name: payload.name || "" },
      },
    };
  }

  let lastError = null;

  for (const base of getApiBaseCandidates()) {
    const url = `${base}${path}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const parsed = await parseApiResponse(response);

      // Retry another base only if we got a likely route mismatch response.
      if (!parsed.success && response.status === 404) {
        lastError = parsed.error || "Authentication endpoint not found.";
        continue;
      }

      return parsed;
    } catch (error) {
      console.warn(`Auth request failed to ${url}:`, error);
      lastError = error?.message || "Network error";
    }
  }

  return {
    success: false,
    error: lastError
      ? `Unable to connect to auth server (${lastError}).`
      : "Unable to connect to server. Please try again.",
  };
};


/**
 * Registers a new user account
 * Validates input data and sends signup request to authentication endpoint
 * 
 * @param {Object} data - Signup data
 * @param {string} data.name - User's full name
 * @param {string} data.email - User's email address (will be lowercased)
 * @param {string} data.password - User's password
 * @param {string} data.role - User role ('elderly' or 'companion')
 * @returns {Promise<{success: boolean, data?: {token: string, user: Object}, error?: string}>} Signup result with JWT token
 */
export const signupUser = async ({ name, email, password, role }) => {
  // Input validation
  if (!name || typeof name !== "string") {
    return { success: false, error: "Valid name is required" };
  }
  if (!email || typeof email !== "string") {
    return { success: false, error: "Valid email is required" };
  }
  if (!password || typeof password !== "string") {
    return { success: false, error: "Valid password is required" };
  }
  if (!role || typeof role !== "string") {
    return { success: false, error: "Valid role is required" };
  }

  const payload = normalizeAuthPayload({ name, email, password, role });
  return postAuth("/api/auth/signup", payload);
};

/**
 * Authenticates an existing user
 * Validates credentials and sends login request to authentication endpoint
 * 
 * @param {Object} data - Login data
 * @param {string} data.email - User's email address (will be lowercased)
 * @param {string} data.password - User's password
 * @param {string} data.role - User role ('elderly' or 'companion')
 * @returns {Promise<{success: boolean, data?: {token: string, user: Object}, error?: string}>} Login result with JWT token
 */
export const loginUser = async ({ email, password, role }) => {
  // Input validation
  if (!email || typeof email !== "string") {
    return { success: false, error: "Valid email is required" };
  }
  if (!password || typeof password !== "string") {
    return { success: false, error: "Valid password is required" };
  }
  if (!role || typeof role !== "string") {
    return { success: false, error: "Valid role is required" };
  }

  const payload = normalizeAuthPayload({ email, password, role });
  return postAuth("/api/auth/login", payload);
};