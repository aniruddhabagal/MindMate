// components/Loader.js
"use client";

// Props:
// - show: boolean to control visibility
// - text: optional text to display below the loader
// - fullPage: boolean, if true, it's an overlay, otherwise it's an inline loader
export default function Loader({
  show = false,
  text = "Connecting with MindMate...",
  fullPage = true,
}) {
  if (!show) {
    return null;
  }

  if (fullPage) {
    return (
      <div className="mindmate-loader-overlay" role="status" aria-live="polite">
        <div className="mindmate-loader">
          <div className="loader-brain-container">
            <i
              className="fas fa-brain loader-brain-icon"
              aria-hidden="true"
            ></i>
            <div className="loader-wiring">
              <div className="dot dot-1"></div>
              <div className="dot dot-2"></div>
              <div className="dot dot-3"></div>
              <div className="dot dot-4"></div>
              <div className="dot dot-5"></div>
              <div className="dot dot-6"></div>
            </div>
          </div>
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  // Inline loader (simpler version for now, can be enhanced)
  return (
    <div
      className="flex flex-col items-center justify-center py-8"
      role="status"
      aria-live="polite"
    >
      <div
        className="loader-brain-container"
        style={{ width: "60px", height: "60px", marginBottom: "1rem" }}
      >
        {" "}
        {/* Smaller inline */}
        <i
          className="fas fa-brain loader-brain-icon"
          style={{ fontSize: "2rem" }}
          aria-hidden="true"
        ></i>
        {/* Optionally add simplified wiring for inline or omit for cleanliness */}
      </div>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
