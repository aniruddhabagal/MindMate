// components/MoodTrackerPage.js
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import { formatDate as formatDateUtil, moodEmojis } from "../lib/formatters"; // Assuming formatters.js is in lib

// Props: currentUser, getMoodChartDataAPI, getMoodEntriesAPI, moodDataVersion (to trigger refetch)
export default function MoodTrackerPage({
  currentUser,
  getMoodChartDataAPI,
  getMoodEntriesAPI,
  moodDataVersion,
}) {
  const [stats, setStats] = useState({
    streak: 0,
    thisWeekDominant: "N/A",
    total: 0,
    avgMood: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For overall page data
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [selectedChartDays, setSelectedChartDays] = useState(7);

  const calculateAndSetStats = useCallback((entries) => {
    if (!entries || entries.length === 0) {
      setStats({ streak: 0, thisWeekDominant: "N/A", total: 0, avgMood: 0 });
      setRecentEntries([]);
      return;
    }

    const total = entries.length;
    const sumOfScores = entries.reduce((sum, entry) => sum + entry.score, 0);
    const avgMood = total > 0 ? (sumOfScores / total).toFixed(1) : 0;

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.entryDate) - new Date(a.entryDate)
    );
    setRecentEntries(sortedEntries.slice(0, 3));

    let currentStreak = 0;
    if (sortedEntries.length > 0) {
      let todayForStreak = new Date();
      todayForStreak.setHours(0, 0, 0, 0);
      let expectedDate = new Date(todayForStreak);
      const firstEntryDate = new Date(sortedEntries[0].entryDate);
      firstEntryDate.setHours(0, 0, 0, 0);

      if (
        firstEntryDate.getTime() === todayForStreak.getTime() ||
        firstEntryDate.getTime() ===
          new Date(
            new Date(todayForStreak).setDate(todayForStreak.getDate() - 1)
          ).getTime()
      ) {
        // Corrected yesterday check
        currentStreak = 1;
        expectedDate = new Date(firstEntryDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDate = new Date(sortedEntries[i].entryDate);
          entryDate.setHours(0, 0, 0, 0);
          if (entryDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else if (entryDate.getTime() < expectedDate.getTime()) break;
        }
      }
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    const thisWeekEntries = entries.filter(
      (entry) => new Date(entry.entryDate) >= oneWeekAgo
    );
    let dominantMoodThisWeek = "N/A";
    if (thisWeekEntries.length > 0) {
      const moodCounts = thisWeekEntries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {});
      dominantMoodThisWeek = Object.keys(moodCounts).reduce((a, b) =>
        moodCounts[a] > moodCounts[b] ? a : b
      );
      dominantMoodThisWeek =
        dominantMoodThisWeek.charAt(0).toUpperCase() +
        dominantMoodThisWeek.slice(1);
    }
    setStats({
      streak: currentStreak,
      thisWeekDominant: dominantMoodThisWeek,
      total,
      avgMood,
    });
  }, []);

  const fetchMoodDataAndRenderChart = useCallback(
    async (days) => {
      if (!currentUser || !getMoodEntriesAPI || !getMoodChartDataAPI) {
        setIsLoading(false);
        // Clear chart if user logs out or API functions are not available
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
        calculateAndSetStats([]); // Clear stats
        return;
      }

      setIsLoading(true);
      try {
        const [allEntries, chartAPIData] = await Promise.all([
          getMoodEntriesAPI(),
          getMoodChartDataAPI(days),
        ]);

        calculateAndSetStats(allEntries);

        const labels = chartAPIData.map((entry) =>
          formatDateUtil(entry.entryDate, true)
        );
        const dataPoints = chartAPIData.map((entry) => entry.score);

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }
        if (chartRef.current) {
          // Ensure canvas ref is available
          chartInstanceRef.current = new Chart(
            chartRef.current.getContext("2d"),
            {
              type: "line",
              data: {
                labels: dataPoints.length > 0 ? labels : ["No Data"],
                datasets: [
                  {
                    label: "Mood Score",
                    data: dataPoints.length > 0 ? dataPoints : [],
                    borderColor: "#667eea",
                    backgroundColor: "rgba(102, 126, 234, 0.1)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: "#667eea",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                    pointRadius: 6,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: dataPoints.length > 0 },
                },
                scales: { y: { beginAtZero: true, max: 10 }, x: {} },
              },
            }
          );
        }
      } catch (error) {
        console.error("Failed to fetch mood data or render chart:", error);
        setStats({
          streak: 0,
          thisWeekDominant: "Error",
          total: 0,
          avgMood: 0,
        }); // Indicate error in stats
        setRecentEntries([]);
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentUser,
      getMoodEntriesAPI,
      getMoodChartDataAPI,
      calculateAndSetStats,
      formatDateUtil,
    ]
  );

  useEffect(() => {
    fetchMoodDataAndRenderChart(selectedChartDays);
  }, [
    currentUser,
    moodDataVersion,
    selectedChartDays,
    fetchMoodDataAndRenderChart,
  ]); // moodDataVersion from parent triggers refetch

  const handlePeriodChange = (e) => {
    setSelectedChartDays(parseInt(e.target.value));
  };

  if (!currentUser && !isLoading) {
    // Show login prompt only after initial loading attempt if no user
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
        <i className="fas fa-chart-line text-4xl mb-4 text-purple-400"></i>
        <p>Please login to view your mood tracker.</p>
      </div>
    );
  }
  if (isLoading && stats.total === 0) {
    // Show loading state if no data has been set yet
    return (
      <div className="text-center py-10 text-gray-500">
        Loading mood data...
      </div>
    );
  }

  return (
    <div id="mood-tracker" className="page active">
      <div className="max-w-6xl mx-auto">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.streak} days
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-fire text-green-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.thisWeekDominant}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-smile text-blue-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-calendar text-purple-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg. Mood</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgMood}/10
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-yellow-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Mood Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Mood Trends</h3>
            <select
              id="moodChartPeriodSelect"
              value={selectedChartDays}
              onChange={handlePeriodChange}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
            </select>
          </div>
          <div className="relative h-64 sm:h-72 md:h-80">
            <canvas ref={chartRef} id="moodChartCanvasInternal"></canvas>{" "}
            {/* Changed ID to avoid conflict with prop if any */}
          </div>
        </div>

        {/* Recent Mood Entries */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Entries
          </h3>
          <div id="recentMoodEntriesList" className="space-y-4">
            {isLoading && recentEntries.length === 0 && (
              <p className="text-center text-gray-500">Loading entries...</p>
            )}
            {!isLoading && recentEntries.length === 0 && (
              <p className="text-center text-gray-500">
                No recent mood entries logged.
              </p>
            )}
            {recentEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {moodEmojis[entry.mood.toLowerCase()] || moodEmojis.default}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {entry.mood}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDateUtil(entry.entryDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {entry.score}/10
                  </p>
                  {entry.notes && (
                    <p
                      className="text-xs text-gray-500 truncate w-24 hover:whitespace-normal hover:overflow-visible"
                      title={entry.notes}
                    >
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
