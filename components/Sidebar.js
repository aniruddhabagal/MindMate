// components/Sidebar.js
"use client";
// import Link from 'next/link'; // If using Next.js router for admin page
// import { usePathname } from 'next/navigation';

export default function Sidebar({ onShowPage, currentPage, currentUser }) {
  // const pathname = usePathname(); // For Next.js Link active state

  const navItems = [
    { id: "home", icon: "fa-home", label: "Home" },
    { id: "chat", icon: "fa-comments", label: "Chat" },
    { id: "mood-tracker", icon: "fa-chart-line", label: "Mood Tracker" },
    { id: "journal", icon: "fa-book", label: "Journal" },
    { id: "resources", icon: "fa-heart", label: "Resources" },
  ];

  // Conditionally add admin item
  if (currentUser && currentUser.role === "admin") {
    navItems.push({ id: "admin", icon: "fa-user-shield", label: "Admin" });
  }

  return (
    // The outer div in app/page.js handles the actual sliding and z-index
    // This component just renders the content of the sidebar
    <>
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
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onShowPage(item.id)} // onShowPage will close mobile menu
                className={`nav-btn w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                  currentPage === item.id
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700"
                }`}
              >
                <i
                  className={`fas ${item.icon} w-5 text-center ${
                    currentPage === item.id
                      ? "text-purple-600"
                      : "text-gray-600"
                  }`}
                ></i>
                <span className={`font-medium`}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium">✨ Daily Streak</p>
          <p className="text-xs text-blue-600">
            {/* This needs to be dynamic eventually */}
            {currentUser?.dailyStreak
              ? `${currentUser.dailyStreak} days`
              : "Keep it up!"}
          </p>
        </div>
      </div>
    </>
  );
}
