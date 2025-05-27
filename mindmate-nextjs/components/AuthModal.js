// components/AuthModal.js
"use client";
import { useState } from "react";

// Props: isOpen, onClose, onLogin, onRegister, initialError, initialFormType = 'login'
export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  initialError,
  initialFormType = "login",
}) {
  const [formType, setFormType] = useState(initialFormType); // 'login' or 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(initialError || "");

  const handleSwitchForm = (type) => {
    setFormType(type);
    setError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formType === "login") {
      if (!username || !password) {
        setError("Username and password are required.");
        return;
      }
      try {
        await onLogin(username, password);
        // onClose(); // Parent should close on successful login/register
      } catch (err) {
        setError(err.message || "Login failed.");
      }
    } else {
      // register
      if (!username || !password || !confirmPassword) {
        setError("All fields are required.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      try {
        await onRegister(username, password);
        // onClose();
      } catch (err) {
        setError(err.message || "Registration failed.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="authModalContainer"
      className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        {formType === "login" ? (
          <>
            <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              Login to MindMate
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="loginUsernameAuth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="loginUsernameAuth"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="loginPasswordAuth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="loginPasswordAuth"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
              >
                Login
              </button>
              <p className="text-center text-sm text-gray-600 mt-4">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchForm("register")}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Register here
                </button>
              </p>
            </form>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              Create Account
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="registerUsernameAuth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="registerUsernameAuth"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="registerPasswordAuth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="registerPasswordAuth"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="registerConfirmPasswordAuth"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="registerConfirmPasswordAuth"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
              >
                Register
              </button>
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchForm("login")}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Login here
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
