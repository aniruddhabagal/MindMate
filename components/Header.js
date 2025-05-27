// components/Header.js
"use client";

export default function Header({
  pageTitle,
  onMobileMenuToggle,
  username,
  credits,
  onLogout,
  onOpenLoginModal,
  isLoggedIn,
}) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            id="mobileMenuBtn"
            onClick={onMobileMenuToggle} // <<< CALL THE PASSED FUNCTION
            className="md:hidden text-gray-600 hover:text-purple-600 focus:outline-none"
            aria-label="Toggle menu" // Accessibility
            aria-expanded={false} // This would need to be dynamic based on parent state if Header knew it
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <h2 id="pageTitle" className="text-2xl font-bold text-gray-900">
            {pageTitle}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div
              id="userProfile"
              className="flex items-center gap-x-3 sm:gap-x-4"
            >
              {" "}
              {/* Adjusted gap for responsiveness */}
              <span
                id="usernameDisplay"
                className="text-sm font-medium text-gray-700 hidden sm:inline"
              >
                {username}
              </span>
              <div
                className="flex items-center gap-1 text-sm text-yellow-600"
                title={`${credits} credits`}
              >
                <i className="fas fa-coins"></i>
                <span id="userCreditsDisplay">{credits}</span>
              </div>
              <button
                id="logoutBtn"
                onClick={onLogout}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div id="loginPrompt" className="flex items-center gap-4">
              <button
                id="openLoginModalBtn"
                onClick={onOpenLoginModal}
                className="text-sm font-medium text-purple-600 hover:text-purple-800"
              >
                Login
              </button>
            </div>
          )}
          {/* Notification and Avatar (can be conditional too) */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              2
            </span>
          </button>
          {isLoggedIn && (
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"></div>
          )}
        </div>
      </div>
    </header>
  );
}
