// js/main.js

// --- App State ---
let currentPage = "home";
let currentUser = null; // Store logged-in user details
let chatHistory = []; // To store chat messages for context with Gemini
let breathingInterval = null;
let moodChartInstance = null; // To hold the chart instance for updates/destruction

// --- DOM Elements (cache frequently used ones) ---
const pageTitle = document.getElementById("pageTitle");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileOverlay = document.getElementById("mobileOverlay");
const sidebar = document.getElementById("sidebar");
// Auth Modal Elements
const authModalContainer = document.getElementById("authModalContainer");
const loginFormContainer = document.getElementById("loginFormContainer");
const registerFormContainer = document.getElementById("registerFormContainer");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");
const authErrorEl = document.getElementById("authError");
const closeAuthModalBtnLogin = document.getElementById(
  "closeAuthModalBtnLogin"
);
const closeAuthModalBtnRegister = document.getElementById(
  "closeAuthModalBtnRegister"
);

// User Profile UI
const userProfileSection = document.getElementById("userProfile");
const usernameDisplay = document.getElementById("usernameDisplay");
const logoutBtn = document.getElementById("logoutBtn");
const loginPromptSection = document.getElementById("loginPrompt");
const openLoginModalBtn = document.getElementById("openLoginModalBtn");

// Chat elements
const chatMessagesContainer = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");

// Journal elements
const journalFormEl = document.getElementById("journalForm");
const journalTitleInput = document.getElementById("journalTitle");
const journalContentInput = document.getElementById("journalContent");
const journalEntriesContainer = document.getElementById("journalEntries");

// Mood elements
const quickMoodGrid = document.getElementById("quickMoodGrid");
const moodChartCanvas = document.getElementById("moodChart");
const recentMoodEntriesContainer = document.querySelector(
  "#mood-tracker .bg-white.rounded-2xl.shadow-lg.p-6 .space-y-4"
); // More specific selector

// Welcome card
const welcomeHeader = document.querySelector("#home .text-3xl.font-bold");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

async function initializeApp() {
  setupEventListeners();
  await checkAuthStatusAndInitializeUI();
  // showPage("home"); // showPage is called within checkAuthStatus or if no auth needed
  // updateActiveNav("home"); // updateActiveNav is called by showPage
}

async function checkAuthStatusAndInitializeUI() {
  currentUser = getLoggedInUser(); // From api.js

  if (currentUser && getToken()) {
    // Optionally verify token with backend
    try {
      const userFromServer = await getCurrentUserAPI(); // Verifies token
      if (userFromServer) {
        currentUser = userFromServer; // Use fresh data
        localStorage.setItem("mindmateUser", JSON.stringify(currentUser)); // Update local user
        updateUIAfterLogin();
        showPage("home"); // Or last visited page
        loadUserSpecificData(); // Fetch moods, journals
      } else {
        // Token was invalid or user not found by server
        handleLogout(); // Clears local storage and UI
      }
    } catch (error) {
      // API call failed (e.g. network, or 401 if token invalid)
      console.error("Auth check failed:", error);
      handleLogout();
    }
  } else {
    updateUIAfterLogout();
    showPage("home"); // Show home, but it might prompt for login
    // Optionally, show login modal automatically: openAuthModal('login');
  }
}

function updateUIAfterLogin() {
  if (userProfileSection) userProfileSection.classList.remove("hidden");
  if (usernameDisplay && currentUser)
    usernameDisplay.textContent = currentUser.username;
  if (loginPromptSection) loginPromptSection.classList.add("hidden");
  if (authModalContainer) authModalContainer.classList.add("hidden");
  if (welcomeHeader && currentUser)
    welcomeHeader.textContent = `Hello, ${currentUser.username}! 👋`;

  // Enable features that require login
  if (quickMoodGrid) quickMoodGrid.style.opacity = "1";
  if (document.getElementById("journal"))
    document.getElementById("journal").style.opacity = "1";
  // etc. for other elements
}

function updateUIAfterLogout() {
  if (userProfileSection) userProfileSection.classList.add("hidden");
  if (usernameDisplay) usernameDisplay.textContent = "";
  if (loginPromptSection) loginPromptSection.classList.remove("hidden");
  if (welcomeHeader) welcomeHeader.textContent = `Hello, Guest! 👋`; // Or general greeting

  // Clear dynamic data areas
  if (chatMessagesContainer)
    chatMessagesContainer.innerHTML =
      '<p class="text-center text-gray-500">Login to start chatting.</p>'; // Clear chat
  if (moodChartInstance) moodChartInstance.destroy(); // Clear chart
  if (recentMoodEntriesContainer)
    recentMoodEntriesContainer.innerHTML =
      '<p class="text-center text-gray-500">Login to see your mood history.</p>';
  if (journalEntriesContainer)
    journalEntriesContainer.innerHTML =
      '<p class="text-center text-gray-500">Login to see your journal entries.</p>';
  chatHistory = []; // Reset chat history

  // Disable features requiring login, or show prompts
  // e.g. quickMoodGrid.style.pointerEvents = "none"; quickMoodGrid.style.opacity = "0.5";
}

function loadUserSpecificData() {
  if (!currentUser) return;
  // Load initial data for dashboard, mood tracker, journal
  loadAndRenderMoodEntries();
  loadAndRenderMoodChart();
  loadAndRenderJournalEntries();
  // Reset chat history for new session or load from a persistent store if implemented
  chatHistory = [];
  // Add initial bot message if chat page is active
  if (document.getElementById("chat").classList.contains("active")) {
    addChatMessage("Hello! I'm MindMate. How are you feeling today? 😊", "bot");
  }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", toggleMobileMenu);
  if (mobileOverlay) mobileOverlay.addEventListener("click", closeMobileMenu);

  if (chatInput)
    chatInput.addEventListener(
      "keypress",
      (e) => e.key === "Enter" && sendMessage()
    );
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  document.querySelectorAll(".mood-card").forEach((card) => {
    card.addEventListener("click", function () {
      if (!currentUser) {
        openAuthModal("login", "Please login to log your mood.");
        return;
      }
      const mood = this.dataset.mood;
      const score = getMoodScore(mood); // from api.js
      selectMood(mood, score, this);
    });
  });

  // Auth Modal Listeners
  if (openLoginModalBtn)
    openLoginModalBtn.addEventListener("click", () => openAuthModal("login"));
  if (showRegisterBtn)
    showRegisterBtn.addEventListener("click", () => openAuthModal("register"));
  if (showLoginBtn)
    showLoginBtn.addEventListener("click", () => openAuthModal("login"));

  const closeButtons = [closeAuthModalBtnLogin, closeAuthModalBtnRegister];
  closeButtons.forEach((btn) => {
    if (btn) btn.addEventListener("click", closeAuthModal);
  });
  if (authModalContainer) {
    authModalContainer.addEventListener("click", (e) => {
      // Close on overlay click
      if (e.target === authModalContainer) closeAuthModal();
    });
  }

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  // Journal Form (assuming it's already in HTML, might need adjustment if dynamically added)
  const newJournalEntryBtn = document.querySelector(
    'button[onclick="newJournalEntry()"]'
  );
  if (newJournalEntryBtn)
    newJournalEntryBtn.onclick = (e) => {
      // Override existing onclick
      e.preventDefault();
      if (!currentUser) {
        openAuthModal("login", "Please login to create a journal entry.");
        return;
      }
      newJournalEntry();
    };

  const saveJournalBtn = document.querySelector(
    '#journalForm button[onclick="saveJournalEntry()"]'
  );
  if (saveJournalBtn)
    saveJournalBtn.onclick = (e) => {
      // Override
      e.preventDefault();
      saveJournalEntry();
    };
  const cancelJournalBtn = document.querySelector(
    '#journalForm button[onclick="cancelJournalEntry()"]'
  );
  if (cancelJournalBtn)
    cancelJournalBtn.onclick = (e) => {
      // Override
      e.preventDefault();
      cancelJournalEntry();
    };

  document
    .querySelectorAll('#journalPrompts div[onclick^="usePrompt"]')
    .forEach((promptDiv) => {
      const originalOnclick = promptDiv.getAttribute("onclick");
      const promptText = originalOnclick.match(/usePrompt\('(.*)'\)/)[1];
      promptDiv.onclick = (e) => {
        // Override
        e.preventDefault();
        if (!currentUser) {
          openAuthModal("login", "Please login to use journal prompts.");
          return;
        }
        usePrompt(promptText);
      };
    });

  // Quick actions on home page
  document.querySelectorAll(".quick-action-card").forEach((card) => {
    // Add class 'quick-action-card' to those divs
    card.addEventListener("click", function () {
      if (
        !currentUser &&
        (this.dataset.action === "chat" || this.dataset.action === "journal")
      ) {
        openAuthModal("login", `Please login to use ${this.dataset.action}.`);
        return; // Stop further execution if not logged in and action requires it
      }
      // Original onclicks from HTML for breathing exercise are fine,
      // but for chat/journal, showPage will handle it after auth check.
      if (this.dataset.action === "chat") showPage("chat");
      else if (this.dataset.action === "journal") showPage("journal");
      // Breathing exercise is handled by its own HTML onclick for now
    });
  });

  // Floating chat button
  const floatingChatBtn = document.querySelector(".floating-button");
  if (floatingChatBtn)
    floatingChatBtn.onclick = (e) => {
      e.preventDefault();
      if (!currentUser) {
        openAuthModal("login", "Please login to chat.");
        return;
      }
      showPage("chat");
    };

  // Keyboard shortcuts (Escape to close auth modal too)
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "5") {
      // ... (existing code)
    }
    if (e.key === "Escape") {
      // ... (existing code)
      if (
        authModalContainer &&
        !authModalContainer.classList.contains("hidden")
      ) {
        closeAuthModal();
      }
    }
  });
}

// --- Auth Modal Functions ---
function openAuthModal(type = "login", message = "") {
  if (!authModalContainer) return;
  authModalContainer.classList.remove("hidden");
  if (authErrorEl) {
    authErrorEl.textContent = message;
    authErrorEl.classList.toggle("hidden", !message);
  }
  if (type === "login") {
    if (loginFormContainer) loginFormContainer.classList.remove("hidden");
    if (registerFormContainer) registerFormContainer.classList.add("hidden");
    if (loginForm) loginForm.reset();
  } else {
    if (registerFormContainer) registerFormContainer.classList.remove("hidden");
    if (loginFormContainer) loginFormContainer.classList.add("hidden");
    if (registerForm) registerForm.reset();
  }
}

function closeAuthModal() {
  if (authModalContainer) authModalContainer.classList.add("hidden");
  if (authErrorEl) authErrorEl.classList.add("hidden");
}

// --- Auth Handler Functions ---
async function handleLogin(event) {
  event.preventDefault();
  if (!loginForm || !authErrorEl) return;
  authErrorEl.classList.add("hidden");
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value.trim();

  if (!username || !password) {
    authErrorEl.textContent = "Username and password are required.";
    authErrorEl.classList.remove("hidden");
    return;
  }

  try {
    const data = await loginAPI(username, password); // api.js
    currentUser = { _id: data._id, username: data.username }; // Store user data
    updateUIAfterLogin();
    closeAuthModal();
    showPage("home");
    loadUserSpecificData();
  } catch (error) {
    authErrorEl.textContent =
      error.message || "Login failed. Please try again.";
    authErrorEl.classList.remove("hidden");
    console.error("Login failed:", error);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  if (!registerForm || !authErrorEl) return;
  authErrorEl.classList.add("hidden");
  const username = registerForm.username.value.trim();
  const password = registerForm.password.value.trim();
  const confirmPassword = registerForm.confirmPassword.value.trim();

  if (!username || !password || !confirmPassword) {
    authErrorEl.textContent = "All fields are required.";
    authErrorEl.classList.remove("hidden");
    return;
  }
  if (password !== confirmPassword) {
    authErrorEl.textContent = "Passwords do not match.";
    authErrorEl.classList.remove("hidden");
    return;
  }
  // Basic password strength (example)
  if (password.length < 6) {
    authErrorEl.textContent = "Password must be at least 6 characters.";
    authErrorEl.classList.remove("hidden");
    return;
  }

  try {
    const data = await registerAPI(username, password); // api.js
    // Automatically log in the user after registration
    currentUser = { _id: data._id, username: data.username };
    localStorage.setItem("mindmateToken", data.token); // Store token from registration
    localStorage.setItem("mindmateUser", JSON.stringify(currentUser));
    updateUIAfterLogin();
    closeAuthModal();
    showPage("home");
    loadUserSpecificData();
  } catch (error) {
    authErrorEl.textContent =
      error.message || "Registration failed. Please try again.";
    authErrorEl.classList.remove("hidden");
    console.error("Registration failed:", error);
  }
}

async function handleLogout() {
  await logoutAPI(); // api.js
  currentUser = null;
  updateUIAfterLogout();
  showPage("home"); // Or a dedicated logged-out home page/login page
}

// --- Navigation Functions (largely unchanged, but consider auth impact) ---
function showPage(pageId) {
  // If trying to access a protected page without being logged in, redirect or show login
  const protectedPages = ["chat", "mood-tracker", "journal"]; // Add 'resources' if it becomes protected
  if (protectedPages.includes(pageId) && !currentUser) {
    openAuthModal(
      "login",
      `Please login to access the ${pageId.replace("-", " ")} page.`
    );
    // Don't switch to the page, keep current page or go to home
    // If current page is already a protected one, switch to home.
    if (protectedPages.includes(currentPage)) {
      document.getElementById(currentPage)?.classList.remove("active");
      document.getElementById("home").classList.add("active");
      pageId = "home"; // for title and nav update
      currentPage = "home";
    } else {
      // Stay on current page, modal is shown
      return;
    }
  }

  document
    .querySelectorAll(".page")
    .forEach((page) => page.classList.remove("active"));
  const targetPage = document.getElementById(pageId);

  if (targetPage) {
    targetPage.classList.add("active");
  } else {
    console.error(`Page with id "${pageId}" not found.`);
    document.getElementById("home").classList.add("active"); // Fallback
    pageId = "home";
  }

  const titles = {
    /* ... same as before ... */
  };
  if (pageTitle) pageTitle.textContent = titles[pageId] || "MindMate";

  updateActiveNav(pageId);
  closeMobileMenu();
  currentPage = pageId;

  // If navigating to chat, ensure initial bot message if history is empty
  if (pageId === "chat" && currentUser && chatHistory.length === 0) {
    if (chatMessagesContainer) {
      // Clear any "login to chat" or other placeholder messages first
      const placeholder = chatMessagesContainer.querySelector(
        "p.text-center.text-gray-500"
      );
      if (placeholder) {
        chatMessagesContainer.innerHTML = "";
      }
    }
    const initialBotMessage =
      "Hello! I'm MindMate. How are you feeling today? 😊";
    addChatMessage(initialBotMessage, "bot"); // Adds to UI
    chatHistory.push({ sender: "bot", text: initialBotMessage }); // ADDS TO CONVERSATIONAL HISTORY
  }
}

// updateActiveNav, toggleMobileMenu, closeMobileMenu (mostly same)
function updateActiveNav(pageId) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("bg-purple-100", "text-purple-700");
  });

  const navButtons = document.querySelectorAll(".nav-btn");
  const pageOrder = ["home", "chat", "mood-tracker", "journal", "resources"];
  const pageIndex = pageOrder.indexOf(pageId);

  if (pageIndex !== -1 && navButtons[pageIndex]) {
    navButtons[pageIndex].classList.add("bg-purple-100", "text-purple-700");
  }
}

function toggleMobileMenu() {
  /* ... same ... */
}
function closeMobileMenu() {
  /* ... same ... */
}

// --- Chat Functions ---
async function sendMessage() {
  if (!currentUser) {
    addChatMessage("Please login to chat with MindMate.", "bot"); // Or open login modal
    openAuthModal("login", "Please login to chat.");
    return;
  }
  if (!chatInput) return;
  const messageText = chatInput.value.trim();
  if (!messageText) return;

  addChatMessage(messageText, "user"); // Adds to UI
  chatHistory.push({ sender: "user", text: messageText }); // ADDS TO HISTORY
  chatInput.value = "";
  showTypingIndicator();

  try {
    const response = await callChatAPI(messageText, chatHistory.slice(-10)); // Send current message and last 10 history items for context
    hideTypingIndicator();
    addChatMessage(response.reply, "bot"); // Assuming backend returns { reply: "..." }
    chatHistory.push({ sender: "bot", text: response.reply });

    // if (response.suggestMoodLog) { ... } // You can handle this if backend provides it
  } catch (error) {
    hideTypingIndicator();
    addChatMessage(
      "I'm sorry, I'm having trouble connecting right now. Please try again.",
      "bot"
    );
    console.error("Error sending message:", error);
  }
}

function quickResponse(messageText) {
  if (!currentUser) {
    openAuthModal("login", "Please login to use quick responses.");
    return;
  }
  if (chatInput) {
    chatInput.value = messageText;
    sendMessage();
  }
}

function addChatMessage(message, sender) {
  // Mostly same, ensure chatMessagesContainer is defined
  if (!chatMessagesContainer) return;
  // ... (rest of the function is the same, ensure you clear any "login to chat" message first if it exists)
  // If the first message is being added (or container was cleared), clear placeholder text.
  if (chatMessagesContainer.querySelector("p.text-center.text-gray-500")) {
    chatMessagesContainer.innerHTML = "";
  }
  // ... (the existing HTML creation for messageDiv)
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("flex", "gap-3", "mb-4");

  if (sender === "user") {
    messageDiv.classList.add("justify-end");
    messageDiv.innerHTML = `
                <div class="chat-bubble-user text-white p-3 px-4 max-w-md">
                    <p class="text-sm">${message}</p>
                </div>
                <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-gray-600 text-xs"></i>
                </div>
            `;
  } else {
    // bot
    messageDiv.innerHTML = `
                <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-xs"></i>
                </div>
                <div class="chat-bubble-bot p-3 px-4 max-w-md">
                    <p class="text-gray-800 text-sm">${message}</p>
                </div>
            `;
  }
  chatMessagesContainer.appendChild(messageDiv);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function showTypingIndicator() {
  /* ... same ... */
}
function hideTypingIndicator() {
  /* ... same ... */
}

// --- Mood Functions ---
async function selectMood(mood, score, element) {
  // score is now passed in
  if (!currentUser) {
    alert("Please login to log your mood."); // Should ideally be a nicer modal
    return;
  }
  document.querySelectorAll(".mood-card").forEach((card) => {
    card.classList.remove(
      "selected",
      "border-purple-500",
      "ring-2",
      "ring-purple-300"
    );
    card.classList.add("border-gray-200");
  });
  if (element) {
    element.classList.add(
      "selected",
      "border-purple-500",
      "ring-2",
      "ring-purple-300"
    );
    element.classList.remove("border-gray-200");
  }

  try {
    await logMoodAPI(mood, score); // from api.js. Add notes/entryDate if you have UI for them.
    if (element) {
      const originalText = element.querySelector("p").textContent;
      element.querySelector("p").textContent = "Logged! 🎉";
      setTimeout(() => {
        element.classList.remove(
          "selected",
          "border-purple-500",
          "ring-2",
          "ring-purple-300"
        );
        element.classList.add("border-gray-200");
        element.querySelector("p").textContent = originalText;
      }, 1500);
    } else {
      alert("Mood logged!"); // Fallback if element not provided
    }
    // Refresh mood data dependent UIs
    loadAndRenderMoodEntries();
    loadAndRenderMoodChart();
  } catch (error) {
    console.error("Error logging mood:", error);
    alert(`Could not log mood: ${error.message}. Please try again.`);
    if (element) {
      // Revert UI selection on error
      setTimeout(() => {
        element.classList.remove(
          "selected",
          "border-purple-500",
          "ring-2",
          "ring-purple-300"
        );
        element.classList.add("border-gray-200");
      }, 500);
    }
  }
}

async function loadAndRenderMoodEntries() {
  if (!currentUser || !recentMoodEntriesContainer) return;
  try {
    const entries = await getMoodEntriesAPI();
    recentMoodEntriesContainer.innerHTML = ""; // Clear old entries
    if (entries.length === 0) {
      recentMoodEntriesContainer.innerHTML =
        '<p class="text-center text-gray-500">No mood entries yet. Log your mood to see it here!</p>';
      return;
    }
    // Take last 3 for "Recent Entries"
    entries.slice(0, 3).forEach((entry) => {
      const moodEmoji = {
        happy: "😊",
        sad: "😢",
        anxious: "😰",
        calm: "😌",
        stressed: "😵",
      };
      const entryDiv = document.createElement("div");
      entryDiv.className =
        "flex items-center justify-between p-4 bg-gray-50 rounded-lg";
      entryDiv.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="text-2xl">${
                      moodEmoji[entry.mood.toLowerCase()] || "😐"
                    }</span>
                    <div>
                        <p class="font-medium text-gray-900 capitalize">${
                          entry.mood
                        }</p>
                        <p class="text-sm text-gray-600">${formatDate(
                          entry.entryDate
                        )}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-lg font-semibold text-gray-900">${
                      entry.score
                    }/10</p>
                    ${
                      entry.notes
                        ? `<p class="text-xs text-gray-500 truncate w-24" title="${entry.notes}">${entry.notes}</p>`
                        : ""
                    }
                </div>
            `;
      recentMoodEntriesContainer.appendChild(entryDiv);
    });
  } catch (error) {
    console.error("Failed to load mood entries:", error);
    recentMoodEntriesContainer.innerHTML = `<p class="text-center text-red-500">Could not load mood entries: ${error.message}</p>`;
  }
}

// --- Mood Chart ---
async function loadAndRenderMoodChart(days = 7) {
  if (!currentUser || !moodChartCanvas || typeof Chart === "undefined") {
    if (moodChartInstance) moodChartInstance.destroy(); // Clear existing chart if user logs out
    return;
  }

  try {
    const chartDataFromAPI = await getMoodChartDataAPI(days); // from api.js
    const labels = chartDataFromAPI.map((entry) =>
      formatDate(entry.entryDate, true)
    );
    const dataPoints = chartDataFromAPI.map((entry) => entry.score);

    const chartData = {
      labels: labels.length > 0 ? labels : ["No Data"],
      datasets: [
        {
          label: "Mood Score",
          data: dataPoints.length > 0 ? dataPoints : [0], // Provide a default if no data
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#667eea",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    };

    if (moodChartInstance) {
      moodChartInstance.destroy(); // Destroy old chart before creating new
    }
    moodChartInstance = new Chart(moodChartCanvas.getContext("2d"), {
      type: "line",
      data: chartData,
      options: {
        /* ... same options as before ... */ responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            grid: { color: "#f1f5f9" },
            ticks: { color: "#64748b" },
          },
          x: { grid: { display: false }, ticks: { color: "#64748b" } },
        },
      },
    });
  } catch (error) {
    console.error("Error loading mood chart data:", error);
    if (moodChartCanvas.getContext("2d")) {
      // If canvas context exists, show error on chart
      if (moodChartInstance) moodChartInstance.destroy();
      // Optionally draw error text on canvas or display message nearby
    }
  }
}
// Add event listener to the mood chart dropdown
const moodChartPeriodSelect = document.querySelector("#mood-tracker select");
if (moodChartPeriodSelect) {
  moodChartPeriodSelect.addEventListener("change", (event) => {
    const selectedPeriod = event.target.value; // e.g. "Last 7 days", "Last 30 days"
    let days = 7;
    if (selectedPeriod.includes("30")) days = 30;
    else if (selectedPeriod.includes("3 months")) days = 90;
    loadAndRenderMoodChart(days);
  });
}

// --- Journal Functions ---
function newJournalEntry() {
  // UI only
  if (!journalFormEl) return;
  journalFormEl.classList.remove("hidden");
  if (journalContentInput) journalContentInput.focus();
}

function cancelJournalEntry() {
  // UI only
  if (!journalFormEl) return;
  journalFormEl.classList.add("hidden");
  if (journalTitleInput) journalTitleInput.value = "";
  if (journalContentInput) journalContentInput.value = "";
}

function usePrompt(prompt) {
  // UI only
  newJournalEntry();
  if (journalContentInput) {
    journalContentInput.value = `${prompt}\n\n`;
    journalContentInput.focus();
  }
}

async function saveJournalEntry() {
  if (!currentUser || !journalTitleInput || !journalContentInput) return;

  const title = journalTitleInput.value.trim() || "Untitled Entry";
  const content = journalContentInput.value.trim();

  if (!content) {
    alert("Please write something before saving.");
    return;
  }

  // Show loading state on button
  const saveBtn = document.querySelector(
    '#journalForm button[onclick="saveJournalEntry()"]'
  ); // More robust selector
  const originalBtnText = saveBtn ? saveBtn.innerHTML : "Save Entry";
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
  }

  try {
    await saveJournalAPI(title, content); // Add associatedMood, entryDate if UI exists
    alert("Journal entry saved successfully! ✍️");
    cancelJournalEntry(); // Clears form and hides it
    loadAndRenderJournalEntries(); // Refresh list
  } catch (error) {
    console.error("Error saving journal entry:", error);
    alert(`Error saving journal entry: ${error.message}. Please try again.`);
  } finally {
    if (saveBtn) {
      saveBtn.innerHTML = originalBtnText;
      saveBtn.disabled = false;
    }
  }
}

async function loadAndRenderJournalEntries() {
  if (!currentUser || !journalEntriesContainer) return;
  try {
    const entries = await getJournalEntriesAPI();
    journalEntriesContainer.innerHTML = ""; // Clear old entries
    if (entries.length === 0) {
      journalEntriesContainer.innerHTML =
        '<p class="text-center text-gray-500">No journal entries yet. Create one!</p>';
      return;
    }
    entries.forEach((entry) => {
      const entryDiv = document.createElement("div");
      // Using a unique border color based on mood or a default
      const borderColorClass = entry.associatedMood
        ? `border-${getMoodColor(entry.associatedMood)}-500`
        : "border-purple-500";
      entryDiv.className = `border-l-4 ${borderColorClass} pl-6 py-4 mb-6`; // Added mb-6 for spacing
      entryDiv.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h5 class="font-medium text-gray-900">${entry.title}</h5>
                    <span class="text-sm text-gray-500">${formatDate(
                      entry.entryDate
                    )}</span>
                </div>
                <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">${entry.content.substring(
                  0,
                  200
                )}${entry.content.length > 200 ? "..." : ""}</p>
                <div class="flex items-center gap-4 mt-3">
                    <button class="text-gray-500 hover:text-gray-700 text-sm edit-journal-btn" data-id="${
                      entry._id
                    }">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button class="text-red-500 hover:text-red-700 text-sm delete-journal-btn" data-id="${
                      entry._id
                    }">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                    <!-- Share button functionality not implemented -->
                </div>
            `;
      journalEntriesContainer.appendChild(entryDiv);
    });

    // Add event listeners for new edit/delete buttons
    document
      .querySelectorAll(".edit-journal-btn")
      .forEach((btn) => btn.addEventListener("click", handleEditJournal));
    document
      .querySelectorAll(".delete-journal-btn")
      .forEach((btn) => btn.addEventListener("click", handleDeleteJournal));
  } catch (error) {
    console.error("Failed to load journal entries:", error);
    journalEntriesContainer.innerHTML = `<p class="text-center text-red-500">Could not load journal entries: ${error.message}</p>`;
  }
}
// Helper to get a color for journal border, add more moods if needed
function getMoodColor(mood) {
  const colors = {
    happy: "green",
    sad: "blue",
    anxious: "yellow",
    calm: "indigo",
    stressed: "red",
  };
  return colors[mood.toLowerCase()] || "purple";
}

async function handleEditJournal(event) {
  const entryId = event.target.closest("button").dataset.id;
  try {
    const entry = await getJournalEntryByIdAPI(entryId);
    if (journalTitleInput) journalTitleInput.value = entry.title;
    if (journalContentInput) journalContentInput.value = entry.content;
    // Store ID for saving later, e.g., on the form element
    if (journalFormEl) journalFormEl.dataset.editingId = entryId;
    newJournalEntry(); // Show the form
    // Change "Save Entry" button text to "Update Entry"
    const saveBtn = document.querySelector(
      '#journalForm button[onclick="saveJournalEntry()"]'
    );
    if (saveBtn) saveBtn.textContent = "Update Entry";
  } catch (error) {
    alert(`Error fetching journal entry for editing: ${error.message}`);
  }
}
// Modify saveJournalEntry to handle updates
async function saveJournalEntry() {
  // Already defined, this is a conceptual modification point
  // ... (existing code to get title, content)
  const editingId = journalFormEl.dataset.editingId;

  // Show loading state on button
  const saveBtn = document.querySelector(
    '#journalForm button[onclick="saveJournalEntry()"]'
  );
  const originalBtnText = saveBtn
    ? saveBtn.innerHTML
    : editingId
    ? "Update Entry"
    : "Save Entry";
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
  }

  try {
    if (editingId) {
      await updateJournalEntryAPI(editingId, {
        title,
        content /*, associatedMood */,
      });
      alert("Journal entry updated successfully! ✍️");
      journalFormEl.removeAttribute("data-editing-id"); // Clear editing ID
      if (saveBtn) saveBtn.textContent = "Save Entry"; // Reset button text
    } else {
      await saveJournalAPI(title, content);
      alert("Journal entry saved successfully! ✍️");
    }
    cancelJournalEntry();
    loadAndRenderJournalEntries();
  } catch (error) {
    // ... (existing error handling)
  } finally {
    if (saveBtn) {
      saveBtn.innerHTML = originalBtnText; // Make sure to reset to correct original (Save or Update)
      if (journalFormEl.dataset.editingId)
        saveBtn.textContent = "Update Entry"; // Re-set if still editing
      else saveBtn.textContent = "Save Entry";
      saveBtn.disabled = false;
    }
  }
}

async function handleDeleteJournal(event) {
  const entryId = event.target.closest("button").dataset.id;
  if (confirm("Are you sure you want to delete this journal entry?")) {
    try {
      await deleteJournalEntryAPI(entryId);
      alert("Journal entry deleted.");
      loadAndRenderJournalEntries(); // Refresh list
    } catch (error) {
      alert(`Error deleting journal entry: ${error.message}`);
    }
  }
}

// --- Breathing Exercise (mostly unchanged, ensure modal elements are found) ---
function openBreathingExercise() {
  /* ... same, ensure 'breathingModal' exists ... */
}
// ... rest of breathing functions (startBreathing, stopBreathing, resetBreathingUI, closeBreathingExercise)

// --- Utility Functions ---
function formatDate(dateString, short = false) {
  /* ... same ... */
}

// --- Service Worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./sw.js")
      .then(function (registration) {
        // Path relative to origin
        console.log("SW registered: ", registration);
      })
      .catch(function (registrationError) {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

console.log("MindMate App Initialized with Auth & API Integration 🧠✨");

// Final check for elements (remove these console.logs in production)
// console.log({
//     authModalContainer, loginForm, registerForm, userProfileSection, loginPromptSection,
//     chatMessagesContainer, chatInput, journalEntriesContainer, moodChartCanvas, recentMoodEntriesContainer
// });
