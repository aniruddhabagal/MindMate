// js/main.js

// App State
let currentPage = "home";
// These arrays are initialized but not heavily used for dynamic UI rendering from memory in the current script.
// Data is mostly pulled from localStorage or added directly to DOM.
// let chatMessages = [];
// let moodData = [];
// let journalEntries = [];
let breathingInterval = null;

// Initialize App
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  loadMoodChart(); // Ensure Chart.js is loaded
});

function initializeApp() {
  showPage("home"); // Set initial page
  updateActiveNav("home");
  loadDummyData(); // Load dummy data from api.js
  // Potentially refresh UI elements that depend on localStorage data here
  // For example, re-render journal entries or mood history if not hardcoded
}

function setupEventListeners() {
  // Mobile menu toggle
  document
    .getElementById("mobileMenuBtn")
    .addEventListener("click", toggleMobileMenu);
  document
    .getElementById("mobileOverlay")
    .addEventListener("click", closeMobileMenu);

  // Chat input
  const chatInputElement = document.getElementById("chatInput");
  if (chatInputElement) {
    chatInputElement.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  // Mood selection
  document.querySelectorAll(".mood-card").forEach((card) => {
    card.addEventListener("click", function () {
      selectMood(this.dataset.mood, this);
    });
  });

  // Add more event listeners if they were implicitly part of the old script's flow
}

// Navigation Functions
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
  } else {
    console.error(`Page with id "${pageId}" not found.`);
    // Fallback to home if page not found
    document.getElementById("home").classList.add("active");
    pageId = "home";
  }

  const titles = {
    home: "Welcome Back!",
    chat: "Chat with MindMate",
    "mood-tracker": "Mood Tracker",
    journal: "Your Journal",
    resources: "Wellness Resources",
  };
  document.getElementById("pageTitle").textContent =
    titles[pageId] || "MindMate";

  updateActiveNav(pageId);
  closeMobileMenu();
  currentPage = pageId;
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
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("hidden");
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");
  if (sidebar && overlay) {
    sidebar.classList.remove("open");
    overlay.classList.add("hidden");
  }
}

// Chat Functions
async function sendMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;
  const message = input.value.trim();

  if (!message) return;

  addChatMessage(message, "user");
  input.value = "";
  showTypingIndicator();

  try {
    // callChatAPI is now in api.js and globally available if api.js is loaded first
    const response = await callChatAPI(message);
    hideTypingIndicator();
    addChatMessage(response.message, "bot");

    if (response.suggestMoodLog) {
      setTimeout(() => {
        addChatMessage(
          "Would you like to log your current mood? This helps me understand how you're feeling over time.",
          "bot"
        );
      }, 1000);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    hideTypingIndicator();
    addChatMessage(
      "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      "bot"
    );
  }
}

function quickResponse(message) {
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.value = message;
    sendMessage();
  }
}

function addChatMessage(message, sender) {
  const chatMessagesContainer = document.getElementById("chatMessages");
  if (!chatMessagesContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("flex", "gap-3", "mb-4"); // Added mb-4 for spacing consistency

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
  const typingIndicator = document.getElementById("typingIndicator");
  const chatMessagesContainer = document.getElementById("chatMessages");
  if (typingIndicator) typingIndicator.classList.remove("hidden");
  if (chatMessagesContainer)
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) typingIndicator.classList.add("hidden");
}

// Mood Functions
function selectMood(mood, element) {
  document.querySelectorAll(".mood-card").forEach((card) => {
    card.classList.remove("selected");
    card.classList.remove("border-purple-500", "ring-2", "ring-purple-300"); // Clear enhanced selection
    card.classList.add("border-gray-200");
  });

  element.classList.add("selected"); // Uses CSS for gradient background
  element.classList.remove("border-gray-200");
  element.classList.add("border-purple-500", "ring-2", "ring-purple-300"); // Enhanced visual feedback

  logMoodAPI(mood) // from api.js
    .then(() => {
      // Show confirmation subtly
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
    })
    .catch((error) => {
      console.error("Error logging mood:", error);
      alert("Could not log mood. Please try again.");
      setTimeout(() => {
        element.classList.remove(
          "selected",
          "border-purple-500",
          "ring-2",
          "ring-purple-300"
        );
        element.classList.add("border-gray-200");
      }, 500);
    });
}

// Journal Functions
function newJournalEntry() {
  const journalForm = document.getElementById("journalForm");
  const journalContent = document.getElementById("journalContent");
  if (journalForm) journalForm.classList.remove("hidden");
  if (journalContent) journalContent.focus();
}

function cancelJournalEntry() {
  const journalForm = document.getElementById("journalForm");
  const journalTitle = document.getElementById("journalTitle");
  const journalContent = document.getElementById("journalContent");

  if (journalForm) journalForm.classList.add("hidden");
  if (journalTitle) journalTitle.value = "";
  if (journalContent) journalContent.value = "";
}

function usePrompt(prompt) {
  newJournalEntry(); // Show form first
  const journalContent = document.getElementById("journalContent");
  if (journalContent) {
    journalContent.value = `${prompt}\n\n`;
    journalContent.focus();
  }
}

async function saveJournalEntry() {
  const titleInput = document.getElementById("journalTitle");
  const contentInput = document.getElementById("journalContent");
  if (!titleInput || !contentInput) return;

  const title = titleInput.value.trim() || "Untitled Entry";
  const content = contentInput.value.trim();

  if (!content) {
    alert("Please write something before saving.");
    return;
  }

  try {
    await saveJournalAPI(title, content); // from api.js
    alert("Journal entry saved successfully! ✍️");
    cancelJournalEntry();
    // Optionally, refresh the display of journal entries here
    // renderJournalEntries(); // You'd need to create this function
  } catch (error) {
    console.error("Error saving journal entry:", error);
    alert("Error saving journal entry. Please try again.");
  }
}

// Mood Chart
function loadMoodChart() {
  const ctx = document.getElementById("moodChart");
  if (!ctx || typeof Chart === "undefined") {
    // Check if Chart is defined
    console.warn("Mood chart canvas or Chart.js not found.");
    return;
  }

  try {
    const chartContext = ctx.getContext("2d");
    // Example: Fetch mood data from localStorage if you adapt logMoodAPI to store it
    const storedMoods = JSON.parse(localStorage.getItem("moodData") || "[]");

    // Prepare data for the chart (last 7 entries)
    const recentMoods = storedMoods.slice(-7);
    const labels = recentMoods.map((entry) =>
      formatDate(entry.timestamp, true)
    ); // Short format for labels
    const dataPoints = recentMoods.map((entry) => entry.score);

    const dummyData = {
      // Fallback if no stored data
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Mood Score",
          data: [7, 6, 8, 5, 7, 9, 8],
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

    const chartData =
      recentMoods.length > 0
        ? {
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
          }
        : dummyData;

    new Chart(chartContext, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            grid: { color: "#f1f5f9" },
            ticks: { color: "#64748b" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#64748b" },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error loading mood chart:", error);
  }
}

// Breathing Exercise
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
  // const instruction = document.getElementById('breathingInstruction'); // Not used in logic
  const startBtn = document.getElementById("breathingStartBtn");

  if (!circle || !text || !startBtn) return;

  startBtn.textContent = "Stop";
  startBtn.onclick = stopBreathing;

  let phase = 0; // 0: breathe in, 1: hold, 2: breathe out, 3: hold
  let count = 0;

  const phases = [
    { text: "Breathe In", duration: 4, scaleClass: "scale-125" },
    { text: "Hold", duration: 4, scaleClass: "scale-125" },
    { text: "Breathe Out", duration: 6, scaleClass: "scale-75" },
    { text: "Hold", duration: 2, scaleClass: "scale-75" },
  ];

  // Apply initial class
  circle.className = `w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center transition-transform duration-1000 ease-in-out`;

  function animatePhase() {
    const currentPhase = phases[phase];
    text.textContent = currentPhase.text;

    // Reset classes then apply current phase's scale
    circle.classList.remove("scale-75", "scale-125");
    void circle.offsetWidth; // Trigger reflow to restart animation
    circle.classList.add(currentPhase.scaleClass);

    count++;
    if (count >= currentPhase.duration) {
      phase = (phase + 1) % phases.length;
      count = 0;
    }
  }
  animatePhase(); // Call once to start immediately
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
  if (circle) {
    circle.className =
      "w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center"; // Reset transform
  }
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

// Additional utility functions
function formatDate(dateString, short = false) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(
    now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)
  ); // Compare dates only
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (short) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Initialize service worker for offline functionality (optional)
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

// Add some enhanced interactivity (example, already somewhat covered)
document.addEventListener("DOMContentLoaded", function () {
  // Add smooth scrolling for internal links if any (not present in this HTML)
  // document.documentElement.style.scrollBehavior = 'smooth';

  // General loading state for buttons (can be enhanced)
  const buttons = document.querySelectorAll("button:not(#mobileMenuBtn)"); // Exclude menu btn for different behavior
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      if (this.classList.contains("loading-state")) return; // Prevent re-click

      // Only apply loading to specific buttons if needed, e.g., form submit buttons
      if (
        this.id === "sendBtn" ||
        this.textContent.toLowerCase().includes("save")
      ) {
        const originalText = this.innerHTML;
        this.classList.add("loading-state");
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        // Simulate action and revert (in real app, this is tied to async op)
        setTimeout(() => {
          this.classList.remove("loading-state");
          this.innerHTML = originalText;
          this.disabled = false;
        }, 1200); // Adjust timeout or remove if handled by async completion
      }
    });
  });

  // Focus states for accessibility
  const focusableElements = document.querySelectorAll(
    'button, input, textarea, [tabindex]:not([tabindex="-1"]), a[href]'
  );
  focusableElements.forEach((element) => {
    element.addEventListener("focus", function () {
      // Using Tailwind's focus utility classes is often better, but this is a JS way
      // Example: this.classList.add('ring-2', 'ring-offset-2', 'ring-purple-500');
      this.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.4)";
    });

    element.addEventListener("blur", function () {
      // this.classList.remove('ring-2', 'ring-offset-2', 'ring-purple-500');
      this.style.boxShadow = "";
    });
  });
});

// Add keyboard shortcuts
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
    // Potentially close other modals/popups here
    if (
      document.getElementById("journalForm") &&
      !document.getElementById("journalForm").classList.contains("hidden")
    ) {
      cancelJournalEntry();
    }
  }
});

console.log("MindMate App Initialized 🧠✨");
