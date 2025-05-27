// app/page.js
"use client"; // This page will be interactive

import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import HomePage from "../components/HomePage";
import ChatPage from "../components/ChatPage";
import MoodTrackerPage from "../components/MoodTrackerPage";
import JournalPage from "../components/JournalPage";
import ResourcesPage from "../components/ResourcesPage";
import AuthModal from "../components/AuthModal";
import BreathingModal from "../components/BreathingModal";

// Import API functions - we'll refactor api.js later
// For now, assume they are available or create a temporary wrapper
import {
  loginAPI,
  registerAPI,
  logoutAPI,
  getCurrentUserAPI,
  getLoggedInUser,
  getToken,
  callChatAPI,
  getMoodScore,
  logMoodAPI,
  getMoodEntriesAPI,
  getMoodChartDataAPI,
  saveJournalAPI,
  getJournalEntriesAPI,
  getJournalEntryByIdAPI,
  updateJournalEntryAPI,
  deleteJournalEntryAPI,
} from "../lib/apiClient"; // We'll create this wrapper

export default function MindMateApp() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState("login"); // 'login' or 'register'
  const [authError, setAuthError] = useState("");
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);

  // Page titles (can be moved to a config file)
  const pageTitles = {
    home: currentUser
      ? `Welcome, ${currentUser.username}!`
      : "Welcome to MindMate!",
    chat: "Chat with MindMate",
    "mood-tracker": "Mood Tracker",
    journal: "Your Journal",
    resources: "Wellness Resources",
  };

  // --- Authentication ---
  const checkAuth = useCallback(async () => {
    const token = getToken(); // from apiClient (localStorage)
    if (token) {
      try {
        const user = await getCurrentUserAPI();
        if (user) {
          setCurrentUser(user);
        } else {
          await logoutAPI(); // Clear invalid token/user from localStorage
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Auth check failed, logging out:", error);
        await logoutAPI();
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async (username, password) => {
    try {
      const data = await loginAPI(username, password);
      setCurrentUser(data); // Includes token and user details
      setIsAuthModalOpen(false);
      // loadUserSpecificData(); // Call this to fetch data after login
    } catch (error) {
      setAuthError(error.message || "Login failed.");
      throw error; // Re-throw for AuthModal to handle its own error display
    }
  };

  const handleRegister = async (username, password) => {
    try {
      const data = await registerAPI(username, password);
      setCurrentUser(data); // Auto-login after register
      setIsAuthModalOpen(false);
      // loadUserSpecificData();
    } catch (error) {
      setAuthError(error.message || "Registration failed.");
      throw error;
    }
  };

  const handleLogout = async () => {
    await logoutAPI();
    setCurrentUser(null);
    setCurrentPage("home"); // Redirect to home after logout
    // Clear any sensitive local state (e.g., chat history)
  };

  const openLoginModal = (type = "login", message = "") => {
    setAuthModalType(type);
    setAuthError(message);
    setIsAuthModalOpen(true);
  };

  // --- Page Navigation & UI ---
  const handleShowPage = (pageId) => {
    const protectedPages = ["chat", "mood-tracker", "journal"];
    if (protectedPages.includes(pageId) && !currentUser) {
      openLoginModal(
        "login",
        `Please login to access the ${pageId.replace("-", " ")} page.`
      );
      return;
    }
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false); // Close mobile menu on page change
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // --- Mood Functionality ---
  const handleSelectMood = async (mood) => {
    if (!currentUser) {
      openLoginModal("login", "Please login to log your mood.");
      return;
    }
    const score = getMoodScore(mood); // From apiClient
    try {
      await logMoodAPI(mood, score);
      alert(`Mood "${mood}" logged!`); // Replace with better notification
      // Potentially refresh mood data here if MoodTrackerPage is active or data is shown on current page
      // if (currentPage === 'mood-tracker') // fetch and re-render mood tracker data
    } catch (error) {
      console.error("Error logging mood:", error);
      alert("Could not log mood: " + error.message);
    }
  };

  // --- Breathing Exercise ---
  const openBreathingExercise = () => setIsBreathingModalOpen(true);
  const closeBreathingExercise = () => setIsBreathingModalOpen(false);

  // --- Render Page Content ---
  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            username={currentUser?.username}
            onShowPage={handleShowPage}
            onOpenBreathingExercise={openBreathingExercise}
            onSelectMood={handleSelectMood}
          />
        );
      case "chat":
        // Pass chat history, sendMessage handler etc.
        return <ChatPage currentUser={currentUser} callChatAPI={callChatAPI} />;
      case "mood-tracker":
        // Pass functions to fetch and display mood data
        return (
          <MoodTrackerPage
            currentUser={currentUser}
            getMoodChartDataAPI={getMoodChartDataAPI}
            getMoodEntriesAPI={getMoodEntriesAPI}
          />
        );
      case "journal":
        // Pass journal related functions and data
        return (
          <JournalPage
            currentUser={currentUser}
            saveJournalAPI={saveJournalAPI}
            getJournalEntriesAPI={getJournalEntriesAPI}
            updateJournalEntryAPI={updateJournalEntryAPI}
            deleteJournalEntryAPI={deleteJournalEntryAPI}
            getJournalEntryByIdAPI={getJournalEntryByIdAPI}
          />
        );
      case "resources":
        return <ResourcesPage openBreathingExercise={openBreathingExercise} />; // Pass any needed functions
      default:
        return (
          <HomePage
            username={currentUser?.username}
            onShowPage={handleShowPage}
            onOpenBreathingExercise={openBreathingExercise}
            onSelectMood={handleSelectMood}
          />
        );
    }
  };

  // Main layout structure
  return (
    <>
      <div
        id="mobileOverlay"
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${
          isMobileMenuOpen ? "" : "hidden"
        }`}
        onClick={toggleMobileMenu}
      ></div>

      <div
        className={`fixed top-0 left-0 h-full transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } z-40`}
      >
        <Sidebar onShowPage={handleShowPage} currentPage={currentPage} />
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isMobileMenuOpen && "md:blur-none blur-sm"
        } md:ml-64 min-h-screen`}
      >
        <Header
          pageTitle={pageTitles[currentPage] || "MindMate"}
          onMobileMenuToggle={toggleMobileMenu}
          username={currentUser?.username}
          credits={currentUser?.credits}
          onLogout={handleLogout}
          onOpenLoginModal={() => openLoginModal("login")}
          isLoggedIn={!!currentUser}
        />
        <main className="p-6">{renderPageContent()}</main>
      </div>

      {/* Floating Chat Button - can be its own component */}
      {currentUser && (
        <button
          onClick={() => handleShowPage("chat")}
          className="floating-button bg-gradient-to-r from-purple-500 to-indigo-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all fixed bottom-6 right-6 z-20"
          aria-label="Open Chat"
        >
          <i className="fas fa-comments text-xl"></i>
        </button>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        initialFormType={authModalType}
        initialError={authError}
      />
      <BreathingModal
        isOpen={isBreathingModalOpen}
        onClose={closeBreathingExercise}
        // Pass startBreathing logic or manage state within BreathingModal
      />
    </>
  );
}
