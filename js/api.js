// js/api.js

const API_BASE_URL = "http://localhost:5000/api"; // Adjust if your backend runs elsewhere

// --- Helper Function for Authenticated Requests ---
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("mindmateToken");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    console.error(
      `API Error (${response.status}): ${errorData.message}`,
      errorData
    );
    const error = new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  // For 204 No Content, response.json() will fail.
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

// --- Authentication Functions ---
async function registerAPI(username, password) {
  return fetchWithAuth(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

async function loginAPI(username, password) {
  const data = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (data && data.token) {
    localStorage.setItem("mindmateToken", data.token);
    // Optionally store user info, but token is primary
    localStorage.setItem(
      "mindmateUser",
      JSON.stringify({ _id: data._id, username: data.username })
    );
  }
  return data;
}

function logoutAPI() {
  localStorage.removeItem("mindmateToken");
  localStorage.removeItem("mindmateUser");
  // No backend call needed for simple JWT logout, but you could have one for session invalidation if using server-side sessions.
  return Promise.resolve({ success: true, message: "Logged out" });
}

async function getCurrentUserAPI() {
  if (!localStorage.getItem("mindmateToken")) {
    return null; // Not logged in
  }
  try {
    return await fetchWithAuth(`${API_BASE_URL}/auth/me`);
  } catch (error) {
    if (error.status === 401) {
      // Token might be invalid or expired
      logoutAPI(); // Clear invalid token
    }
    console.error("Error fetching current user:", error);
    return null;
  }
}

function getLoggedInUser() {
  const user = localStorage.getItem("mindmateUser");
  return user ? JSON.parse(user) : null;
}

function getToken() {
  return localStorage.getItem("mindmateToken");
}

// --- Chat Function ---
async function callChatAPI(message, history = []) {
  // Ensure history is in the format expected by the backend if it differs from frontend's internal format
  // Backend expects: { message: "user's current message", history: [{role: "user"|"model", parts: [{text: "..."}]}] }
  // Frontend might store history as: [{ sender: "user"|"bot", text: "..."}]
  const formattedHistory = history.map((h) => ({
    role: h.sender === "user" ? "user" : "model",
    parts: [{ text: h.text }],
  }));

  return fetchWithAuth(`${API_BASE_URL}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, history: formattedHistory }), // Send current message and history
  });
}

// --- Mood Functions ---
// Note: Your backend's mood model has 'mood' (string) and 'score' (number).
// The old getMoodScore function is still useful on the frontend for quick mood checks.
function getMoodScore(mood) {
  const scores = { happy: 8, calm: 7, sad: 3, anxious: 4, stressed: 4 };
  return scores[mood.toLowerCase()] || 5;
}

async function logMoodAPI(
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

async function getMoodEntriesAPI() {
  return fetchWithAuth(`${API_BASE_URL}/moods`);
}

async function getMoodChartDataAPI(days = 7) {
  return fetchWithAuth(`${API_BASE_URL}/moods/chart?days=${days}`);
}

// --- Journal Functions ---
async function saveJournalAPI(
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

async function getJournalEntriesAPI() {
  return fetchWithAuth(`${API_BASE_URL}/journal`);
}

async function getJournalEntryByIdAPI(id) {
  return fetchWithAuth(`${API_BASE_URL}/journal/${id}`);
}

async function updateJournalEntryAPI(id, data) {
  // data = { title, content, associatedMood }
  return fetchWithAuth(`${API_BASE_URL}/journal/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteJournalEntryAPI(id) {
  // DELETE requests might not return a body, or a small success message.
  // fetchWithAuth handles 204 No Content.
  return fetchWithAuth(`${API_BASE_URL}/journal/${id}`, {
    method: "DELETE",
  });
}
