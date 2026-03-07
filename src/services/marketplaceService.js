const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === "true";

const getStoredAuthToken = () => {
  try {
    const rawUser = localStorage.getItem("carenest_user");
    if (!rawUser) {
      return "";
    }
    const parsedUser = JSON.parse(rawUser);
    return parsedUser?.token || "";
  } catch (error) {
    return "";
  }
};

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

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const responseBody = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof responseBody === "object" && responseBody?.message
        ? responseBody.message
        : "Request failed.";
    return { success: false, error: message };
  }

  // If backend already returns { success, data } format, return it directly
  if (typeof responseBody === "object" && "success" in responseBody && "data" in responseBody) {
    return responseBody;
  }

  // Otherwise wrap it
  return { success: true, data: responseBody };
};

const apiGet = async (path) => {
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
    return {
      success: false,
      error: "Unable to connect to server. Please try again.",
    };
  }
};

// Marketplace API calls
export const getCompanions = async (filters = {}) => {
  if (USE_MOCK_DATA) {
    let results = [...MOCK_COMPANIONS];
    if (filters.specialization) {
      results = results.filter((c) =>
        c.specializations.includes(filters.specialization)
      );
    }
    if (filters.maxRate) {
      results = results.filter((c) => c.hourlyRate <= filters.maxRate);
    }
    return { success: true, data: results };
  }

  const queryParams = new URLSearchParams(filters);
  return apiGet(`/api/marketplace/companions?${queryParams}`);
};

export const getCompanionById = async (id) => {
  if (USE_MOCK_DATA) {
    const companion = MOCK_COMPANIONS.find((c) => c.id === id);
    return {
      success: !!companion,
      data: companion,
      error: companion ? null : "Companion not found",
    };
  }

  return apiGet(`/api/marketplace/companions/${id}`);
};

export const getJobRequests = async (filters = {}) => {
  if (USE_MOCK_DATA) {
    let results = [...MOCK_JOB_REQUESTS];
    if (filters.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    if (filters.specialization) {
      results = results.filter((r) =>
        r.specializations.includes(filters.specialization)
      );
    }
    return { success: true, data: results };
  }

  const queryParams = new URLSearchParams(filters);
  return apiGet(`/api/marketplace/requests?${queryParams}`);
};

export const requestCompanion = async (companionId, requestData) => {
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
    return {
      success: false,
      error: "Unable to submit request. Please try again.",
    };
  }
};

export const acceptJobRequest = async (requestId) => {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: { requestId, status: "accepted" },
    };
  }

  try {
    const response = await fetch(`/api/marketplace/requests/${requestId}/accept`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({}),
    });

    return await parseApiResponse(response);
  } catch (error) {
    return {
      success: false,
      error: "Unable to accept request. Please try again.",
    };
  }
};
