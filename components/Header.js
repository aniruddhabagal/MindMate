// components/Header.js
"use client";

import { getUserInitials } from "@/lib/formatters";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
export default function Header({
  pageTitle,
  onMobileMenuToggle,
  username,
  credits,
  onLogout,
  onOpenLoginModal,
  isLoggedIn,
  isLoggingOut,
}) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // To detect clicks outside the dropdown

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen((prev) => !prev);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const initials = isLoggedIn ? getUserInitials(username) : "";

  const handleLogoutClick = () => {
    setIsUserDropdownOpen(false); // Close dropdown before logging out
    onLogout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Left Section: Mobile Menu Toggle & Page Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            id="mobileMenuBtn"
            onClick={onMobileMenuToggle}
            className="md:hidden text-gray-600 hover:text-purple-600 focus:outline-none p-1 -ml-1" // Added padding for better tap target
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <h2
            id="pageTitle"
            className="text-xl sm:text-2xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-xs md:max-w-md"
          >
            {pageTitle}
          </h2>
        </div>

        {/* Right Section: User Info/Login & Avatar Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isLoggedIn ? (
            <>
              <div
                className="hidden sm:flex items-center gap-1 text-sm text-yellow-600"
                title={`${credits} credits`}
              >
                <i className="fas fa-coins text-yellow-500"></i>
                <span id="userCreditsDisplay" className="font-medium">
                  {credits === undefined ? "..." : credits}
                </span>
              </div>

              {/* User Avatar and Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow hover:shadow-md transition-shadow"
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  {initials}
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50" // Ensure high z-index
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button" // Should match an ID on the button if you add one
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {username}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <i className="fas fa-coins text-yellow-500 mr-1.5"></i>{" "}
                        {credits === undefined ? "..." : credits} credits
                      </p>
                    </div>
                    {/* Example Dropdown Items - make these functional later */}
                    <a
                      href="#" // Replace with actual path or onClick handler
                      onClick={(e) => {
                        e.preventDefault();
                        setIsUserDropdownOpen(false);
                        toast("Profile page coming soon!");
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      role="menuitem"
                    >
                      <i className="fas fa-user-circle w-5 mr-2 text-gray-400"></i>
                      Profile
                    </a>
                    <a
                      href="#" // Replace with actual path or onClick handler
                      onClick={(e) => {
                        e.preventDefault();
                        setIsUserDropdownOpen(false);
                        toast("Settings page coming soon!");
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      role="menuitem"
                    >
                      <i className="fas fa-cog w-5 mr-2 text-gray-400"></i>
                      Settings
                    </a>
                    <button
                      onClick={handleLogoutClick}
                      disabled={isLoggingOut}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-70 flex items-center"
                      role="menuitem"
                    >
                      {isLoggingOut ? (
                        <>
                          <i className="fas fa-spinner fa-spin w-5 mr-2"></i>
                          Logging out...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-out-alt w-5 mr-2"></i>Logout
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div id="loginPrompt" className="flex items-center">
              <button
                id="openLoginModalBtn"
                onClick={onOpenLoginModal}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-2 rounded-md hover:bg-purple-50 transition-colors"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
