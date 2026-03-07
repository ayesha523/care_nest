const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
const USE_MOCK_AUTH = process.env.REACT_APP_USE_MOCK_AUTH === "true";

const normalizeAuthPayload = ({ name, email, password, role }) => ({
  ...(name ? { name: name.trim() } : {}),
  email: email.trim().toLowerCase(),
  password,
  role,
});

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const responseBody = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof responseBody === "object" && responseBody?.message
        ? responseBody.message
        : "Authentication request failed.";
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
};

const postAuth = async (path, payload) => {
  if (USE_MOCK_AUTH) {
    return {
      success: true,
      data: {
        token: "mock-auth-token",
        user: { email: payload.email, role: payload.role, name: payload.name || "" },
      },
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await parseApiResponse(response);
  } catch (error) {
    return {
      success: false,
      error: "Unable to connect to server. Please try again.",
    };
  }
};

export const signupUser = async ({ name, email, password, role }) => {
  const payload = normalizeAuthPayload({ name, email, password, role });
  return postAuth("/api/auth/signup", payload);
};

export const loginUser = async ({ email, password, role }) => {
  const payload = normalizeAuthPayload({ email, password, role });
  return postAuth("/api/auth/login", payload);
};