// js/main.js

// --- App State ---
let currentPage = "home";
let currentUser = null; // Store logged-in user details
let chatHistory = []; // To store chat messages for context with Gemini
let breathingInterval = null;
let moodChartInstance = null; // To hold the chart instance for updates/destruction

// --- DOM Elements (cache frequently used ones) ---
let pageTitle,
  mobileMenuBtn,
  mobileOverlay,
  sidebar,
  authModalContainer,
  loginFormContainer,
  registerFormContainer,
  loginForm,
  registerForm,
  showRegisterBtn,
  showLoginBtn,
  authErrorEl,
  closeAuthModalBtnLogin,
  closeAuthModalBtnRegister,
  userProfileSection,
  usernameDisplay,
  logoutBtn,
  loginPromptSection,
  openLoginModalBtn,
  chatMessagesContainer,
  chatInput,
  sendBtn,
  typingIndicator,
  journalFormEl,
  journalTitleInput,
  journalContentInput,
  journalEntriesContainer,
  quickMoodGrid,
  moodChartCanvas,
  recentMoodEntriesListEl,
  moodStatStreakEl,
  moodStatThisWeekEl,
  moodStatTotalEntriesEl,
  moodStatAvgMoodEl,
  moodChartPeriodSelectEl,
  welcomeHeader;

function cacheDOMElements() {
  pageTitle = document.getElementById("pageTitle");
  mobileMenuBtn = document.getElementById("mobileMenuBtn");
  mobileOverlay = document.getElementById("mobileOverlay");
  sidebar = document.getElementById("sidebar");
  authModalContainer = document.getElementById("authModalContainer");
  loginFormContainer = document.getElementById("loginFormContainer");
  registerFormContainer = document.getElementById("registerFormContainer");
  loginForm = document.getElementById("loginForm");
  registerForm = document.getElementById("registerForm");
  showRegisterBtn = document.getElementById("showRegisterBtn");
  showLoginBtn = document.getElementById("showLoginBtn");
  authErrorEl = document.getElementById("authError");
  closeAuthModalBtnLogin = document.getElementById("closeAuthModalBtnLogin");
  closeAuthModalBtnRegister = document.getElementById(
    "closeAuthModalBtnRegister"
  );
  userProfileSection = document.getElementById("userProfile");
  usernameDisplay = document.getElementById("usernameDisplay");
  logoutBtn = document.getElementById("logoutBtn");
  loginPromptSection = document.getElementById("loginPrompt");
  openLoginModalBtn = document.getElementById("openLoginModalBtn");
  chatMessagesContainer = document.getElementById("chatMessages");
  chatInput = document.getElementById("chatInput");
  sendBtn = document.getElementById("sendBtn");
  typingIndicator = document.getElementById("typingIndicator");
  journalFormEl = document.getElementById("journalForm");
  journalTitleInput = document.getElementById("journalTitle");
  journalContentInput = document.getElementById("journalContent");
  journalEntriesContainer = document.getElementById("journalEntries");
  quickMoodGrid = document.getElementById("quickMoodGrid");
  moodChartCanvas = document.getElementById("moodChart");
  recentMoodEntriesListEl = document.getElementById("recentMoodEntriesList");
  moodStatStreakEl = document.getElementById("moodStatStreak");
  moodStatThisWeekEl = document.getElementById("moodStatThisWeek");
  moodStatTotalEntriesEl = document.getElementById("moodStatTotalEntries");
  moodStatAvgMoodEl = document.getElementById("moodStatAvgMood");
  moodChartPeriodSelectEl = document.getElementById("moodChartPeriodSelect");
  welcomeHeader = document.querySelector("#home .text-3xl.font-bold");
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", function () {
  cacheDOMElements(); // Cache elements once DOM is loaded
  initializeApp();
});

async function initializeApp() {
  setupEventListeners();
  await checkAuthStatusAndInitializeUI();
}

async function checkAuthStatusAndInitializeUI() {
  currentUser = getLoggedInUser(); // From api.js (gets from localStorage)

  if (currentUser && getToken()) {
    try {
      const userFromServer = await getCurrentUserAPI(); // Verifies token with backend
      if (userFromServer) {
        currentUser = userFromServer;
        localStorage.setItem("mindmateUser", JSON.stringify(currentUser));
        updateUIAfterLogin();
        showPage("home");
        loadUserSpecificData();
      } else {
        handleLogout(); // Token might be invalid or user not found by server
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      handleLogout(); // API call failed (e.g. network, or 401 if token invalid)
    }
  } else {
    updateUIAfterLogout();
    showPage("home");
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

  if (quickMoodGrid) {
    quickMoodGrid.style.opacity = "1";
    quickMoodGrid.style.pointerEvents = "auto";
  }
  const journalPageLink = document.querySelector(
    "button[onclick=\"showPage('journal')\"]"
  );
  if (journalPageLink) {
    journalPageLink.style.opacity = "1";
    journalPageLink.style.pointerEvents = "auto";
  }

  // Ensure main app area is visible
  const mainContentArea = document.querySelector(".md\\:ml-64");
  if (mainContentArea)
    mainContentArea.classList.remove("blur-sm", "pointer-events-none");
}

function updateUIAfterLogout() {
  if (userProfileSection) userProfileSection.classList.add("hidden");
  if (usernameDisplay) usernameDisplay.textContent = "";
  if (loginPromptSection) loginPromptSection.classList.remove("hidden");
  if (welcomeHeader) welcomeHeader.textContent = `Hello, Guest! 👋`;

  if (chatMessagesContainer)
    chatMessagesContainer.innerHTML =
      '<p class="text-center text-gray-500 py-8">Login to start chatting.</p>';
  if (moodChartInstance) {
    moodChartInstance.destroy();
    moodChartInstance = null;
  }
  if (recentMoodEntriesListEl)
    recentMoodEntriesListEl.innerHTML =
      '<p class="text-center text-gray-500 py-4">Login to see your mood history.</p>';
  if (journalEntriesContainer)
    journalEntriesContainer.innerHTML =
      '<p class="text-center text-gray-500 py-4">Login to see your journal entries.</p>';
  if (moodStatStreakEl) moodStatStreakEl.textContent = "0 days";
  if (moodStatThisWeekEl) moodStatThisWeekEl.textContent = "N/A";
  if (moodStatTotalEntriesEl) moodStatTotalEntriesEl.textContent = "0";
  if (moodStatAvgMoodEl) moodStatAvgMoodEl.textContent = "0/10";

  chatHistory = [];

  if (quickMoodGrid) {
    quickMoodGrid.style.opacity = "0.5";
    quickMoodGrid.style.pointerEvents = "none";
  }
  const journalPageLink = document.querySelector(
    "button[onclick=\"showPage('journal')\"]"
  );
  if (journalPageLink) {
    journalPageLink.style.opacity = "0.5";
    journalPageLink.style.pointerEvents = "none";
  }

  // Blur main content if auth modal is to be shown, or simply ensure it's not blurred if not.
  // This might be better handled when openAuthModal is called.
}

function loadUserSpecificData() {
  if (!currentUser) return;
  loadAndRenderMoodTrackerData();
  loadAndRenderJournalEntries();
  chatHistory = [];
  if (document.getElementById("chat")?.classList.contains("active")) {
    const initialBotMessage =
      "Hello! I'm MindMate. How are you feeling today? 😊";
    addChatMessage(initialBotMessage, "bot");
    chatHistory.push({ sender: "bot", text: initialBotMessage });
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
      if (e.target === authModalContainer) closeAuthModal();
    });
  }

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  const newJournalEntryBtnHTML = document.querySelector(
    'button[onclick="newJournalEntry()"]'
  );
  if (newJournalEntryBtnHTML)
    newJournalEntryBtnHTML.onclick = (e) => {
      e.preventDefault();
      if (!currentUser) {
        openAuthModal("login", "Please login to create a journal entry.");
        return;
      }
      newJournalEntry();
    };

  // Use ID for save journal button
  const actualSaveJournalBtn = document.getElementById("actualSaveJournalBtn");
  if (actualSaveJournalBtn) {
    actualSaveJournalBtn.addEventListener("click", (e) => {
      e.preventDefault();
      saveJournalEntry();
    });
  }

  const cancelJournalBtnHTML = document.querySelector(
    '#journalForm button[onclick="cancelJournalEntry()"]'
  );
  if (cancelJournalBtnHTML)
    cancelJournalBtnHTML.onclick = (e) => {
      e.preventDefault();
      cancelJournalEntry();
    };

  document
    .querySelectorAll('#journalPrompts div[onclick^="usePrompt"]')
    .forEach((promptDiv) => {
      const originalOnclick = promptDiv.getAttribute("onclick");
      if (!originalOnclick) return;
      const match = originalOnclick.match(/usePrompt\('(.*)'\)/);
      if (!match || !match[1]) return;
      const promptText = match[1];
      promptDiv.onclick = (e) => {
        e.preventDefault();
        if (!currentUser) {
          openAuthModal("login", "Please login to use journal prompts.");
          return;
        }
        usePrompt(promptText);
      };
    });

  document.querySelectorAll(".quick-action-card").forEach((card) => {
    card.addEventListener("click", function () {
      const action = this.dataset.action; // Add data-action="chat", data-action="journal", data-action="breathing" to HTML
      if (!currentUser && (action === "chat" || action === "journal")) {
        openAuthModal(
          "login",
          `Please login to ${
            action === "chat" ? "start chatting" : "create a journal entry"
          }.`
        );
        return;
      }
      if (action === "chat") showPage("chat");
      else if (action === "journal") showPage("journal");
      else if (action === "breathing") openBreathingExercise(); // Assuming this doesn't need auth
    });
  });

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

  if (moodChartPeriodSelectEl) {
    moodChartPeriodSelectEl.addEventListener("change", (event) => {
      if (currentUser) {
        const selectedDays = parseInt(event.target.value);
        loadAndRenderMoodChart(selectedDays);
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "5") {
      e.preventDefault();
      const pages = ["home", "chat", "mood-tracker", "journal", "resources"];
      const pageIndex = parseInt(e.key) - 1;
      if (pages[pageIndex]) {
        showPage(pages[pageIndex]);
      }
    }
    if (e.key === "Escape") {
      closeBreathingExercise();
      closeMobileMenu();
      if (
        authModalContainer &&
        !authModalContainer.classList.contains("hidden")
      ) {
        closeAuthModal();
      }
      if (journalFormEl && !journalFormEl.classList.contains("hidden")) {
        cancelJournalEntry();
      }
    }
  });
}

// --- Auth Modal Functions ---
function openAuthModal(type = "login", message = "") {
  if (!authModalContainer) return;
  const mainContentArea = document.querySelector(".md\\:ml-64"); // Main content area selector

  authModalContainer.classList.remove("hidden");
  if (mainContentArea)
    mainContentArea.classList.add("blur-sm", "pointer-events-none"); // Blur background

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
  if (!authModalContainer) return;
  const mainContentArea = document.querySelector(".md\\:ml-64");

  authModalContainer.classList.add("hidden");
  if (mainContentArea)
    mainContentArea.classList.remove("blur-sm", "pointer-events-none"); // Unblur background

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
  const loginButton = loginForm.querySelector('button[type="submit"]');
  const originalButtonText = loginButton.innerHTML;
  loginButton.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  loginButton.disabled = true;

  try {
    const data = await loginAPI(username, password);
    currentUser = { _id: data._id, username: data.username };
    updateUIAfterLogin();
    closeAuthModal();
    showPage("home");
    loadUserSpecificData();
  } catch (error) {
    authErrorEl.textContent =
      error.message || "Login failed. Please try again.";
    authErrorEl.classList.remove("hidden");
    console.error("Login failed:", error);
  } finally {
    loginButton.innerHTML = originalButtonText;
    loginButton.disabled = false;
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
    /* ... */ return;
  }
  if (password !== confirmPassword) {
    /* ... */ return;
  }
  if (password.length < 6) {
    /* ... */ return;
  }

  const registerButton = registerForm.querySelector('button[type="submit"]');
  const originalButtonText = registerButton.innerHTML;
  registerButton.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Registering...';
  registerButton.disabled = true;

  try {
    const data = await registerAPI(username, password);
    currentUser = { _id: data._id, username: data.username };
    localStorage.setItem("mindmateToken", data.token);
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
  } finally {
    registerButton.innerHTML = originalButtonText;
    registerButton.disabled = false;
  }
}

async function handleLogout() {
  await logoutAPI();
  currentUser = null;
  updateUIAfterLogout();
  showPage("home");
}

// --- Navigation Functions ---
function showPage(pageId) {
  const protectedPages = ["chat", "mood-tracker", "journal"];
  if (protectedPages.includes(pageId) && !currentUser) {
    openAuthModal(
      "login",
      `Please login to access the ${pageId.replace("-", " ")} page.`
    );
    if (protectedPages.includes(currentPage)) {
      document.getElementById(currentPage)?.classList.remove("active");
      document.getElementById("home").classList.add("active");
      pageId = "home"; // for title and nav update
      currentPage = "home"; // update internal state
    } else {
      return; // Stay on current page, modal is shown
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
    document.getElementById("home")?.classList.add("active");
    pageId = "home";
  }

  const titles = {
    home: currentUser
      ? `Welcome, ${currentUser.username}!`
      : "Welcome to MindMate!",
    chat: "Chat with MindMate",
    "mood-tracker": "Mood Tracker",
    journal: "Your Journal",
    resources: "Wellness Resources",
  };
  if (pageTitle) pageTitle.textContent = titles[pageId] || "MindMate";

  updateActiveNav(pageId);
  closeMobileMenu();
  const oldCurrentPage = currentPage;
  currentPage = pageId;

  if (
    pageId === "chat" &&
    currentUser &&
    (chatHistory.length === 0 || oldCurrentPage !== "chat")
  ) {
    if (chatMessagesContainer) chatMessagesContainer.innerHTML = "";
    const initialBotMessage =
      "Hello! I'm MindMate. How are you feeling today? 😊";
    addChatMessage(initialBotMessage, "bot");
    if (
      chatHistory.length === 0 ||
      chatHistory[chatHistory.length - 1]?.text !== initialBotMessage
    ) {
      // Avoid duplicate initial message in history
      chatHistory.push({ sender: "bot", text: initialBotMessage });
    }
  }
  if (pageId === "mood-tracker" && currentUser) {
    loadAndRenderMoodTrackerData();
  }
  if (pageId === "journal" && currentUser) {
    loadAndRenderJournalEntries();
  }
}

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
  if (sidebar) sidebar.classList.toggle("open");
  if (mobileOverlay) mobileOverlay.classList.toggle("hidden");
}

function closeMobileMenu() {
  if (sidebar) sidebar.classList.remove("open");
  if (mobileOverlay) mobileOverlay.classList.add("hidden");
}

// --- Chat Functions ---
async function sendMessage() {
  if (!currentUser) {
    openAuthModal("login", "Please login to chat.");
    return;
  }
  if (!chatInput) return;
  const messageText = chatInput.value.trim();
  if (!messageText) return;

  addChatMessage(messageText, "user");
  chatHistory.push({ sender: "user", text: messageText });
  chatInput.value = "";
  showTypingIndicator();

  try {
    const response = await callChatAPI(messageText, chatHistory.slice(-10));
    hideTypingIndicator();
    addChatMessage(response.reply, "bot");
    chatHistory.push({ sender: "bot", text: response.reply });
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
  if (!chatMessagesContainer) return;
  const placeholder = chatMessagesContainer.querySelector(
    "p.text-center.text-gray-500"
  );
  if (placeholder) placeholder.remove();

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
            </div>`;
  } else {
    messageDiv.innerHTML = `
            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-xs"></i>
            </div>
            <div class="chat-bubble-bot p-3 px-4 max-w-md">
                <p class="text-gray-800 text-sm">${message}</p>
            </div>`;
  }
  chatMessagesContainer.appendChild(messageDiv);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function showTypingIndicator() {
  if (typingIndicator) typingIndicator.classList.remove("hidden");
  if (chatMessagesContainer)
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}
function hideTypingIndicator() {
  if (typingIndicator) typingIndicator.classList.add("hidden");
}

// --- Mood Functions ---
async function selectMood(mood, score, element) {
  if (!currentUser) {
    openAuthModal("login", "Please login to log your mood.");
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
    await logMoodAPI(mood, score);
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
      alert("Mood logged!");
    }
    loadAndRenderMoodTrackerData();
  } catch (error) {
    console.error("Error logging mood:", error);
    alert(`Could not log mood: ${error.message}. Please try again.`);
    if (element) {
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

async function loadAndRenderMoodTrackerData() {
  if (!moodStatStreakEl) {
    console.warn("Mood tracker stat elements not found");
    return;
  } // Guard clause

  if (!currentUser) {
    moodStatStreakEl.textContent = "0 days";
    if (moodStatThisWeekEl) moodStatThisWeekEl.textContent = "N/A";
    if (moodStatTotalEntriesEl) moodStatTotalEntriesEl.textContent = "0";
    if (moodStatAvgMoodEl) moodStatAvgMoodEl.textContent = "0/10";
    if (recentMoodEntriesListEl)
      recentMoodEntriesListEl.innerHTML =
        '<p class="text-center text-gray-500 py-4">Login to see your mood history.</p>';
    loadAndRenderMoodChart();
    return;
  }

  try {
    const allMoodEntries = await getMoodEntriesAPI();
    if (!allMoodEntries || allMoodEntries.length === 0) {
      moodStatStreakEl.textContent = "0 days";
      if (moodStatThisWeekEl) moodStatThisWeekEl.textContent = "N/A";
      if (moodStatTotalEntriesEl) moodStatTotalEntriesEl.textContent = "0";
      if (moodStatAvgMoodEl) moodStatAvgMoodEl.textContent = "0/10";
      if (recentMoodEntriesListEl)
        recentMoodEntriesListEl.innerHTML =
          '<p class="text-center text-gray-500 py-4">No mood entries yet. Log your mood!</p>';
      loadAndRenderMoodChart();
      return;
    }

    const totalEntries = allMoodEntries.length;
    if (moodStatTotalEntriesEl)
      moodStatTotalEntriesEl.textContent = totalEntries;

    const sumOfScores = allMoodEntries.reduce(
      (sum, entry) => sum + entry.score,
      0
    );
    const avgMood =
      totalEntries > 0 ? (sumOfScores / totalEntries).toFixed(1) : 0;
    if (moodStatAvgMoodEl) moodStatAvgMoodEl.textContent = `${avgMood}/10`;

    const sortedEntries = [...allMoodEntries].sort(
      (a, b) => new Date(b.entryDate) - new Date(a.entryDate)
    );
    let currentStreak = 0;
    if (sortedEntries.length > 0) {
      let todayForStreak = new Date();
      todayForStreak.setHours(0, 0, 0, 0);
      let expectedDate = new Date(todayForStreak);
      const firstEntryDate = new Date(sortedEntries[0].entryDate);
      firstEntryDate.setHours(0, 0, 0, 0);

      if (
        firstEntryDate.getTime() === todayForStreak.getTime() ||
        firstEntryDate.getTime() ===
          new Date(new Date().setDate(new Date().getDate() - 1)).setHours(
            0,
            0,
            0,
            0
          )
      ) {
        currentStreak = 1;
        expectedDate = new Date(firstEntryDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDate = new Date(sortedEntries[i].entryDate);
          entryDate.setHours(0, 0, 0, 0);
          if (entryDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else if (entryDate.getTime() < expectedDate.getTime()) {
            break;
          }
        }
      }
    }
    if (moodStatStreakEl)
      moodStatStreakEl.textContent = `${currentStreak} days`;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    const thisWeekEntries = allMoodEntries.filter(
      (entry) => new Date(entry.entryDate) >= oneWeekAgo
    );
    let dominantMoodThisWeek = "N/A";
    if (thisWeekEntries.length > 0) {
      const moodCounts = thisWeekEntries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {});
      dominantMoodThisWeek = Object.keys(moodCounts).reduce((a, b) =>
        moodCounts[a] > moodCounts[b] ? a : b
      );
      dominantMoodThisWeek =
        dominantMoodThisWeek.charAt(0).toUpperCase() +
        dominantMoodThisWeek.slice(1);
    }
    if (moodStatThisWeekEl)
      moodStatThisWeekEl.textContent = dominantMoodThisWeek;

    if (recentMoodEntriesListEl) {
      recentMoodEntriesListEl.innerHTML = "";
      const entriesToDisplay = sortedEntries.slice(0, 3);
      if (entriesToDisplay.length === 0) {
        recentMoodEntriesListEl.innerHTML =
          '<p class="text-center text-gray-500 py-4">No recent entries to display.</p>';
      } else {
        entriesToDisplay.forEach((entry) => {
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
                            <div><p class="font-medium text-gray-900 capitalize">${
                              entry.mood
                            }</p><p class="text-sm text-gray-600">${formatDate(
            entry.entryDate
          )}</p></div>
                        </div>
                        <div class="text-right"><p class="text-lg font-semibold text-gray-900">${
                          entry.score
                        }/10</p>${
            entry.notes
              ? `<p class="text-xs text-gray-500 truncate w-24" title="${entry.notes}">${entry.notes}</p>`
              : ""
          }</div>`;
          recentMoodEntriesListEl.appendChild(entryDiv);
        });
      }
    }
    const selectedDays = moodChartPeriodSelectEl
      ? parseInt(moodChartPeriodSelectEl.value)
      : 7;
    loadAndRenderMoodChart(selectedDays);
  } catch (error) {
    console.error("Failed to load mood tracker data:", error);
    if (moodStatStreakEl) moodStatStreakEl.textContent = "Error";
    if (recentMoodEntriesListEl)
      recentMoodEntriesListEl.innerHTML = `<p class="text-center text-red-500 py-4">Could not load data: ${error.message}</p>`;
  }
}

// --- Mood Chart ---
async function loadAndRenderMoodChart(days = 7) {
  if (!moodChartCanvas || typeof Chart === "undefined") return;
  if (moodChartInstance) {
    moodChartInstance.destroy();
    moodChartInstance = null;
  }
  if (!currentUser) return;

  try {
    const chartDataFromAPI = await getMoodChartDataAPI(days);
    const labels = chartDataFromAPI.map((entry) =>
      formatDate(entry.entryDate, true)
    );
    const dataPoints = chartDataFromAPI.map((entry) => entry.score);
    let chartDataConfig;

    if (chartDataFromAPI.length > 0) {
      chartDataConfig = {
        labels: labels,
        datasets: [
          {
            label: "Mood Score",
            data: dataPoints,
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
    } else {
      chartDataConfig = {
        labels: ["No Data"],
        datasets: [
          {
            label: "Mood Score",
            data: [],
            borderColor: "#cccccc",
            backgroundColor: "rgba(204, 204, 204, 0.1)",
          },
        ],
      };
    }
    moodChartInstance = new Chart(moodChartCanvas.getContext("2d"), {
      type: "line",
      data: chartDataConfig,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: chartDataFromAPI.length > 0 },
        },
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
  }
}

// --- Journal Functions ---
function newJournalEntry() {
  if (!journalFormEl) return;
  journalFormEl.classList.remove("hidden");
  if (journalTitleInput) journalTitleInput.value = ""; // Clear previous editing content
  if (journalContentInput) journalContentInput.value = "";
  journalFormEl.removeAttribute("data-editing-id"); // Ensure not in edit mode
  const saveBtn = document.getElementById("actualSaveJournalBtn");
  if (saveBtn) saveBtn.textContent = "Save Entry"; // Reset button text
  if (journalContentInput) journalContentInput.focus();
}

function cancelJournalEntry() {
  if (!journalFormEl) return;
  journalFormEl.classList.add("hidden");
  if (journalTitleInput) journalTitleInput.value = "";
  if (journalContentInput) journalContentInput.value = "";
  journalFormEl.removeAttribute("data-editing-id");
  const saveBtn = document.getElementById("actualSaveJournalBtn");
  if (saveBtn) saveBtn.textContent = "Save Entry";
}

function usePrompt(prompt) {
  newJournalEntry();
  if (journalContentInput) {
    journalContentInput.value = `${prompt}\n\n`;
    journalContentInput.focus();
  }
}

async function saveJournalEntry() {
  if (
    !currentUser ||
    !journalFormEl ||
    !journalTitleInput ||
    !journalContentInput
  )
    return;

  const title = journalTitleInput.value.trim();
  const content = journalContentInput.value.trim();
  const editingId = journalFormEl.dataset.editingId;

  if (!content) {
    alert("Please write something before saving.");
    return;
  }

  const saveBtn = document.getElementById("actualSaveJournalBtn");
  const originalBtnText = editingId ? "Update Entry" : "Save Entry";
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
  }

  try {
    if (editingId) {
      await updateJournalEntryAPI(editingId, {
        title: title || "Untitled Entry",
        content,
      });
      alert("Journal entry updated successfully! ✍️");
    } else {
      await saveJournalAPI(
        title || "Untitled Entry",
        content,
        new Date().toISOString(),
        ""
      );
      alert("Journal entry saved successfully! ✍️");
    }
    cancelJournalEntry();
    loadAndRenderJournalEntries();
  } catch (error) {
    console.error("Error saving/updating journal entry:", error);
    alert(
      `Error: ${
        error.data?.message || error.message || "Could not save journal entry."
      }`
    );
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
    journalEntriesContainer.innerHTML = "";
    if (entries.length === 0) {
      journalEntriesContainer.innerHTML =
        '<p class="text-center text-gray-500 py-4">No journal entries yet. Create one!</p>';
      return;
    }
    entries.forEach((entry) => {
      const borderColorClass = entry.associatedMood
        ? `border-${getMoodColor(entry.associatedMood)}-500`
        : "border-purple-500";
      const entryDiv = document.createElement("div");
      entryDiv.className = `border-l-4 ${borderColorClass} pl-6 py-4 mb-6`;
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
                    }"><i class="fas fa-edit mr-1"></i>Edit</button>
                    <button class="text-red-500 hover:text-red-700 text-sm delete-journal-btn" data-id="${
                      entry._id
                    }"><i class="fas fa-trash mr-1"></i>Delete</button>
                </div>`;
      journalEntriesContainer.appendChild(entryDiv);
    });
    document
      .querySelectorAll(".edit-journal-btn")
      .forEach((btn) => btn.addEventListener("click", handleEditJournalClick));
    document
      .querySelectorAll(".delete-journal-btn")
      .forEach((btn) =>
        btn.addEventListener("click", handleDeleteJournalClick)
      );
  } catch (error) {
    console.error("Failed to load journal entries:", error);
    if (journalEntriesContainer)
      journalEntriesContainer.innerHTML = `<p class="text-center text-red-500 py-4">Could not load entries: ${error.message}</p>`;
  }
}
function getMoodColor(mood) {
  const colors = {
    happy: "green",
    sad: "blue",
    anxious: "yellow",
    calm: "indigo",
    stressed: "red",
  };
  return colors[mood?.toLowerCase()] || "purple";
}

async function handleEditJournalClick(event) {
  const entryId = event.target.closest("button").dataset.id;
  try {
    const entry = await getJournalEntryByIdAPI(entryId);
    if (journalTitleInput) journalTitleInput.value = entry.title;
    if (journalContentInput) journalContentInput.value = entry.content;
    if (journalFormEl) journalFormEl.dataset.editingId = entryId;
    const saveBtn = document.getElementById("actualSaveJournalBtn");
    if (saveBtn) saveBtn.textContent = "Update Entry";
    if (!journalFormEl.classList.contains("hidden")) {
      // if form is already open, focus
      if (journalContentInput) journalContentInput.focus();
    } else {
      newJournalEntry(); // Show the form (this will also focus)
    }
    // Scroll to form if it's far down
    journalFormEl.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    alert(`Error fetching journal entry for editing: ${error.message}`);
  }
}

async function handleDeleteJournalClick(event) {
  const entryId = event.target.closest("button").dataset.id;
  if (confirm("Are you sure you want to delete this journal entry?")) {
    try {
      await deleteJournalEntryAPI(entryId);
      alert("Journal entry deleted.");
      loadAndRenderJournalEntries();
    } catch (error) {
      alert(`Error deleting journal entry: ${error.message}`);
    }
  }
}

// --- Breathing Exercise ---
function openBreathingExercise() {
  const modal = document.getElementById("breathingModal");
  if (modal) modal.classList.remove("hidden");
}
function closeBreathingExercise() {
  const modal = document.getElementById("breathingModal");
  if (modal) modal.classList.add("hidden");
  if (breathingInterval) {
    clearInterval(breathingInterval);
    breathingInterval = null;
  }
  resetBreathingUI();
}
function startBreathing() {
  const circle = document.getElementById("breathingCircle");
  const text = document.getElementById("breathingText");
  const startBtn = document.getElementById("breathingStartBtn");
  if (!circle || !text || !startBtn) return;

  startBtn.textContent = "Stop";
  startBtn.onclick = stopBreathing;
  let phase = 0,
    count = 0;
  const phases = [
    { text: "Breathe In", duration: 4, scaleClass: "scale-125" },
    { text: "Hold", duration: 4, scaleClass: "scale-125" },
    { text: "Breathe Out", duration: 6, scaleClass: "scale-75" },
    { text: "Hold", duration: 2, scaleClass: "scale-75" },
  ];
  circle.className = `w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center transition-transform duration-1000 ease-in-out`;
  function animatePhase() {
    const currentPhase = phases[phase];
    text.textContent = currentPhase.text;
    circle.classList.remove("scale-75", "scale-125");
    void circle.offsetWidth;
    circle.classList.add(currentPhase.scaleClass);
    count++;
    if (count >= currentPhase.duration) {
      phase = (phase + 1) % phases.length;
      count = 0;
    }
  }
  animatePhase();
  breathingInterval = setInterval(animatePhase, 1000);
}
function stopBreathing() {
  if (breathingInterval) {
    clearInterval(breathingInterval);
    breathingInterval = null;
  }
  resetBreathingUI();
}
function resetBreathingUI() {
  const text = document.getElementById("breathingText");
  const circle = document.getElementById("breathingCircle");
  const startBtn = document.getElementById("breathingStartBtn");
  if (text) text.textContent = "Breathe In";
  if (circle)
    circle.className =
      "w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center";
  if (startBtn) {
    startBtn.textContent = "Start";
    startBtn.onclick = startBreathing;
  }
}

// Resource Functions (Placeholders)
function openMeditationGuide() {
  alert("Meditation guide coming soon! 🧘‍♀️");
}
function openGratitudePractice() {
  alert("Gratitude practice coming soon! 🙏");
}
function openProgressiveRelaxation() {
  alert("Progressive relaxation guide coming soon! 😌");
}
function openGroundingTechniques() {
  alert("Grounding techniques coming soon! ⚓");
}
function openSelfCareIdeas() {
  alert("Self-care ideas coming soon! ✨");
}

// --- Utility Functions ---
function formatDate(dateString, short = false) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (short) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

// --- Service Worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("SW registered: ", reg))
      .catch((err) => console.log("SW registration failed: ", err));
  });
}

console.log("MindMate App Initialized 🧠✨");
