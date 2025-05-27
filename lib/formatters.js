// utils/formatters.js OR lib/formatters.js
export function formatDate(dateString, short = false) {
  if (!dateString) return ""; // Handle null or undefined dates
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (short) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

export function getUserInitials(username = "") {
  if (!username || typeof username !== "string") return "?";
  const names = username.trim().split(" ");
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return (names[0][0] + (names[names.length - 1][0] || "")).toUpperCase();
}

export const moodEmojis = {
  happy: "😊",
  sad: "😢",
  anxious: "😰",
  calm: "😌",
  stressed: "😵",
  default: "😐", // A default for moods not in the map
};

export function getMoodColor(mood) {
  const colors = {
    happy: "green",
    sad: "blue",
    anxious: "yellow",
    calm: "indigo",
    stressed: "red",
  };
  return colors[mood?.toLowerCase()] || "purple"; // Default color
}
