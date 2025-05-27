// lib/apiClient.js or utils/apiClient.js

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// --- Helper Function for Authenticated Requests ---
async function fetchWithAuth(url, options = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("mindmateToken")
      : null;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    // Try to parse error data, but default to statusText if parsing fails
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }

    const error = new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
    error.status = response.status;
    error.data = errorData; // Attach full error data if available
    throw error;
  }

  // For 204 No Content, response.json() will fail.
  if (response.status === 204) {
    return null; // Or { success: true } if you prefer
  }
  return response.json();
}

// --- Authentication Functions ---
export async function registerAPI(username, password) {
  return fetchWithAuth(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function loginAPI(username, password) {
  const data = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  // Store token and basic user info in localStorage upon successful login
  if (data && data.token && typeof window !== "undefined") {
    localStorage.setItem("mindmateToken", data.token);
    // Store user object which now includes credits from backend
    localStorage.setItem(
      "mindmateUser",
      JSON.stringify({
        _id: data._id,
        username: data.username,
        credits: data.credits,
      })
    );
  }
  return data; // Return full data including user object and token
}

export async function logoutAPI() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("mindmateToken");
    localStorage.removeItem("mindmateUser");
  }
  // No backend call needed for simple JWT logout, but can be added if server-side session invalidation is desired.
  return Promise.resolve({ success: true, message: "Logged out successfully" });
}

export async function getCurrentUserAPI() {
  if (typeof window !== "undefined" && !localStorage.getItem("mindmateToken")) {
    return null; // No token, so user is not logged in or token expired
  }
  try {
    // This call will verify the token on the backend
    return await fetchWithAuth(`${API_BASE_URL}/auth/me`);
  } catch (error) {
    if (error.status === 401) {
      // Unauthorized (token likely invalid or expired)
      console.warn("Token validation failed with /auth/me, logging out.");
      await logoutAPI(); // Clear invalid token and user from localStorage
    }
    // Don't re-throw here, allow calling function to know user is null
    return null;
  }
}

export function getLoggedInUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("mindmateUser");
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Error parsing mindmateUser from localStorage", e);
    localStorage.removeItem("mindmateUser"); // Clear corrupted data
    return null;
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mindmateToken");
}

// --- Chat Function ---
export async function callChatAPI(message, clientHistory = []) {
  // clientHistory is an array of { sender: "user"|"bot", text: "..."}
  // Backend will map this to Gemini's expected format { role: "user"|"model", parts: [...] }
  return fetchWithAuth(`${API_BASE_URL}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, history: clientHistory }),
  });
}

// --- Mood Functions ---
export function getMoodScore(mood) {
  const scores = { happy: 8, calm: 7, sad: 3, anxious: 4, stressed: 4 };
  return scores[mood.toLowerCase()] || 5; // Default score
}

export async function logMoodAPI(
  mood,
  score,
  notes = "",
  entryDate = new Date().toISOString()
) {
  return fetchWithAuth(`${API_BASE_URL}/moods`, {
    method: "POST",
    body: JSON.stringify({ mood, score, notes, entryDate }),
  });
}

export async function getMoodEntriesAPI() {
  return fetchWithAuth(`${API_BASE_URL}/moods`);
}

export async function getMoodChartDataAPI(days = 7) {
  return fetchWithAuth(`${API_BASE_URL}/moods/chart?days=${days}`);
}

// --- Journal Functions ---
export async function saveJournalAPI(
  title,
  content,
  entryDate = new Date().toISOString(),
  associatedMood = ""
) {
  return fetchWithAuth(`${API_BASE_URL}/journal`, {
    method: "POST",
    body: JSON.stringify({ title, content, entryDate, associatedMood }),
  });
}

export async function getJournalEntriesAPI() {
  return fetchWithAuth(`${API_BASE_URL}/journal`);
}

export async function getJournalEntryByIdAPI(id) {
  return fetchWithAuth(`${API_BASE_URL}/journal/${id}`);
}

export async function updateJournalEntryAPI(id, data) {
  // data = { title, content, associatedMood }
  return fetchWithAuth(`${API_BASE_URL}/journal/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteJournalEntryAPI(id) {
  return fetchWithAuth(`${API_BASE_URL}/journal/${id}`, {
    method: "DELETE",
  });
}
