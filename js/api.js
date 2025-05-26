// js/api.js

// API Base URL (dummy endpoints)
const API_BASE = "https://api.mindmate.com"; // Replace with actual API

async function callChatAPI(message) {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay
  const responses = {
    stress: {
      message:
        "I hear that you're feeling stressed. That's completely understandable - stress is a natural response to challenging situations. Would you like to try a quick breathing exercise, or would you prefer to talk about what's causing the stress?",
      suggestMoodLog: true,
    },
    anxious: {
      message:
        "Anxiety can feel overwhelming, but you're not alone in this. It's brave of you to reach out. Let's take this one step at a time. What's one small thing that might help you feel a bit more grounded right now?",
      suggestMoodLog: true,
    },
    sad: {
      message:
        "I'm sorry you're feeling sad. Your feelings are valid, and it's okay to not be okay sometimes. Would you like to share what's on your mind, or would you prefer some gentle suggestions for self-care?",
      suggestMoodLog: true,
    },
    happy: {
      message:
        "It's wonderful to hear that you're feeling happy! What's contributing to this positive feeling today? Celebrating the good moments is just as important as working through the difficult ones.",
      suggestMoodLog: false,
    },
    default: {
      message:
        "Thank you for sharing that with me. I'm here to listen and support you. How can I help you today? We could chat more about how you're feeling, try some relaxation techniques, or explore your thoughts through journaling.",
      suggestMoodLog: false,
    },
  };

  const lowerMessage = message.toLowerCase();
  let response = responses.default;

  for (const [keyword, resp] of Object.entries(responses)) {
    if (keyword !== "default" && lowerMessage.includes(keyword)) {
      response = resp;
      break;
    }
  }

  return response;
}

async function logMoodAPI(mood) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Store mood locally (in real app, this would go to backend)
  const moodEntry = {
    mood: mood,
    timestamp: new Date().toISOString(),
    score: getMoodScore(mood), // Make sure getMoodScore is defined or moved here
  };

  // Add to local storage simulation
  const storedMoods = JSON.parse(localStorage.getItem("moodData") || "[]");
  storedMoods.push(moodEntry);
  localStorage.setItem("moodData", JSON.stringify(storedMoods));

  console.log("Mood logged via API (dummy):", moodEntry);
  return { success: true };
}

async function saveJournalAPI(title, content) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800));

  const journalEntry = {
    id: Date.now(),
    title: title,
    content: content,
    timestamp: new Date().toISOString(),
  };

  // Store locally
  const storedEntries = JSON.parse(
    localStorage.getItem("journalEntries") || "[]"
  );
  storedEntries.unshift(journalEntry); // Add to the beginning
  localStorage.setItem("journalEntries", JSON.stringify(storedEntries));

  console.log("Journal entry saved via API (dummy):", journalEntry);
  return { success: true };
}

function getMoodScore(mood) {
  const scores = {
    happy: 8,
    calm: 7,
    sad: 3,
    anxious: 4,
    stressed: 4,
  };
  return scores[mood] || 5; // Default score
}

function loadDummyData() {
  // Initialize with some dummy data if none exists in localStorage
  if (!localStorage.getItem("moodData")) {
    const dummyMoods = [
      {
        mood: "happy",
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        score: 8,
      }, // 3 days ago
      {
        mood: "calm",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        score: 7,
      }, // 2 days ago
      {
        mood: "anxious",
        timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
        score: 4,
      }, // 1 day ago
    ];
    localStorage.setItem("moodData", JSON.stringify(dummyMoods));
  }

  if (!localStorage.getItem("journalEntries")) {
    const dummyEntries = [
      {
        id: Date.now() - 86400000 * 2, // ensure unique IDs
        title: "Grateful Thursday (Dummy)",
        content:
          "Today I'm grateful for the small moments - my morning coffee, a text from a friend, and the sunset I caught on my evening walk. Sometimes it's these little things that make the biggest difference...",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: Date.now() - 86400000,
        title: "Overcoming Anxiety (Dummy)",
        content:
          "Had a big presentation today and felt really anxious beforehand. Used the breathing techniques from MindMate and it actually helped calm me down. The presentation went well and I'm proud of myself for pushing through...",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    localStorage.setItem("journalEntries", JSON.stringify(dummyEntries));
  }
  console.log("Dummy data loaded/checked.");
}

// Export functions for potential future API integration (though not strictly needed for this global script setup)
const MindMateAPI = {
  chat: callChatAPI,
  logMood: logMoodAPI,
  saveJournal: saveJournalAPI,
  getMoodScore: getMoodScore, // Make it part of the API object if needed elsewhere
  // Placeholder for future endpoints
  getInsights: async () => ({
    insights: [
      "You've been consistently tracking your mood!",
      "Your stress levels seem lower this week.",
    ],
  }),
  getRecommendations: async () => ({
    recommendations: [
      "Try the 4-7-8 breathing technique",
      "Consider journaling before bed",
    ],
  }),
};
