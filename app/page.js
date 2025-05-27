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
import Loader from "../components/Loader";
import { formatDate } from "@/lib/formatters";

// Import API functions
import * as apiClient from "../lib/apiClient"; // Import all as apiClient
import AdminPage from "./admin/page";

export default function MindMateApp() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState("login");
  const [authError, setAuthError] = useState("");
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isAppLoading, setIsAppLoading] = useState(true); // Global loading state

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
    admin: "Admin Dashboard",
  };

  // --- Authentication ---
  const checkAuth = useCallback(async () => {
    setIsAppLoading(true);
    const token = apiClient.getToken();
    const localUser = apiClient.getLoggedInUser(); // This now gets { _id, username, credits, role } if stored correctly

    if (token && localUser) {
      setCurrentUser(localUser); // Optimistic update from localStorage
      console.log("Initial auth check: Found local token and user.", localUser);

      try {
        const userFromServer = await apiClient.getCurrentUserAPI(); // Fetches fresh data from /auth/me
        if (userFromServer) {
          setCurrentUser(userFromServer); // Update with fresh data, including role and credits
          // apiClient.getCurrentUserAPI now also updates localStorage mindmateUser
          console.log(
            "Auth check: Token verified, currentUser updated from server.",
            userFromServer
          );
        } else {
          console.warn(
            "Auth check: Token invalid or user not found by server. Logging out."
          );
          await apiClient.logoutAPI();
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Auth check /auth/me call failed:", error);
        await apiClient.logoutAPI();
        setCurrentUser(null);
      }
    } else {
      console.log(
        "Initial auth check: No local token or user. User is logged out."
      );
      setCurrentUser(null);
    }
    setIsAppLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async (username, password) => {
    try {
      const backendResponse = await apiClient.loginAPI(username, password);
      if (backendResponse && backendResponse.token) {
        setCurrentUser({
          // Ensure role and credits are set here
          _id: backendResponse._id,
          username: backendResponse.username,
          credits: backendResponse.credits,
          role: backendResponse.role,
        });
        setIsAuthModalOpen(false);
        setAuthError("");
        moodDataVersion.current++;
        journalDataVersion.current++;
        console.log("Login successful, currentUser state:", backendResponse);
      } else {
        throw new Error(
          backendResponse.message ||
            "Login failed: No token or user data in response."
        );
      }
    } catch (error) {
      console.error("handleLogin error:", error);
      setAuthError(error.message || "Login failed.");
      // throw error; // No need to re-throw if AuthModal doesn't need it
    }
  };

  const handleRegister = async (username, password) => {
    try {
      const backendResponse = await apiClient.registerAPI(username, password);
      if (backendResponse && backendResponse.token) {
        setCurrentUser({
          // Ensure role and credits are set here
          _id: backendResponse._id,
          username: backendResponse.username,
          credits: backendResponse.credits,
          role: backendResponse.role,
        });
        setIsAuthModalOpen(false);
        setAuthError("");
        moodDataVersion.current++;
        journalDataVersion.current++;
        console.log(
          "Registration successful, currentUser state:",
          backendResponse
        );
      } else {
        throw new Error(
          backendResponse.message ||
            "Registration failed: No token or user data."
        );
      }
    } catch (error) {
      console.error("handleRegister error:", error);
      setAuthError(error.message || "Registration failed.");
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
    const protectedPages = ["chat", "mood-tracker", "journal", "admin"];
    if (protectedPages.includes(pageId) && !currentUser) {
      openLoginModal(
        "login",
        `Please login to access the ${pageId.replace("-", " ")} page.`
      );
      if (protectedPages.includes(currentPage)) {
        setCurrentPage("home"); // Default to home if current page was also protected
      }
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

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
        credits: Math.max(0, (prevUser.credits || 0) - 1),
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

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        // sw.js should be in the `public` folder for Next.js to serve it from the root
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => console.log("SW registered: ", registration))
          .catch((registrationError) =>
            console.log("SW registration failed: ", registrationError)
          );
      });
    }
  }, []);

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
            recentActivities={recentActivities}
          />
        );
      case "chat":
        return (
          <ChatPage
            currentUser={currentUser}
            apiClient={apiClient} // Pass the whole apiClient object
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
            formatDate={formatDate}
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

      case "admin":
        return <AdminPage />;
    }
  };

  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!currentUser) {
        setRecentActivities([]);
        return;
      }
      try {
        const [moods, journals] = await Promise.all([
          apiClient.getMoodEntriesAPI(), // Fetches all, sorted newest first by backend
          apiClient.getJournalEntriesAPI(), // Fetches all, sorted newest first
        ]);

        const moodActivities = moods
          .slice(0, 2)
          .map((m) => ({ type: "mood", ...m, date: m.entryDate }));
        const journalActivities = journals
          .slice(0, 2)
          .map((j) => ({ type: "journal", ...j, date: j.entryDate }));

        const combined = [...moodActivities, ...journalActivities]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3); // Take top 3 overall recent
        setRecentActivities(combined);
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        setRecentActivities([]);
      }
    };
    fetchRecentActivities();
  }, [currentUser, moodDataVersion.current, journalDataVersion.current]); // Re-fetch if user or data changes

  if (isAppLoading && currentUser === null) {
    // Show full page loader only if no user yet (initial load)
    // OR if (isAppLoading && !initialAuthCheckDone) using another state variable
    return (
      <Loader show={true} text="Initializing MindMate..." fullPage={true} />
    );
  }

  return (
    <>
      <Loader
        show={isAppLoading && !currentUser}
        text="Initializing MindMate..."
        fullPage={true}
      />
      {/* More precise control */}
      {!(isAppLoading && !currentUser) && (
        <>
          <div
            id="mobileOverlay"
            className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${
              isMobileMenuOpen ? "" : "hidden"
            }`}
            onClick={toggleMobileMenu}
          ></div>
          <div
            className={`fixed top-0 left-0 h-full bg-white w-64 min-h-screen shadow-xl border-r border-gray-200 transition-transform duration-300 ease-in-out md:translate-x-0 ${
              isMobileMenuOpen ? "translate-x-0 z-50" : "-translate-x-full z-40" // Ensure z-index changes
            } md:z-40`}
          >
            <Sidebar
              onShowPage={handleShowPage}
              currentPage={currentPage}
              currentUser={currentUser}
            />
          </div>
          <div
            id="mainContentArea"
            className={`transition-all duration-300 ease-in-out md:ml-64 min-h-screen ${
              isMobileMenuOpen && !isAuthModalOpen
                ? "blur-sm md:blur-none pointer-events-none md:pointer-events-auto"
                : ""
            } ${isAuthModalOpen ? "blur-sm pointer-events-none" : ""}`}
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
      )}
    </>
  );
}
