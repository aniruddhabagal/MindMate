// components/BreathingModal.js
"use client";
import { useState, useEffect, useRef } from "react";

// Props: isOpen (boolean), onClose (function)
export default function BreathingModal({ isOpen, onClose }) {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState({
    text: "Breathe In",
    scaleClass: "scale-100",
  }); // Initial state before animation starts
  const intervalRef = useRef(null);
  const circleRef = useRef(null);

  const phases = [
    { text: "Breathe In", duration: 4, scaleClass: "scale-125" },
    { text: "Hold", duration: 4, scaleClass: "scale-125" }, // Hold at inhale size
    { text: "Breathe Out", duration: 6, scaleClass: "scale-75" },
    { text: "Hold", duration: 2, scaleClass: "scale-75" }, // Hold at exhale size
  ];
  let currentPhaseIndex = 0;
  let countInPhase = 0;

  const stopBreathingAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsBreathing(false);
    setBreathingPhase({ text: "Breathe In", scaleClass: "scale-100" }); // Reset visual
    currentPhaseIndex = 0;
    countInPhase = 0;
    if (circleRef.current) {
      circleRef.current.className =
        "w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center"; // Reset class
    }
  };

  const startBreathingAnimation = () => {
    setIsBreathing(true);
    currentPhaseIndex = 0;
    countInPhase = 0;

    const animate = () => {
      const currentPhaseConfig = phases[currentPhaseIndex];
      setBreathingPhase({
        text: currentPhaseConfig.text,
        scaleClass: currentPhaseConfig.scaleClass,
      });

      // Force reflow for CSS transition by toggling a class or directly manipulating style
      if (circleRef.current) {
        circleRef.current.className = `w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center transition-transform duration-1000 ease-in-out ${currentPhaseConfig.scaleClass}`;
      }

      countInPhase++;
      if (countInPhase >= currentPhaseConfig.duration) {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        countInPhase = 0;
      }
    };

    animate(); // Call once to start immediately
    intervalRef.current = setInterval(animate, 1000); // Update every second
  };

  useEffect(() => {
    // Cleanup interval on component unmount or if modal is closed while breathing
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // When modal closes externally, stop animation
  useEffect(() => {
    if (!isOpen && isBreathing) {
      stopBreathingAnimation();
    }
  }, [isOpen, isBreathing]);

  if (!isOpen) return null;

  return (
    <div
      id="breathingModal"
      className="fixed inset-0 bg-black bg-opacity-50 z-[55] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Breathing Exercise
        </h3>
        <div
          ref={circleRef}
          id="breathingCircle"
          className={`w-32 h-32 border-4 border-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center transition-transform duration-1000 ease-in-out ${breathingPhase.scaleClass}`}
        >
          <span
            id="breathingText"
            className="text-lg font-medium text-blue-600"
          >
            {breathingPhase.text}
          </span>
        </div>
        <p id="breathingInstruction" className="text-gray-600 mb-6">
          Follow the circle and breathe slowly
        </p>
        <div className="flex gap-4 justify-center">
          {!isBreathing ? (
            <button
              onClick={startBreathingAnimation}
              id="breathingStartBtn"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start
            </button>
          ) : (
            <button
              onClick={stopBreathingAnimation}
              id="breathingStopBtn"
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          )}
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
