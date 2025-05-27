// components/Sidebar.js
"use client";
import Image from "next/image";

// Props: onShowPage, currentPage, currentUser
export default function Sidebar({ onShowPage, currentPage, currentUser }) {
  const navItems = [
    { id: "home", icon: "fa-home", label: "Home" },
    { id: "chat", icon: "fa-comments", label: "Chat" },
    { id: "mood-tracker", icon: "fa-chart-line", label: "Mood Tracker" },
    { id: "journal", icon: "fa-book", label: "Journal" },
    { id: "resources", icon: "fa-heart", label: "Resources" },
  ];

  if (currentUser && currentUser.role === "admin") {
    navItems.push({ id: "admin", icon: "fa-user-shield", label: "Admin" });
  }

  return (
    // To make the sidebar itself a flex column, ensuring footer stays at bottom
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center">
          {/* Logo using Next/Image */}
          <div className="w-24 h-24 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
            {/* Container size increased */}
            <Image
              src="/mindmate.png"
              alt="MindMate Logo"
              width={70}
              height={70}
              className="rounded-lg"
              priority
            />
          </div>
          {/* App Name and Subtitle */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              MindMate
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Your wellness companion
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4 flex-grow overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 sm:space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onShowPage(item.id)}
                className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 text-left rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                  currentPage === item.id
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-gray-700"
                }`}
                aria-current={currentPage === item.id ? "page" : undefined}
              >
                <i
                  className={`fas ${
                    item.icon
                  } w-5 text-center text-base sm:text-lg ${
                    currentPage === item.id
                      ? "text-purple-600"
                      : "text-gray-500"
                  }`}
                ></i>
                <span className="font-medium text-sm sm:text-base">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Daily Streak - ensure it's at the bottom */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        {" "}
        {/* Added mt-auto to push to bottom */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">✨ Daily Streak</p>
          <p className="text-xs text-blue-600">
            {currentUser?.dailyStreak
              ? `${currentUser.dailyStreak} days`
              : "Keep it up!"}
          </p>
        </div>
      </div>
    </div>
  );
}
