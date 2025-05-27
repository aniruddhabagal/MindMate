// components/Loader.js
"use client";

export default function Loader({
  show = false,
  text = "Connecting your thoughts...",
  fullPage = true,
}) {
  if (!show) {
    return null;
  }

  // Common loader content
  const loaderContent = (
    <div className="loader-brain-container">
      <i className="fas fa-brain loader-brain-icon" aria-hidden="true"></i>
      <div className="loader-activity">
        <div className="spark spark-1"></div>
        <div className="spark spark-2 spark-alt"></div>
        <div className="spark spark-3"></div>
        <div className="spark spark-4 spark-alt"></div>
        <div className="spark spark-5"></div>
        <div className="spark spark-6 spark-alt"></div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="mindmate-loader-overlay" role="status" aria-live="polite">
        <div className="mindmate-loader-content">
          {" "}
          {/* Updated class */}
          {loaderContent}
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  // Inline loader (can be simpler or use parts of the above)
  return (
    <div
      className="flex flex-col items-center justify-center py-6"
      role="status"
      aria-live="polite"
    >
      <div
        className="loader-brain-container"
        style={{ width: "70px", height: "70px", marginBottom: "1rem" }}
      >
        <i
          className="fas fa-brain loader-brain-icon"
          style={{ fontSize: "2.5rem" }}
          aria-hidden="true"
        ></i>
        {/* Simplified or fewer sparks for inline if desired */}
        <div className="loader-activity">
          <div
            className="spark spark-1"
            style={{ animationDuration: "2s" }}
          ></div>
          <div
            className="spark spark-3 spark-alt"
            style={{ animationDuration: "2.2s" }}
          ></div>
          <div
            className="spark spark-5"
            style={{ animationDuration: "2.4s" }}
          ></div>
        </div>
      </div>
      {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
    </div>
  );
}
