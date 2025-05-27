// components/HomePage.js
"use client";

import { formatDate } from "@/lib/formatters";

// Props: username, onShowPage, onOpenBreathingExercise, onSelectMood
export default function HomePage({
  username,
  onShowPage,
  onOpenBreathingExercise,
  onSelectMood,
  recentActivities,
}) {
  const moodEmojis = [
    { mood: "happy", emoji: "😊", label: "Happy" },
    { mood: "sad", emoji: "😢", label: "Sad" },
    { mood: "anxious", emoji: "😰", label: "Anxious" },
    { mood: "calm", emoji: "😌", label: "Calm" },
    { mood: "stressed", emoji: "😵", label: "Stressed" },
  ];

  return (
    <div id="home" className="page active">
      {" "}
      {/* 'active' class will be controlled by parent state */}
      <div className="max-w-4xl mx-auto">
        {/* Welcome Card */}
        <div className="gradient-bg rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-2">
                Hello, {username || "Guest"}! 👋
              </h3>
              <p className="text-blue-100 text-lg">
                How are you feeling today?
              </p>
            </div>
            <div className="hidden md:block">
              <i className="fas fa-sun text-6xl opacity-20"></i>
            </div>
          </div>
        </div>

        {/* Quick Mood Check */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h4 className="text-xl font-semibold text-gray-900 mb-6">
            Quick Mood Check
          </h4>
          <div
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
            id="quickMoodGrid"
          >
            {moodEmojis.map(({ mood, emoji, label }) => (
              <div
                key={mood}
                className="mood-card bg-white border-2 border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
                data-mood={mood}
                onClick={() => onSelectMood(mood, emoji)} // Pass emoji for potential UI update, or just mood
                onKeyDown={(e) =>
                  e.key === "Enter" && onSelectMood(mood, emoji)
                }
                tabIndex={0} // Make it focusable
                role="button"
                aria-pressed="false" // This would need state to update
                aria-label={`Select mood: ${label}`}
              >
                <div className="text-3xl mb-2" aria-hidden="true">
                  {emoji}
                </div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div
            className="quick-action-card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onShowPage("chat")}
            data-action="chat"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-comments text-blue-600 text-xl"></i>
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Start Chatting</h5>
            <p className="text-gray-600 text-sm">
              Talk about what&apos;s on your mind
            </p>
          </div>
          <div
            className="quick-action-card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onShowPage("journal")}
            data-action="journal"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-pen text-green-600 text-xl"></i>
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">Journal Entry</h5>
            <p className="text-gray-600 text-sm">
              Reflect and write your thoughts
            </p>
          </div>
          <div
            className="quick-action-card bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={onOpenBreathingExercise}
            data-action="breathing"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-leaf text-purple-600 text-xl"></i>
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">
              Breathing Exercise
            </h5>
            <p className="text-gray-600 text-sm">Take a moment to breathe</p>
          </div>
        </div>

        {/* Recent Activity (This will need to be fetched and rendered dynamically) */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h4>
          <div id="recentActivityList" className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity._id || activity.title}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === "mood" ? "bg-green-100" : "bg-blue-100"
                    }`}
                  >
                    <i
                      className={`fas ${
                        activity.type === "mood"
                          ? "fa-heart text-green-600"
                          : "fa-comments text-blue-600"
                      } text-sm`}
                    ></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {activity.type === "mood"
                        ? `Mood Check: ${activity.mood}`
                        : `Journal: ${activity.title}`}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
