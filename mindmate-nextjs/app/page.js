// app/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import HomePage from "../components/HomePage";
import ChatPage from "../components/ChatPage";
import MoodTrackerPage from "../components/MoodTrackerPage";
import JournalPage from "../components/JournalPage";
import ResourcesPage from "../components/ResourcesPage";
import AuthModal from "../components/AuthModal";
import BreathingModal from "../components/BreathingModal";

// Import API functions
import * as apiClient from "../lib/apiClient"; // Import all as apiClient

// Utility function (can be in a separate utils/formatters.js file)
export function formatDate(dateString, short = false) {
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

export default function MindMateApp() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState("login");
  const [authError, setAuthError] = useState("");
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);

  // Refs for data that might need to be force-refreshed in child components
  const moodDataVersion = useRef(0); // Increment to trigger refetch in MoodTrackerPage
  const journalDataVersion = useRef(0); // Increment to trigger refetch in JournalPage

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
    const token = apiClient.getToken();
    if (token) {
      try {
        const user = await apiClient.getCurrentUserAPI();
        if (user) {
          setCurrentUser(user);
        } else {
          await apiClient.logoutAPI();
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Auth check failed, logging out:", error);
        await apiClient.logoutAPI();
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
      const data = await apiClient.loginAPI(username, password);
      setCurrentUser(data);
      setIsAuthModalOpen(false);
      setAuthError("");
      moodDataVersion.current++; // Trigger mood data refresh
      journalDataVersion.current++; // Trigger journal data refresh
      // Chat history will be reset by ChatPage based on currentUser change
    } catch (error) {
      setAuthError(error.message || "Login failed.");
      throw error;
    }
  };

  const handleRegister = async (username, password) => {
    try {
      const data = await apiClient.registerAPI(username, password);
      setCurrentUser(data); // Auto-login
      setIsAuthModalOpen(false);
      setAuthError("");
      moodDataVersion.current++;
      journalDataVersion.current++;
    } catch (error) {
      setAuthError(error.message || "Registration failed.");
      throw error;
    }
  };

  const handleLogout = async () => {
    await apiClient.logoutAPI();
    setCurrentUser(null);
    setCurrentPage("home");
    moodDataVersion.current++; // To clear data in child components
    journalDataVersion.current++;
    // Chat history reset is handled in ChatPage via useEffect on currentUser
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
    if (pageId === currentPage && pageId === "mood-tracker" && currentUser) {
      moodDataVersion.current++; // Force refresh if clicking current page
    }
    if (pageId === currentPage && pageId === "journal" && currentUser) {
      journalDataVersion.current++;
    }
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // --- Mood Functionality (Example: selectMood on HomePage) ---
  const handleSelectMoodOnHome = async (mood) => {
    if (!currentUser) {
      openLoginModal("login", "Please login to log your mood.");
      return false; // Indicate failure
    }
    const score = apiClient.getMoodScore(mood);
    try {
      await apiClient.logMoodAPI(mood, score);
      alert(`Mood "${mood}" logged!`);
      moodDataVersion.current++; // Trigger MoodTrackerPage to refetch
      // Potentially update currentUser.credits if credits are affected
      // const updatedUser = await apiClient.getCurrentUserAPI(); // One way to get fresh credits
      // if (updatedUser) setCurrentUser(updatedUser);
      return true;
    } catch (error) {
      console.error("Error logging mood:", error);
      alert("Could not log mood: " + error.message);
      return false;
    }
  };

  // --- Credit Update after Chat ---
  // This function would be passed to ChatPage
  const handleChatCreditDeduction = () => {
    if (currentUser) {
      setCurrentUser((prevUser) => ({
        ...prevUser,
        credits: Math.max(0, prevUser.credits - 1),
      }));
    }
  };
  const updateUserCredits = (newCreditCount) => {
    if (currentUser && newCreditCount !== undefined) {
      setCurrentUser((prevUser) => ({ ...prevUser, credits: newCreditCount }));
    }
  };

  // --- Breathing Exercise ---
  const openBreathingExercise = () => setIsBreathingModalOpen(true);
  const closeBreathingExercise = () => setIsBreathingModalOpen(false);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const pages = ["home", "chat", "mood-tracker", "journal", "resources"];
        const pageIndex = parseInt(e.key) - 1;
        if (pages[pageIndex]) handleShowPage(pages[pageIndex]);
      }
      if (e.key === "Escape") {
        if (isAuthModalOpen) setIsAuthModalOpen(false);
        else if (isBreathingModalOpen) setIsBreathingModalOpen(false);
        // else if (isJournalFormOpen) closeJournalForm(); // If journal form was a modal
        else if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, isBreathingModalOpen, isMobileMenuOpen]); // Add dependencies

  // --- Service Worker ---
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      // Only in production
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js") // Assuming sw.js is in public folder
          .then((registration) => console.log("SW registered: ", registration))
          .catch((registrationError) =>
            console.log("SW registration failed: ", registrationError)
          );
      });
    }
  }, []);

  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            username={currentUser?.username}
            onShowPage={handleShowPage}
            onOpenBreathingExercise={openBreathingExercise}
            onSelectMood={handleSelectMoodOnHome} // Pass the specific handler
            isLoggedIn={!!currentUser}
          />
        );
      case "chat":
        return (
          <ChatPage
            currentUser={currentUser}
            callChatAPI={apiClient.callChatAPI}
            onChatCreditDeduction={handleChatCreditDeduction}
            updateUserCredits={updateUserCredits}
          />
        );
      case "mood-tracker":
        return (
          <MoodTrackerPage
            currentUser={currentUser}
            getMoodChartDataAPI={apiClient.getMoodChartDataAPI}
            getMoodEntriesAPI={apiClient.getMoodEntriesAPI}
            // formatDate={formatDate} // Or component imports it
            moodDataVersion={moodDataVersion.current} // Pass the current value
          />
        );
      case "journal":
        return (
          <JournalPage
            currentUser={currentUser}
            apiClient={apiClient} // Pass the whole apiClient for convenience
            formatDate={formatDate}
            journalDataVersion={journalDataVersion.current}
          />
        );
      case "resources":
        return <ResourcesPage openBreathingExercise={openBreathingExercise} />;
      default:
        return (
          <HomePage
            username={currentUser?.username}
            onShowPage={handleShowPage}
          />
        );
    }
  };

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
        id="mainContentArea"
        className={`transition-all duration-300 ease-in-out ${
          isMobileMenuOpen && !isAuthModalOpen && "md:blur-none blur-sm"
        } ${
          isAuthModalOpen && "blur-sm pointer-events-none"
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
        <main className="p-6">
          {currentUser === undefined ? (
            <p>Loading user...</p>
          ) : (
            renderPageContent()
          )}
        </main>
      </div>

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
      />
    </>
  );
}
