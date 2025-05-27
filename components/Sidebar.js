// components/Sidebar.js
"use client"; // This component will have client-side interactions (button clicks)

import Link from "next/link"; // For navigation (optional, if you use Next.js routing for pages)
// We'll need a way to manage current page state, possibly via context or props

// Props might include: onShowPage (function to handle page changes), currentPage
export default function Sidebar({ onShowPage, currentPage }) {
  // The original onclick="showPage('home')" etc. will be replaced.
  // We'll pass a function from the parent component (e.g., the main page layout)
  // or use Next.js Link components if these are actual routes.
  // For now, let's assume onShowPage is a prop for SPA-like behavior within one Next.js page.

  const handleNavClick = (pageId) => {
    if (onShowPage) {
      onShowPage(pageId);
    }
  };

  return (
    <div
      id="sidebar"
      className="sidebar bg-white w-64 min-h-screen shadow-xl border-r border-gray-200 fixed top-0 left-0 z-40 {/* Conditional class for mobile open state will be handled by parent state */}"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-brain text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MindMate</h1>
            <p className="text-sm text-gray-500">Your wellness companion</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {[
            { id: "home", icon: "fa-home", label: "Home" },
            { id: "chat", icon: "fa-comments", label: "Chat" },
            {
              id: "mood-tracker",
              icon: "fa-chart-line",
              label: "Mood Tracker",
            },
            { id: "journal", icon: "fa-book", label: "Journal" },
            { id: "resources", icon: "fa-heart", label: "Resources" },
          ].map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavClick(item.id)}
                className={`nav-btn w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 transition-colors ${
                  currentPage === item.id ? "bg-purple-100 text-purple-700" : ""
                }`}
              >
                <i
                  className={`fas ${item.icon} text-gray-600 ${
                    currentPage === item.id ? "text-purple-700" : ""
                  }`}
                ></i>
                <span
                  className={`font-medium ${
                    currentPage === item.id
                      ? "text-purple-700"
                      : "text-gray-700"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">✨ Daily Streak</p>
          <p className="text-xs text-blue-600">5 days of check-ins!</p>{" "}
          {/* This will need to be dynamic */}
        </div>
      </div>
    </div>
  );
}
