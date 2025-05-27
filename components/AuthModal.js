// components/AuthModal.js
"use client";
import { useState, useEffect, useRef } from "react"; // Added useEffect, useRef
import toast from "react-hot-toast";

export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  initialError,
  initialFormType = "login",
}) {
  const [formType, setFormType] = useState(initialFormType);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(initialError || "");
  const [isLoading, setIsLoading] = useState(false); // <<< New loading state

  const usernameInputRef = useRef(null); // For focusing

  useEffect(() => {
    if (isOpen) {
      // When modal opens, reset form type and error, and focus
      setFormType(initialFormType);
      setError(initialError || "");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        // Timeout to ensure input is visible before focusing
        usernameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialFormType, initialError]);

  const handleSwitchForm = (type) => {
    setFormType(type);
    setError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false); // Reset loading state if form is switched
    setTimeout(() => usernameInputRef.current?.focus(), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // <<< Start loading
    const toastId = toast.loading("Processing..."); // Generic loading
    try {
      if (formType === "login") {
        if (!username || !password) {
          setError("Username and password are required.");
          setIsLoading(false); // <<< Stop loading on validation error
          return;
        }
        try {
          await onLogin(username, password); // onLogin in app/page.js will handle closing modal
          toast.dismiss(toastId);
        } catch (err) {
          setError(err.message || "Login failed.");
        } finally {
          setIsLoading(false); // <<< Stop loading
        }
      } else {
        // register
        if (!username || !password || !confirmPassword) {
          setError("All fields are required.");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }
        try {
          await onRegister(username, password); // onRegister in app/page.js will handle closing modal
          toast.dismiss(toastId);
        } catch (err) {
          setError(err.message || "Registration failed.");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (err) {
      // Catches errors re-thrown by onLogin/onRegister
      toast.dismiss(toastId);
      setError(err.message || "Operation failed."); // Still set local error for display in modal
      // toast.error(err.message || "Operation failed."); // Optionally, also show a toast for API errors
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
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
                  ref={usernameInputRef}
                  type="text"
                  id="loginUsernameAuth"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
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
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Processing...
                  </>
                ) : (
                  "Login"
                )}
              </button>
              <p className="text-center text-sm text-gray-600 mt-4">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchForm("register")}
                  disabled={isLoading}
                  className="text-purple-600 hover:underline font-medium disabled:opacity-70"
                >
                  Register here
                </button>
              </p>
            </form>
          </>
        ) : (
          // Register form
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
                  ref={usernameInputRef}
                  type="text"
                  id="registerUsernameAuth"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
              </div>
              <div className="mb-4">
                {" "}
                {/* Consistent margin */}
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
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
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
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2.5 rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Processing...
                  </>
                ) : (
                  "Register"
                )}
              </button>
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchForm("login")}
                  disabled={isLoading}
                  className="text-purple-600 hover:underline font-medium disabled:opacity-70"
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
