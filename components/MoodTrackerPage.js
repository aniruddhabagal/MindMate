// components/MoodTrackerPage.js
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import { formatDate as formatDateUtil, moodEmojis } from "../lib/formatters"; // Assuming formatters.js is in lib
import Loader from "./Loader";
import toast from "react-hot-toast";

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
  const [isLoading, setIsLoading] = useState(true); // Combined loading state for the page
  const chartRef = useRef(null); // Ref for the canvas DOM element
  const chartInstanceRef = useRef(null); // Ref for the Chart.js instance
  const [selectedChartDays, setSelectedChartDays] = useState(7); // Default to 7 days

  // Memoized function to calculate stats and update recent entries
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
    setRecentEntries(sortedEntries.slice(0, 3)); // Display top 3 recent

    let currentStreak = 0;
    if (sortedEntries.length > 0) {
      let todayForStreak = new Date();
      todayForStreak.setHours(0, 0, 0, 0);

      const firstEntryDate = new Date(sortedEntries[0].entryDate);
      firstEntryDate.setHours(0, 0, 0, 0);

      let expectedDate = new Date(todayForStreak); // Initialize expectedDate

      // Check if the most recent entry is today or yesterday to start a streak
      let streakStartDateCheck = new Date(todayForStreak);
      if (firstEntryDate.getTime() === streakStartDateCheck.getTime()) {
        // Entry today
        currentStreak = 1;
        expectedDate.setDate(streakStartDateCheck.getDate() - 1); // Expect yesterday
      } else {
        streakStartDateCheck.setDate(streakStartDateCheck.getDate() - 1); // Check for yesterday
        if (firstEntryDate.getTime() === streakStartDateCheck.getTime()) {
          // Entry yesterday
          currentStreak = 1;
          expectedDate.setDate(streakStartDateCheck.getDate() - 1); // Expect day before yesterday
        }
      }

      if (currentStreak > 0) {
        // Only continue if a streak has started
        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDate = new Date(sortedEntries[i].entryDate);
          entryDate.setHours(0, 0, 0, 0);
          if (entryDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else if (entryDate.getTime() < expectedDate.getTime()) {
            // Gap in days, streak broken
            break;
          }
          // If entryDate.getTime() > expectedDate.getTime(), it means multiple entries on the same expected day,
          // or an entry from a future date somehow got in (unlikely if sorted).
          // The current logic correctly expects distinct past days.
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
        acc[entry.mood.toLowerCase()] =
          (acc[entry.mood.toLowerCase()] || 0) + 1; // Use toLowerCase for consistency
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
  }, []); // Empty dependency array: this function's definition is stable

  // Function to fetch chart-specific data and render/update the chart
  const renderOrUpdateChart = useCallback(
    async (days) => {
      if (!currentUser || !getMoodChartDataAPI || !chartRef.current) {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
        // Don't set isLoading to false here, let the main data fetching effect handle it
        return;
      }

      // setIsLoading(true); // This might be handled by the calling effect already

      try {
        const chartAPIData = await getMoodChartDataAPI(days);
        const labels = (chartAPIData || []).map((entry) =>
          formatDateUtil(entry.entryDate, true)
        );
        const dataPoints = (chartAPIData || []).map((entry) => entry.score);

        const chartConfigData = {
          labels:
            dataPoints.length > 0 ? labels : ["No Mood Data for this Period"],
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
        };

        const chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: dataPoints.length > 0 },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
              ticks: { color: "#64748b" },
              grid: { color: "#f1f5f9" },
            },
            x: { ticks: { color: "#64748b" }, grid: { display: false } },
          },
        };

        if (chartInstanceRef.current) {
          chartInstanceRef.current.data = chartConfigData.data; // Update data directly
          chartInstanceRef.current.options = chartOptions; // Update options if they can change
          chartInstanceRef.current.update();
        } else if (chartRef.current) {
          // Ensure canvas element is available
          chartInstanceRef.current = new Chart(
            chartRef.current.getContext("2d"),
            {
              type: "line",
              data: chartConfigData,
              options: chartOptions,
            }
          );
        }
      } catch (error) {
        console.error("Failed to render mood chart:", error);
        toast.error(
          `Error loading chart: ${error.data?.message || error.message}`
        );
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
      }
      // setIsLoading(false); // Let the main data fetching effect handle the final isLoading
    },
    [currentUser, getMoodChartDataAPI, formatDateUtil]
  );

  // Main data fetching effect: runs on mount (if currentUser), or when user/moodDataVersion changes
  useEffect(() => {
    const loadAllData = async () => {
      if (!currentUser || !getMoodEntriesAPI) {
        calculateAndSetStats([]);
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
        setIsLoading(false);
        return;
      }

      console.log(
        "MoodTrackerPage: Main data fetch triggered. CurrentUser:",
        !!currentUser,
        "Version:",
        moodDataVersion
      ); // DEBUG
      setIsLoading(true);
      try {
        const allEntries = await getMoodEntriesAPI();
        calculateAndSetStats(allEntries || []);
        // After stats are calculated (which might be quick), then render chart for selected days
        // This ensures renderOrUpdateChart has the latest context if needed, though it fetches its own data
        await renderOrUpdateChart(selectedChartDays);
      } catch (error) {
        // Errors from getMoodEntriesAPI are handled in fetchAllEntriesForStats (now part of this)
        // Errors from renderOrUpdateChart are handled within it
        console.error(
          "MoodTrackerPage: Error in main data fetching sequence",
          error
        );
        // Ensure UI reflects error state if not already handled by sub-functions
        calculateAndSetStats([]);
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [
    currentUser,
    moodDataVersion,
    getMoodEntriesAPI,
    calculateAndSetStats,
    renderOrUpdateChart,
    selectedChartDays,
  ]);
  // ^^^ selectedChartDays is included here so the initial chart load uses the correct period.

  // Effect to update chart ONLY when selectedChartDays changes AFTER initial load
  // We need a way to distinguish initial load from subsequent period changes.
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false; // Set to false after first run
      return; // Don't run on initial mount, main useEffect handles initial chart render
    }

    if (currentUser && chartRef.current) {
      console.log(
        "MoodTrackerPage: Chart period changed by dropdown, re-rendering chart for days:",
        selectedChartDays
      ); // DEBUG
      setIsLoading(true); // Indicate chart specific loading
      renderOrUpdateChart(selectedChartDays).finally(() => setIsLoading(false));
    }
  }, [currentUser, selectedChartDays, renderOrUpdateChart]); // Only depends on these to re-render chart

  // Cleanup chart instance on component unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  const handlePeriodChange = (e) => {
    setSelectedChartDays(parseInt(e.target.value));
  };

  // JSX for loading states and login prompt (before main return)
  if (!currentUser && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10">
        <i className="fas fa-chart-line text-4xl mb-4 text-purple-400"></i>
        <p>Please login to view your mood tracker.</p>
      </div>
    );
  }

  if (
    isLoading &&
    (!stats || stats.total === 0) &&
    recentEntries.length === 0
  ) {
    // More specific initial loading for the whole page content
    return (
      <Loader
        show={true}
        text="Loading your mood insights..."
        fullPage={false}
      />
    );
  }

  return (
    <div id="mood-tracker" className="page active">
      {" "}
      {/* 'active' class is handled by parent */}
      <div className="max-w-6xl mx-auto">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {" "}
          {/* Adjusted grid for better spacing */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.streak} days
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-fire text-green-600 text-lg"></i>
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
                <i className="fas fa-smile text-blue-600 text-lg"></i>
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
                <i className="fas fa-calendar-alt text-purple-600 text-lg"></i>
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
                <i className="fas fa-chart-line text-yellow-600 text-lg"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Mood Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-900">Mood Trends</h3>
            <select
              id="moodChartPeriodSelect"
              value={selectedChartDays}
              onChange={handlePeriodChange}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70 w-full sm:w-auto"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
            </select>
          </div>
          <div className="relative h-64 sm:h-72 md:h-80 lg:h-96">
            {" "}
            {/* Increased height slightly */}
            <canvas ref={chartRef} id="moodChartCanvasInternal"></canvas>
            {isLoading &&
              !chartInstanceRef.current && ( // Show loader overlay if loading and no chart yet
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-2xl">
                  <Loader
                    show={true}
                    text="Loading chart..."
                    fullPage={false}
                  />
                </div>
              )}
          </div>
        </div>

        {/* Recent Mood Entries */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Entries
          </h3>
          <div id="recentMoodEntriesList" className="space-y-4">
            {isLoading && recentEntries.length === 0 && (
              <Loader
                show={true}
                text="Loading recent entries..."
                fullPage={false}
              />
            )}
            {!isLoading && recentEntries.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No recent mood entries logged.
              </p>
            )}
            {recentEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">
                    {moodEmojis[entry.mood.toLowerCase()] || moodEmojis.default}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 capitalize">
                      {entry.mood}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateUtil(entry.entryDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-800">
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
