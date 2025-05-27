// lib/apiClient.js or utils/apiClient.js

const API_BASE_URL = "/api"; // Calls will be relative to the current domain

// --- Helper Function for Authenticated Requests ---
export async function fetchWithAuth(url, options = {}) {
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

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store", // <<< This is to prevent browser caching of fetch requests
  });

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
  const data = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
    // This also doesn't need a token yet
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  // Backend response 'data' should be: { _id, username, token, credits, message }

  if (data && data.token && typeof window !== "undefined") {
    // If registration auto-logs in the user, set token and user info
    localStorage.setItem("mindmateToken", data.token);
    localStorage.setItem(
      "mindmateUser",
      JSON.stringify({
        // Store role and credits
        _id: data._id,
        username: data.username,
        credits: data.credits,
        role: data.role,
      })
    );

    console.log(
      "Token and user set in localStorage after registration:",
      data.token,
      data
    ); // DEBUG
  } else {
    console.error("Register API response missing token or user data:", data); // DEBUG
  }
  return data; // Return full data
}

export async function loginAPI(username, password) {
  const data = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
    // This fetchWithAuth call doesn't need a token yet
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  // Backend response 'data' should be: { _id, username, token, credits, message }

  if (data && data.token && typeof window !== "undefined") {
    localStorage.setItem("mindmateToken", data.token);
    // Store the user object received from the backend, which includes credits
    localStorage.setItem(
      "mindmateUser",
      JSON.stringify({
        // Store role and credits
        _id: data._id,
        username: data.username,
        credits: data.credits,
        role: data.role,
      })
    );
    console.log(
      "Token and user set in localStorage after login:",
      data.token,
      data
    ); // DEBUG
  } else {
    console.error("Login API response missing token or user data:", data); // DEBUG
  }
  return data; // Return the full data object from backend
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
    return null;
  }
  try {
    const userFromServer = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
    // Ensure userFromServer contains role. If it does, it will be used to update currentUser state.
    // Also update localStorage if fresh data is different (especially role or credits)
    if (userFromServer && typeof window !== "undefined") {
      localStorage.setItem(
        "mindmateUser",
        JSON.stringify({
          _id: userFromServer._id,
          username: userFromServer.username,
          credits: userFromServer.credits,
          role: userFromServer.role,
        })
      );
    }
    return userFromServer;
  } catch (error) {
    if (error.status === 401) {
      console.warn(
        "apiClient: Token validation failed with /auth/me, logging out."
      );
      await logoutAPI();
    }
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
    localStorage.removeItem("mindmateUser");
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

export async function startNewChatSessionAPI(firstMessage = "") {
  // Optional first message
  return fetchWithAuth(`${API_BASE_URL}/chat/new`, {
    method: "POST",
    body: JSON.stringify({ firstMessage }),
  });
}

export async function getChatSessionsAPI() {
  return fetchWithAuth(`${API_BASE_URL}/chat/sessions`);
}

export async function getChatSessionMessagesAPI(sessionId) {
  return fetchWithAuth(`${API_BASE_URL}/chat/${sessionId}`); // GET request
}

export async function sendMessageToSessionAPI(sessionId, message) {
  return fetchWithAuth(`${API_BASE_URL}/chat/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ message }),
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
