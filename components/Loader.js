// components/Loader.js
"use client";

// Props:
// - show: boolean to control visibility
// - text: optional text to display below the loader
// - fullPage: boolean, if true, it's an overlay, otherwise it's an inline loader
// - size: 'small' | 'medium' | 'large' (default medium) for inline loaders
export default function Loader({
  show = false,
  text = "Connecting with MindMate...",
  fullPage = true,
  size = "medium",
}) {
  if (!show) {
    return null;
  }

  const brainIconSize = fullPage
    ? "3.8rem"
    : size === "small"
    ? "1.8rem"
    : "2.5rem";
  const containerSize = fullPage ? "110px" : size === "small" ? "50px" : "70px";
  const textClass = fullPage
    ? "loader-text"
    : size === "small"
    ? "text-xs text-gray-500 mt-1"
    : "text-sm text-gray-600 mt-2";
  const marginBottom = fullPage
    ? "1.5rem"
    : size === "small"
    ? "0.5rem"
    : "1rem";

  if (fullPage) {
    return (
      <div
        className="mindmate-loader-overlay"
        role="status"
        aria-live="polite"
        aria-label={text || "Loading"}
      >
        <div className="mindmate-loader">
          <div
            className="loader-brain-container"
            style={{
              width: containerSize,
              height: containerSize,
              marginBottom,
            }}
          >
            <i
              className="fas fa-brain loader-brain-icon"
              style={{ fontSize: brainIconSize }}
              aria-hidden="true"
            ></i>
            <div className="loader-wiring">
              <div className="line short line-1"></div>
              <div className="line medium line-2"></div>
              <div className="line long line-3"></div>
              <div className="line short line-4"></div>
              <div className="line medium line-5"></div>
              <div className="line long line-6"></div>
              <div className="line short line-7"></div>
              <div className="line medium line-8"></div>
            </div>
          </div>
          {text && <p className={textClass}>{text}</p>}
        </div>
      </div>
    );
  }

  // Inline loader
  return (
    <div
      className="flex flex-col items-center justify-center py-4"
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >
      <div
        className="loader-brain-container"
        style={{ width: containerSize, height: containerSize, marginBottom }}
      >
        <i
          className="fas fa-brain loader-brain-icon"
          style={{ fontSize: brainIconSize }}
          aria-hidden="true"
        ></i>
        {/* Simplified wiring for inline, or omit if too cluttered for small sizes */}
        {(size === "medium" || size === "large") && (
          <div
            className="loader-wiring"
            style={{
              transform: size === "small" ? "scale(0.6)" : "scale(0.8)",
            }}
          >
            {" "}
            {/* Scale down wiring for smaller inline */}
            <div className="line short line-1"></div>
            <div className="line medium line-2"></div>
            <div className="line long line-3"></div>
            <div className="line short line-4"></div>
            {/* Add fewer lines for small size if desired */}
          </div>
        )}
      </div>
      {text && <p className={textClass}>{text}</p>}
    </div>
  );
}
