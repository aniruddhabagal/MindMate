// components/Sidebar.js
"use client";
import Image from "next/image"; // Import the Next.js Image component

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
    <>
      <div className="p-4 sm:p-6 border-b border-gray-200">
        {" "}
        {/* Adjusted padding */}
        <div className="flex items-center gap-3">
          {/* Logo using Next/Image */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
            {" "}
            {/* Container for consistent sizing */}
            <Image
              src="/mindmate.png" // Path relative to the 'public' directory
              alt="MindMate Logo"
              width={90} // Desired display width (will be optimized)
              height={90} // Desired display height
              className="rounded-lg" // Optional: if your logo benefits from rounded corners
              priority // Add priority if this is an LCP element (Less likely for sidebar logo)
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
        {" "}
        {/* Added flex-grow for nav */}
        <ul className="space-y-1 sm:space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onShowPage(item.id)}
                className={`nav-btn w-full flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 text-left rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                  currentPage === item.id
                    ? "bg-purple-100 text-purple-700 font-semibold" // Added font-semibold for active
                    : "text-gray-700"
                }`}
                aria-current={currentPage === item.id ? "page" : undefined}
              >
                <i
                  className={`fas ${
                    item.icon
                  } w-5 text-center text-base sm:text-lg ${
                    // Adjusted icon size
                    currentPage === item.id
                      ? "text-purple-600"
                      : "text-gray-500" // Slightly lighter inactive icon
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
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        {" "}
        {/* Added flex-shrink-0 */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">✨ Daily Streak</p>
          <p className="text-xs text-blue-600">
            {currentUser?.dailyStreak
              ? `${currentUser.dailyStreak} days`
              : "Keep it up!"}
          </p>
        </div>
      </div>
    </>
  );
}
